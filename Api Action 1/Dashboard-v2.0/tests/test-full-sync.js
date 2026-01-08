console.log('🔄 Testando sincronização...\n');

fetch('http://localhost:3001/api/sync', {
    method: 'POST'
})
.then(res => res.json())
.then(data => {
    console.log('✅ Resultado da sincronização:');
    console.log(JSON.stringify(data, null, 2));
    
    // Buscar inventário
    return fetch('http://localhost:3001/api/inventory');
})
.then(res => res.json())
.then(inv => {
    console.log('\n📊 Inventário atual:');
    console.log(`Total: ${inv.data.length} dispositivos`);
    
    const statusCount = {};
    inv.data.forEach(d => {
        statusCount[d.status] = (statusCount[d.status] || 0) + 1;
    });
    
    console.log('\nStatus:');
    Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
    });
})
.catch(err => {
    console.error('❌ Erro:', err.message);
});
