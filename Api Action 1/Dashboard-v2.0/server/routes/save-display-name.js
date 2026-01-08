import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'action1_inventory';

/**
 * Endpoint para receber Display Name do script PowerShell e salvar no MongoDB
 * POST /api/save-display-name
 * Body: { deviceName, displayName, username, hostname }
 */
export async function saveDisplayName(req, res) {
    try {
        console.log('\n🔄 ========================================');
        console.log('   SALVANDO DISPLAY NAME NO MONGODB');
        console.log('   ========================================\n');

        const { deviceName, displayName, username, hostname } = req.body;

        // Validar dados recebidos
        if (!deviceName && !hostname) {
            return res.status(400).json({
                success: false,
                error: 'Campo obrigatório: deviceName ou hostname'
            });
        }

        if (!displayName) {
            return res.status(400).json({
                success: false,
                error: 'Campo obrigatório: displayName'
            });
        }

        console.log('📥 Dados recebidos:');
        console.log(`   • Device: ${deviceName || hostname}`);
        console.log(`   • Display Name: ${displayName}`);
        console.log(`   • Username: ${username || 'N/A'}`);

        // Conectar ao MongoDB
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const collection = db.collection('devices');

        // Buscar dispositivo no MongoDB
        const searchName = hostname || deviceName.split('.')[0];
        
        const device = await collection.findOne({
            $or: [
                { nome: { $regex: searchName, $options: 'i' } },
                { dispositivo: { $regex: searchName, $options: 'i' } },
                { hostname: searchName }
            ]
        });

        if (!device) {
            await client.close();
            console.log(`❌ Dispositivo "${searchName}" não encontrado no MongoDB`);
            return res.status(404).json({
                success: false,
                error: `Dispositivo '${searchName}' não encontrado no banco de dados`,
                searchName
            });
        }

        console.log(`✅ Dispositivo encontrado: ${device.nome}`);

        // Atualizar adDisplayName
        const result = await collection.updateOne(
            { _id: device._id },
            { 
                $set: { 
                    adDisplayName: displayName,
                    updatedAt: new Date()
                } 
            }
        );

        await client.close();

        if (result.modifiedCount > 0) {
            console.log('✅ Display Name salvo com sucesso no MongoDB!');
            console.log(`   • ${device.nome} → ${displayName}`);
            
            console.log('\n✅ ========================================');
            console.log('   ATUALIZAÇÃO CONCLUÍDA!');
            console.log('   ========================================\n');

            res.json({
                success: true,
                deviceName: device.nome,
                displayName,
                message: 'Display Name salvo com sucesso no MongoDB!'
            });
        } else {
            console.log('⚠️ Nenhuma alteração realizada (valor já era o mesmo)');
            res.json({
                success: true,
                deviceName: device.nome,
                displayName,
                message: 'Display Name já estava salvo (sem alterações)'
            });
        }

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
