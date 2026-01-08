// Teste simples da API
async function testSync() {
    try {
        console.log('Testando sincronização com Action1...');
        
        const response = await fetch('http://localhost:3001/api/sync', {
            method: 'POST',
        });

        const data = await response.json();
        console.log('Resultado:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log(`\n✅ Sincronização bem-sucedida!`);
            console.log(`Total de dispositivos: ${data.total}`);
        } else {
            console.log(`\n❌ Erro: ${data.error}`);
        }
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testSync();
