import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'action1_inventory';

/**
 * Endpoint para receber Display Name e Cidade do script PowerShell e salvar no MongoDB
 * POST /api/save-display-name
 * Body: { deviceName, displayName, username, hostname, city, publicIP }
 */
// Fluxo: valida payload -> encontra dispositivo -> atualiza campos manuais.
export async function saveDisplayName(req, res) {
    try {
        console.log('\n🔄 ========================================');
        console.log('   SALVANDO INFORMAÇÕES NO MONGODB');
        console.log('   ========================================\n');

        const { deviceName, displayName, username, hostname, city, publicIP } = req.body;

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
        console.log(`   • Cidade: ${city || 'N/A'}`);
        console.log(`   • IP Público: ${publicIP || 'N/A'}`);

        // Conectar ao MongoDB
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const collection = db.collection('devices');

        // Buscar dispositivo no MongoDB
        // Hostname tem prioridade; FQDN e reduzido para o host base.
        const searchName = hostname || deviceName.split('.')[0];
        
        // Busca flexivel para cobrir variacoes de nome entre as fontes.
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

        // Atualizar adDisplayName e cidade
        // Atualiza apenas campos complementares, mantendo base do inventario.
        const updateFields = { 
            adDisplayName: displayName,
            updatedAt: new Date()
        };
        
        // Adicionar cidade se fornecida
        if (city) {
            updateFields.city = city;
            console.log(`   • Adicionando cidade ao update: ${city}`);
        } else {
            console.log(`   ⚠️ Cidade não fornecida`);
        }
        
        // Adicionar IP público se fornecido
        if (publicIP) {
            updateFields.lastPublicIP = publicIP;
        }
        
        console.log(`   📝 Campos a atualizar:`, updateFields);
        
        const result = await collection.updateOne(
            { _id: device._id },
            { $set: updateFields }
        );

        await client.close();

        if (result.modifiedCount > 0) {
            console.log('✅ Informações salvas com sucesso no MongoDB!');
            console.log(`   • ${device.nome} → Display Name: ${displayName}`);
            if (city) console.log(`   • Cidade: ${city}`);
            
            console.log('\n✅ ========================================');
            console.log('   ATUALIZAÇÃO CONCLUÍDA!');
            console.log('   ========================================\n');

            res.json({
                success: true,
                deviceName: device.nome,
                displayName,
                city: city || device.city || 'N/A',
                message: 'Informações salvas com sucesso no MongoDB!'
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
