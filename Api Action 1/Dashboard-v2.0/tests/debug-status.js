import credentials from './src/api/configs.js';

const ACTION1_BASE_URL = 'https://app.action1.com/api/3.0';

async function debugAPI() {
    try {
        // Autenticar
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

        // Buscar organizações
        const orgRes = await fetch(`${ACTION1_BASE_URL}/organizations`, { headers });
        const orgData = await orgRes.json();
        const org = orgData.items[0];

        console.log('=== TESTANDO ENDPOINTS GERENCIADOS ===\n');
        
        // Testar diferentes URLs
        const urls = [
            `${ACTION1_BASE_URL}/endpoints/managed/${org.id}`,
            `${ACTION1_BASE_URL}/endpoints/managed/${org.id}?fields=*`,
            `${ACTION1_BASE_URL}/endpoints/${org.id}`,
            `${ACTION1_BASE_URL}/endpoints/${org.id}?fields=*`,
        ];

        for (const url of urls) {
            console.log(`\nTestando: ${url}`);
            try {
                const res = await fetch(url, { headers });
                const data = await res.json();
                const items = data.items || [];
                
                console.log(`Total: ${items.length}`);
                
                if (items.length > 0) {
                    // Analisar status
                    const statusCount = {};
                    items.forEach(item => {
                        const status = item.status || 'sem_status';
                        statusCount[status] = (statusCount[status] || 0) + 1;
                    });
                    
                    console.log('Status encontrados:', statusCount);
                    
                    // Mostrar 2 primeiros dispositivos
                    console.log('\nPrimeiros 2 dispositivos:');
                    items.slice(0, 2).forEach((dev, i) => {
                        console.log(`\n${i + 1}. ${dev.name || dev.id}`);
                        console.log(`   Status: ${dev.status || 'N/A'}`);
                        console.log(`   Type: ${dev.type || 'N/A'}`);
                        console.log(`   Managed: ${dev.managed !== undefined ? dev.managed : 'N/A'}`);
                        console.log(`   Online: ${dev.online !== undefined ? dev.online : 'N/A'}`);
                        console.log(`   State: ${dev.state || 'N/A'}`);
                        console.log(`   Campos disponíveis:`, Object.keys(dev).join(', '));
                    });
                }
            } catch (err) {
                console.log(`Erro: ${err.message}`);
            }
        }

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

debugAPI();
