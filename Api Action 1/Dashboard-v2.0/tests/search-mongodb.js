import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'action1_inventory';

async function searchInMongoDB(searchName) {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado ao MongoDB');
        
        const db = client.db(DB_NAME);
        const collection = db.collection('devices');
        
        const device = await collection.findOne({
            $or: [
                { nome: { $regex: searchName, $options: 'i' } },
                { dispositivo: { $regex: searchName, $options: 'i' } },
                { hostname: { $regex: searchName, $options: 'i' } }
            ]
        });
        
        if (device) {
            console.log(`\n✅ Dispositivo encontrado no MongoDB:\n`);
            console.log(JSON.stringify(device, null, 2));
        } else {
            console.log(`\n❌ Dispositivo "${searchName}" não encontrado no MongoDB`);
        }
        
    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await client.close();
    }
}

const searchName = process.argv[2] || 'SJPCRONTB091';
searchInMongoDB(searchName);
