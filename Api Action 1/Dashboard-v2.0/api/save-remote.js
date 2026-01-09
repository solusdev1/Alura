// API Serverless para receber dados de dispositivos remotos
// Acessa MongoDB Atlas diretamente (não depende do servidor local)

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'action1_inventory';

export default async function handler(req, res) {
    // Apenas POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método não permitido' });
    }

    try {
        const { deviceName, displayName, username, hostname, city, publicIP } = req.body;

        // Validar dados
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

        console.log('📥 Dados recebidos de:', deviceName || hostname);
        console.log('   Display Name:', displayName);
        console.log('   Cidade:', city || 'N/A');
        console.log('   IP:', publicIP || 'N/A');

        // Conectar ao MongoDB Atlas
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const collection = db.collection('devices');

        // Buscar dispositivo
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
            console.log('❌ Dispositivo não encontrado:', searchName);
            return res.status(404).json({
                success: false,
                error: `Dispositivo '${searchName}' não encontrado no banco de dados`,
                searchName
            });
        }

        console.log('✅ Dispositivo encontrado:', device.nome);

        // Atualizar dados
        const updateFields = { 
            adDisplayName: displayName,
            updatedAt: new Date()
        };
        
        if (city) updateFields.city = city;
        if (publicIP) updateFields.lastPublicIP = publicIP;
        
        const result = await collection.updateOne(
            { _id: device._id },
            { $set: updateFields }
        );

        await client.close();

        if (result.modifiedCount > 0) {
            console.log('✅ Dados salvos com sucesso!');
            return res.status(200).json({
                success: true,
                deviceName: device.nome,
                displayName,
                city,
                message: 'Display Name e cidade salvos com sucesso'
            });
        } else {
            console.log('⚠️ Nenhuma modificação realizada');
            return res.status(200).json({
                success: true,
                deviceName: device.nome,
                displayName,
                city,
                message: 'Dados já estavam atualizados'
            });
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
