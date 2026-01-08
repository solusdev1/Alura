import credentials from './src/api/configs.js';

const ACTION1_BASE_URL = 'https://app.action1.com/api/3.0';

async function testPagination() {
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

        // Buscar org
        const orgRes = await fetch(`${ACTION1_BASE_URL}/organizations`, { headers });
        const orgData = await orgRes.json();
        const org = orgData.items[0];

        console.log(`Organização: ${org.name}\n`);

        // Teste 1: URL básica
        console.log('=== TESTE 1: URL Básica ===');
        const url1 = `${ACTION1_BASE_URL}/endpoints/managed/${org.id}?fields=*`;
        const res1 = await fetch(url1, { headers });
        const data1 = await res1.json();
        console.log(`Items retornados: ${data1.items?.length || 0}`);
        console.log(`Total na resposta: ${data1.total || 'N/A'}`);
        console.log(`Campos da resposta:`, Object.keys(data1));

        // Teste 2: Com limit maior
        console.log('\n=== TESTE 2: Com limit=100 ===');
        const url2 = `${ACTION1_BASE_URL}/endpoints/managed/${org.id}?fields=*&limit=100`;
        const res2 = await fetch(url2, { headers });
        const data2 = await res2.json();
        console.log(`Items retornados: ${data2.items?.length || 0}`);

        // Teste 3: Com offset
        console.log('\n=== TESTE 3: Com offset=50&limit=50 ===');
        const url3 = `${ACTION1_BASE_URL}/endpoints/managed/${org.id}?fields=*&offset=50&limit=50`;
        const res3 = await fetch(url3, { headers });
        const data3 = await res3.json();
        console.log(`Items retornados: ${data3.items?.length || 0}`);
        if (data3.items?.length > 0) {
            console.log(`Primeiro ID nesta página: ${data3.items[0].id}`);
        }

        // Teste 4: Comparar IDs
        if (data1.items && data3.items && data3.items.length > 0) {
            const id1 = data1.items[0]?.id;
            const id3 = data3.items[0]?.id;
            console.log(`\nPrimeiro ID da página 1: ${id1}`);
            console.log(`Primeiro ID da página 2 (offset 50): ${id3}`);
            console.log(`São diferentes? ${id1 !== id3 ? 'SIM - Paginação funciona!' : 'NÃO - Problema!'}`);
        }

        // Buscar todos manualmente
        console.log('\n=== BUSCANDO TODOS OS ENDPOINTS ===');
        let allEndpoints = [];
        let offset = 0;
        let limit = 50;
        
        while (true) {
            const url = `${ACTION1_BASE_URL}/endpoints/managed/${org.id}?fields=*&offset=${offset}&limit=${limit}`;
            const res = await fetch(url, { headers });
            const data = await res.json();
            const items = data.items || [];
            
            if (items.length === 0) break;
            
            allEndpoints = allEndpoints.concat(items);
            console.log(`Offset ${offset}: ${items.length} itens (total: ${allEndpoints.length})`);
            
            if (items.length < limit) break;
            offset += limit;
            
            if (offset > 500) {
                console.log('Limite de segurança');
                break;
            }
        }

        // Remover duplicatas
        const unique = Array.from(new Map(allEndpoints.map(e => [e.id, e])).values());
        console.log(`\n✅ Total final: ${unique.length} endpoints únicos`);
        console.log(`Duplicatas removidas: ${allEndpoints.length - unique.length}`);

    } catch (error) {
        console.error('Erro:', error.message);
    }
}

testPagination();
