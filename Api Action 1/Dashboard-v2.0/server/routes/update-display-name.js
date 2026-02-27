import credentials from '../database/configs.js';

const ACTION1_BASE_URL = 'https://app.action1.com/api/3.0';

/**
 * Rota para receber dados do script PowerShell e atualizar custom attribute no Action1
 * Endpoint: POST /api/update-display-name
 * Body: { deviceName, displayName, username, hostname, domain }
 */
// Fluxo: autentica no Action1 -> encontra endpoint -> grava custom attribute.
export async function updateDisplayName(req, res) {
    try {
        console.log('\n🔄 ========================================');
        console.log('   ATUALIZAÇÃO DE DISPLAY NAME');
        console.log('   ========================================\n');

        const { deviceName, displayName, username, hostname, domain } = req.body;

        // Validar dados recebidos
        if (!deviceName || !displayName) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: deviceName, displayName'
            });
        }

        console.log('📥 Dados recebidos:');
        console.log(`   • Device: ${deviceName}`);
        console.log(`   • Display Name: ${displayName}`);
        console.log(`   • Username: ${username || 'N/A'}`);
        console.log(`   • Hostname: ${hostname || 'N/A'}`);

        // 1️⃣ Autenticar na API do Action1
        console.log('\n🔐 Autenticando na API Action1...');
        
        const authRes = await fetch(`${ACTION1_BASE_URL}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(credentials)
        });

        if (!authRes.ok) {
            throw new Error(`Falha na autenticação (${authRes.status})`);
        }

        const { access_token } = await authRes.json();
        console.log('✅ Autenticação bem-sucedida!');

        // Reaproveita headers autenticados em todas as chamadas ao Action1.
        const headers = {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
        };

        // 2️⃣ Obter organização
        console.log('\n🏢 Buscando organização...');
        const orgRes = await fetch(`${ACTION1_BASE_URL}/organizations`, { headers });
        
        if (!orgRes.ok) {
            throw new Error(`Erro ao buscar organização (${orgRes.status})`);
        }

        const orgData = await orgRes.json();
        const orgId = orgData.items[0]?.id;

        if (!orgId) {
            throw new Error('Organização não encontrada');
        }

        console.log(`✅ Organização: ${orgData.items[0].name} (${orgId})`);

        // 3️⃣ Buscar dispositivo
        console.log(`\n🔍 Buscando dispositivo: ${deviceName}...`);
        
        const endpointsUrl = `${ACTION1_BASE_URL}/endpoints/managed/${orgId}?fields=*&limit=200`;
        const endpointsRes = await fetch(endpointsUrl, { headers });
        
        if (!endpointsRes.ok) {
            throw new Error(`Erro ao buscar dispositivos (${endpointsRes.status})`);
        }

        const endpointsData = await endpointsRes.json();
        const devices = endpointsData.items || [];

        console.log(`   Total de dispositivos: ${devices.length}`);

        // Buscar de forma flexível (por deviceName ou hostname)
        // Busca tolerante para diferencas de nomenclatura entre hostname/device.
        const device = devices.find(d => 
            d.name === deviceName || 
            d.device_name === deviceName ||
            (hostname && d.name?.startsWith(hostname)) ||
            (hostname && d.device_name?.startsWith(hostname))
        );

        if (!device) {
            console.log('❌ Dispositivo não encontrado');
            console.log('   Primeiros 5 dispositivos disponíveis:');
            devices.slice(0, 5).forEach(d => console.log(`   - ${d.name || d.device_name}`));
            
            return res.status(404).json({
                success: false,
                error: `Dispositivo '${deviceName}' não encontrado na API`,
                deviceName
            });
        }

        console.log(`✅ Dispositivo encontrado: ${device.name} (ID: ${device.id})`);

        // 4️⃣ Atualizar custom attribute
        console.log('\n💾 Atualizando custom attribute...');

        // Obter custom attributes atuais ou criar array vazio
        // O PUT do Action1 exige o array custom completo (nao patch parcial).
        let customAttributes = device.custom || [];
        
        if (customAttributes.length === 0) {
            // Criar 30 custom attributes vazios
            console.log('   ℹ️ Criando custom attributes...');
            for (let i = 1; i <= 30; i++) {
                customAttributes.push({
                    name: `Custom Attribute ${i}`,
                    value: ''
                });
            }
        }

        // Encontrar ou criar "AD Display Name"
        const targetAttr = customAttributes.find(attr => attr.name === 'AD Display Name');
        
        if (targetAttr) {
            console.log('   ℹ️ Atualizando custom attribute existente');
            targetAttr.value = displayName;
        } else {
            console.log('   ℹ️ Usando Custom Attribute 1 para AD Display Name');
            customAttributes[0] = {
                name: 'AD Display Name',
                value: displayName
            };
        }

        // Preparar body com APENAS custom attributes
        const updateBody = {
            custom: customAttributes
        };

        // Fazer update via PUT
        const updateUrl = `${ACTION1_BASE_URL}/endpoints/managed/${orgId}/${device.id}`;
        console.log(`   📡 PUT ${updateUrl}`);

        const updateRes = await fetch(updateUrl, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updateBody)
        });

        if (!updateRes.ok) {
            const errorText = await updateRes.text();
            console.error(`❌ Erro ao atualizar (${updateRes.status}): ${errorText}`);
            throw new Error(`Erro ao atualizar dispositivo (${updateRes.status}): ${errorText.substring(0, 200)}`);
        }

        console.log('✅ Custom attribute atualizado com sucesso!');
        
        console.log('\n✅ ========================================');
        console.log('   ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('   ========================================\n');

        // Retornar sucesso
        res.json({
            success: true,
            deviceName: device.name,
            displayName,
            customAttribute: 'AD Display Name',
            message: 'Display Name salvo com sucesso!'
        });

    } catch (error) {
        console.error('\n❌ ERRO:', error.message);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
