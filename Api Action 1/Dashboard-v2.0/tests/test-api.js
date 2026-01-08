import credentials from './src/api/configs.js';

const ACTION1_BASE_URL = 'https://app.action1.com/api/3.0';

console.log('🧪 Testando API Action1...\n');

async function testAPI() {
    try {
        // 1️⃣ TESTE DE AUTENTICAÇÃO
        console.log('1️⃣ Testando autenticação...');
        console.log('Credenciais:', {
            grant_type: credentials.grant_type,
            client_id: credentials.client_id.substring(0, 20) + '...',
            scope: credentials.scope
        });

        const authRes = await fetch(`${ACTION1_BASE_URL}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(credentials)
        });

        console.log('Status da autenticação:', authRes.status);

        if (!authRes.ok) {
            const errorText = await authRes.text();
            console.error('❌ Erro na autenticação:', errorText);
            return;
        }

        const authData = await authRes.json();
        console.log('✅ Autenticação bem-sucedida!');
        console.log('Token recebido:', authData.access_token.substring(0, 20) + '...\n');

        const headers = {
            Authorization: `Bearer ${authData.access_token}`,
            Accept: 'application/json'
        };

        // 2️⃣ TESTE DE ORGANIZAÇÕES
        console.log('2️⃣ Testando busca de organizações...');
        const orgRes = await fetch(`${ACTION1_BASE_URL}/organizations`, { headers });
        
        console.log('Status organizações:', orgRes.status);
        
        if (!orgRes.ok) {
            const errorText = await orgRes.text();
            console.error('❌ Erro ao buscar organizações:', errorText);
            return;
        }

        const orgData = await orgRes.json();
        console.log('✅ Organizações encontradas:', orgData.items?.length || 0);
        
        if (orgData.items && orgData.items.length > 0) {
            console.log('Organizações:');
            orgData.items.forEach(org => {
                console.log(`  - ${org.name} (ID: ${org.id})`);
            });
        }

        // 3️⃣ TESTE DE ENDPOINTS
        if (orgData.items && orgData.items.length > 0) {
            const org = orgData.items[0];
            console.log(`\n3️⃣ Testando busca de endpoints para: ${org.name}...`);
            
            const endpointUrl = `${ACTION1_BASE_URL}/endpoints/managed/${org.id}?fields=*`;
            console.log('URL:', endpointUrl);
            
            const endpointRes = await fetch(endpointUrl, { headers });
            console.log('Status endpoints:', endpointRes.status);
            
            if (!endpointRes.ok) {
                const errorText = await endpointRes.text();
                console.error('❌ Erro ao buscar endpoints:', errorText);
                return;
            }

            const endpointData = await endpointRes.json();
            console.log('✅ Endpoints encontrados:', endpointData.items?.length || 0);
            
            if (endpointData.items && endpointData.items.length > 0) {
                console.log('\nPrimeiros 3 dispositivos:');
                endpointData.items.slice(0, 3).forEach((dev, idx) => {
                    console.log(`\n  Dispositivo ${idx + 1}:`);
                    console.log(`    ID: ${dev.id}`);
                    console.log(`    Nome: ${dev.name}`);
                    console.log(`    IP: ${dev.address || 'N/A'}`);
                    console.log(`    SO: ${dev.OS || 'N/A'}`);
                    console.log(`    Status: ${dev.status || 'N/A'}`);
                    console.log(`    Tipo: ${dev.type || 'N/A'}`);
                });

                console.log('\n✅ TODOS OS TESTES PASSARAM!');
                console.log(`\n📊 Total de dispositivos disponíveis: ${endpointData.items.length}`);
            } else {
                console.log('⚠️  Nenhum endpoint encontrado nesta organização');
            }
        }

    } catch (error) {
        console.error('\n❌ ERRO GERAL:', error.message);
        console.error('Stack:', error.stack);
    }
}

testAPI();
