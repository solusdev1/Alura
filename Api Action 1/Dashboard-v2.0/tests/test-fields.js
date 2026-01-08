import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env'), override: true });

const ACTION1_BASE_URL = 'https://app.action1.com/api/3.0';

const credentials = {
    grant_type: 'client_credentials',
    client_id: process.env.ACTION1_CLIENT_ID || '',
    client_secret: process.env.ACTION1_CLIENT_SECRET || '',
    scope: 'api'
};

async function testFields() {
    try {
        console.log('🔐 Autenticando...');
        const authRes = await fetch(`${ACTION1_BASE_URL}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(credentials)
        });

        const { access_token } = await authRes.json();
        
        const headers = {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json'
        };

        console.log('🔍 Buscando organizações...');
        const orgRes = await fetch(`${ACTION1_BASE_URL}/organizations`, { headers });
        const orgData = await orgRes.json();
        const orgId = orgData.items[0].id;
        
        console.log(`📦 Organização: ${orgData.items[0].name} (${orgId})`);
        console.log('\n🔍 Buscando dispositivo SJPCRONOT001...');
        
        // Buscar endpoint específico
        const endpointRes = await fetch(
            `${ACTION1_BASE_URL}/endpoints/managed/${orgId}?fields=*&limit=100`,
            { headers }
        );
        
        const endpointData = await endpointRes.json();
        const device = endpointData.items.find(d => 
            d.name?.toLowerCase().includes('sjpcronot001')
        );
        
        if (device) {
            console.log('\n✅ Dispositivo encontrado!');
            console.log('\n📋 TODOS OS CAMPOS DO DISPOSITIVO:\n');
            console.log(JSON.stringify(device, null, 2));
            
            // Salvar em arquivo
            const outputPath = join(__dirname, 'device-fields-output.json');
            fs.writeFileSync(outputPath, JSON.stringify(device, null, 2));
            console.log(`\n💾 Dados salvos em: ${outputPath}`);
            
            // Verificar se há campos personalizados
            console.log('\n🔍 CAMPOS POTENCIALMENTE RELEVANTES:');
            console.log('-----------------------------------');
            
            if (device.custom_fields) {
                console.log('\n📌 Custom Fields:', JSON.stringify(device.custom_fields, null, 2));
            }
            
            if (device.properties) {
                console.log('\n📌 Properties:', JSON.stringify(device.properties, null, 2));
            }
            
            if (device.comment) {
                console.log('\n📌 Comment:', device.comment);
            }
            
            if (device.description) {
                console.log('\n📌 Description:', device.description);
            }
            
            if (device.display_name) {
                console.log('\n📌 Display Name:', device.display_name);
            }
            
            if (device.user_display_name) {
                console.log('\n📌 User Display Name:', device.user_display_name);
            }
            
            // Procurar por qualquer campo que contenha "display" ou "name"
            console.log('\n🔍 Campos com "display" ou "name":');
            Object.keys(device).forEach(key => {
                if (key.toLowerCase().includes('display') || key.toLowerCase().includes('name')) {
                    console.log(`   ${key}:`, device[key]);
                }
            });
            
        } else {
            console.log('\n❌ Dispositivo SJPCRONOT001 não encontrado');
            console.log('Dispositivos disponíveis:');
            endpointData.items.slice(0, 5).forEach(d => {
                console.log(`   - ${d.name || d.device_name}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testFields();
