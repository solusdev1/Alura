import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = 'action1_inventory';

async function checkDisplayNames() {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        console.log('✅ Conectado ao MongoDB\n');
        
        const db = client.db(DB_NAME);
        const collection = db.collection('devices');
        
        // Buscar dispositivos COM Display Name
        const comDisplayName = await collection.find(
            { 
                adDisplayName: { $ne: '', $exists: true } 
            },
            { 
                projection: { nome: 1, usuario: 1, adDisplayName: 1, status: 1, _id: 0 } 
            }
        ).sort({ nome: 1 }).toArray();
        
        // Buscar dispositivos SEM Display Name
        const semDisplayName = await collection.find(
            { 
                $or: [
                    { adDisplayName: '' },
                    { adDisplayName: { $exists: false } }
                ]
            },
            { 
                projection: { nome: 1, usuario: 1, status: 1, _id: 0 } 
            }
        ).sort({ nome: 1 }).toArray();
        
        console.log('📊 ========================================');
        console.log(`   DISPOSITIVOS COM DISPLAY NAME: ${comDisplayName.length}`);
        console.log('   ========================================\n');
        
        comDisplayName.forEach((d, i) => {
            console.log(`${i + 1}. ${d.nome}`);
            console.log(`   Usuário: ${d.usuario}`);
            console.log(`   Display Name: ${d.adDisplayName}`);
            console.log(`   Status: ${d.status}\n`);
        });
        
        console.log('\n❌ ========================================');
        console.log(`   DISPOSITIVOS SEM DISPLAY NAME: ${semDisplayName.length}`);
        console.log('   ========================================\n');
        
        semDisplayName.forEach((d, i) => {
            console.log(`${i + 1}. ${d.nome}`);
            console.log(`   Usuário: ${d.usuario}`);
            console.log(`   Status: ${d.status}\n`);
        });
        
        console.log('\n📈 RESUMO:');
        console.log(`   ✅ Com Display Name: ${comDisplayName.length}`);
        console.log(`   ❌ Sem Display Name: ${semDisplayName.length}`);
        console.log(`   📦 Total: ${comDisplayName.length + semDisplayName.length}\n`);
        
        await client.close();
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

checkDisplayNames();
