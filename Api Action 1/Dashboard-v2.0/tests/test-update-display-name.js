// Script de teste para o endpoint de atualização de Display Name

const testData = {
    deviceName: "SJPCRONOT001.carrarologistica.com.br",
    hostname: "SJPCRONOT001",
    displayName: "David - Suporte Ti CARRARO LOGISTICA",
    username: "suporteti",
    domain: "carrarolog"
};

console.log('🧪 TESTE DO ENDPOINT /api/update-display-name\n');
console.log('📤 Enviando dados:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n📡 Fazendo requisição POST...\n');

fetch('http://localhost:3002/api/update-display-name', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => {
    console.log('✅ Resposta recebida:\n');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
        console.log('\n✅ TESTE BEM-SUCEDIDO!');
        console.log(`   • Dispositivo: ${data.deviceName}`);
        console.log(`   • Display Name: ${data.displayName}`);
        console.log(`   • Custom Attribute: ${data.customAttribute}`);
    } else {
        console.log('\n❌ TESTE FALHOU!');
        console.log(`   Erro: ${data.error}`);
    }
})
.catch(error => {
    console.error('\n❌ ERRO NA REQUISIÇÃO:');
    console.error(error.message);
});
