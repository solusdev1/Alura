import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env'), override: true });

const MONGODB_URI = process.env.MONGODB_URI;

async function testCustomField() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log('✅ Conectado ao MongoDB\n');
        
        const db = client.db('action1_inventory');
        const collection = db.collection('devices');
        
        // Buscar dispositivo SJPCRONOT001
        const device = await collection.findOne({ 
            nome: { $regex: /sjpcronot001/i } 
        });
        
        if (device) {
            console.log('✅ Dispositivo encontrado: ' + device.nome);
            console.log('\n📋 Campo CUSTOM:');
            console.log('================');
            
            if (device.custom && Array.isArray(device.custom)) {
                console.log(`\n📦 Total de custom attributes: ${device.custom.length}`);
                
                // Mostrar apenas os que têm valor
                const withValue = device.custom.filter(c => c.value && c.value !== '');
                console.log(`✅ Com valor preenchido: ${withValue.length}\n`);
                
                if (withValue.length > 0) {
                    console.log('Valores encontrados:');
                    withValue.forEach(attr => {
                        console.log(`   📌 ${attr.name}: ${attr.value}`);
                    });
                } else {
                    console.log('⚠️ Nenhum custom attribute com valor preenchido ainda.');
                    console.log('\nPrimeiros 5 custom attributes (vazios):');
                    device.custom.slice(0, 5).forEach(attr => {
                        console.log(`   - ${attr.name}: "${attr.value}"`);
                    });
                }
            } else {
                console.log('❌ Campo custom não encontrado ou não é array');
            }
            
            console.log('\n📊 Outros campos do dispositivo:');
            console.log(`   Nome: ${device.nome}`);
            console.log(`   Usuário: ${device.usuario}`);
            console.log(`   Status: ${device.status}`);
            console.log(`   Serial: ${device.serial}`);
            
        } else {
            console.log('❌ Dispositivo SJPCRONOT001 não encontrado no banco');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await client.close();
        console.log('\n🔌 Conexão fechada');
    }
}

testCustomField();
