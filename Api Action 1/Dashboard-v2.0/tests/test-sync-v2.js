// Script de teste para sincronização
console.log('🧪 Iniciando teste de sincronização...\n');

async function testarSincronizacao() {
    try {
        console.log('📡 Fazendo requisição POST para http://localhost:3002/api/sync\n');
        
        const response = await fetch('http://localhost:3002/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        
        console.log('✅ Resposta recebida:');
        console.log(JSON.stringify(data, null, 2));
        
        // Verificar inventário
        console.log('\n📦 Consultando inventário...\n');
        const invResponse = await fetch('http://localhost:3002/api/inventory');
        const invData = await invResponse.json();
        
        console.log(`Total de dispositivos: ${invData.total}`);
        console.log(`Última sincronização: ${invData.lastUpdate}`);
        console.log(`Status: ${invData.syncStatus}`);
        if (invData.stats) {
            console.log('\n📊 Estatísticas:');
            console.log(`   🟢 Online: ${invData.stats.online}`);
            console.log(`   🔴 Offline: ${invData.stats.offline}`);
            console.log(`   ⚙️  Gerenciados: ${invData.stats.gerenciados}`);
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

testarSincronizacao();
