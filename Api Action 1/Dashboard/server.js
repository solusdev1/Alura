import express from 'express';
import cors from 'cors';
import credentials from './src/api/configs.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Armazenamento em memória do inventário
let inventoryTable = [];
let lastUpdate = null;

const ACTION1_BASE_URL = 'https://app.action1.com/api/3.0';

// Função auxiliar para fazer requisições GET
async function apiGet(url, headers) {
    const res = await fetch(url, { headers });
    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
        throw new Error(`Erro API ${res.status}: ${text.substring(0, 300)}`);
    }

    if (!contentType.includes('application/json')) {
        throw new Error(`Resposta não JSON: ${text.substring(0, 300)}`);
    }

    return JSON.parse(text);
}

// Rota para buscar dados da API Action1 e armazenar
app.post('/api/sync', async (req, res) => {
    try {
        console.log('🔄 Sincronizando com Action1...');

        // 1️⃣ AUTENTICAÇÃO
        const authRes = await fetch(`${ACTION1_BASE_URL}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(credentials)
        });

        if (!authRes.ok) {
            throw new Error(`Falha na autenticação (${authRes.status})`);
        }

        const { access_token } = await authRes.json();

        const headers = {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json'
        };

        // 2️⃣ ORGANIZAÇÕES
        const orgData = await apiGet(`${ACTION1_BASE_URL}/organizations`, headers);
        const organizations = orgData.items || [];

        if (!organizations.length) {
            throw new Error('Nenhuma organização encontrada');
        }

        let todosOsEndpoints = [];

        // 3️⃣ ENDPOINTS (TODOS: GERENCIADOS, NÃO GERENCIADOS, ONLINE E OFFLINE)
        for (const org of organizations) {
            console.log(`🔎 Org: ${org.name} (${org.id})`);

            // Buscar endpoints gerenciados - buscar até conseguir todos ou esgotar tentativas
            console.log('   🔍 Buscando endpoints gerenciados...');
            let managedItems = [];
            let allUniqueIds = new Set();
            let offset = 0;
            const limit = 50;
            const expectedTotal = 88; // Total do HTML exportado
            let totalFromAPI = null;
            
            // Fazer múltiplas requisições até cobrir todos os possíveis offsets
            const maxOffset = 200; // Tentar até offset 200 para cobrir 88 itens
            
            while (offset <= maxOffset) {
                const managedUrl = `${ACTION1_BASE_URL}/endpoints/managed/${org.id}?fields=*&offset=${offset}&limit=${limit}`;
                console.log(`      📄 Offset ${offset} (únicos: ${allUniqueIds.size}/${expectedTotal})...`);
                
                try {
                    const managedData = await apiGet(managedUrl, headers);
                    const items = managedData.items || [];
                    
                    // Capturar total da API na primeira requisição
                    if (totalFromAPI === null && managedData.total !== undefined) {
                        totalFromAPI = managedData.total;
                        console.log(`         📊 Total reportado pela API: ${totalFromAPI}`);
                    }
                    
                    console.log(`         Retornados: ${items.length} itens`);
                    
                    if (items.length === 0) {
                        console.log(`         ⚠️ Nenhum item retornado, parando...`);
                        break;
                    }
                    
                    // Adicionar itens únicos
                    const beforeSize = allUniqueIds.size;
                    items.forEach(item => {
                        if (!allUniqueIds.has(item.id)) {
                            allUniqueIds.add(item.id);
                            managedItems.push(item);
                        }
                    });
                    
                    const newItems = allUniqueIds.size - beforeSize;
                    console.log(`         ➕ ${newItems} novos únicos (${items.length - newItems} duplicatas)`);
                    
                    offset += limit;
                    
                } catch (err) {
                    console.log(`         ❌ Erro: ${err.message}`);
                    break;
                }
            }
            
            console.log(`      ✅ Total gerenciados únicos encontrados: ${managedItems.length}`);
            if (totalFromAPI) {
                console.log(`      📊 API reportou total de: ${totalFromAPI} itens`);
            }
            
            // Buscar endpoints não gerenciados
            let unmanagedItems = [];
            try {
                console.log('   🔍 Buscando endpoints não gerenciados...');
                const unmanagedUrl = `${ACTION1_BASE_URL}/endpoints/unmanaged/${org.id}?fields=*&limit=200`;
                const unmanagedData = await apiGet(unmanagedUrl, headers);
                unmanagedItems = unmanagedData.items || [];
                console.log(`      ✅ Total não gerenciados: ${unmanagedItems.length}`);
            } catch (err) {
                console.log(`   ⚠️ Não foi possível buscar endpoints não gerenciados: ${err.message}`);
            }
            
            // Combinar e remover duplicatas
            const allItems = [...managedItems, ...unmanagedItems];
            const items = Array.from(new Map(allItems.map(item => [item.id, item])).values());
            
            if (allItems.length !== items.length) {
                console.log(`   🔄 Removidas ${allItems.length - items.length} duplicatas`);
            }
            
            // Contar status
            const connected = items.filter(d => d.status?.toLowerCase() === 'connected').length;
            const disconnected = items.filter(d => d.status?.toLowerCase() === 'disconnected').length;
            const outros = items.filter(d => d.status?.toLowerCase() !== 'connected' && d.status?.toLowerCase() !== 'disconnected').length;
            
            console.log(`\n   📊 TOTAL ORGANIZAÇÃO: ${items.length} dispositivos únicos`);
            console.log(`      🟢 Connected: ${connected}`);
            console.log(`      🔴 Disconnected: ${disconnected}`);
            console.log(`      ⚪ Outros: ${outros}\n`);

            const mapped = items.map(dev => {
                const hw = dev.hardware || {};
                const inv = dev.inventory || {};
            
                const getMemory = () =>
                    dev.memory_total ??
                    dev.memory_size ??
                    hw.memory_total ??
                    hw.memory_size ??
                    inv.memory?.total ??
                    null;
            
                const getDisk = () =>
                    dev.storage_total ??
                    dev.storage_total_size ??
                    hw.storage_total ??
                    hw.storage_total_size ??
                    inv.storage?.total ??
                    null;
            
                // Log para debug
                if (dev.status?.toLowerCase() !== 'connected') {
                    console.log(`      📍 ${dev.name || dev.id}: Status = ${dev.status || 'sem status'}`);
                }
                
                // Normalizar status
                let statusNormalizado = dev.status || 'Desconhecido';
                if (statusNormalizado.toLowerCase() === 'connected') {
                    statusNormalizado = 'Online';
                } else if (statusNormalizado.toLowerCase() === 'disconnected') {
                    statusNormalizado = 'Offline';
                }
            
                return {
                    id: dev.id,
                    nome: dev.name || dev.device_name || `Dispositivo-${dev.id}`,
                    dispositivo: dev.device_name || dev.name || 'N/A',
                    ip: dev.address || 'N/A',
                    mac: dev.MAC || 'N/A',
                    so: dev.OS || 'N/A',
                    usuario: dev.user || 'N/A',
                    status: statusNormalizado,
                    organizacao: org.name,
                    tipo: dev.type === 'Endpoint' ? 'Workstation' : (dev.type || 'Não especificado'),
                    modelo: dev.model || 'N/A',
                    fabricante: dev.manufacturer || 'N/A',
                    serial: dev.serial || 'N/A',
                    memoria: dev.RAM || getMemory() || 'N/A',
                    disco: dev.disk || getDisk() || 'N/A',
                    cpu: dev.CPU_name || dev.processor || 'N/A',
                    gerenciado: managedItems.includes(dev) ? 'Sim' : 'Não'
                };
            });

            todosOsEndpoints.push(...mapped);
        }

        // Armazenar no inventário
        inventoryTable = todosOsEndpoints;
        lastUpdate = new Date();

        // Estatísticas finais
        const totalOnline = todosOsEndpoints.filter(d => d.status?.toLowerCase() === 'online').length;
        const totalOffline = todosOsEndpoints.filter(d => d.status?.toLowerCase() === 'offline').length;
        const totalOutros = todosOsEndpoints.length - totalOnline - totalOffline;

        console.log(`\n✅ SINCRONIZAÇÃO COMPLETA`);
        console.log(`📦 Total de dispositivos: ${inventoryTable.length}`);
        console.log(`   🟢 Online: ${totalOnline}`);
        console.log(`   🔴 Offline: ${totalOffline}`);
        console.log(`   ⚪ Outros: ${totalOutros}\n`);

        res.json({
            success: true,
            total: inventoryTable.length,
            lastUpdate: lastUpdate,
            message: 'Inventário sincronizado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao sincronizar:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para obter o inventário armazenado
app.get('/api/inventory', (req, res) => {
    res.json({
        success: true,
        total: inventoryTable.length,
        lastUpdate: lastUpdate,
        data: inventoryTable
    });
});

// Rota para limpar o inventário
app.delete('/api/inventory', (req, res) => {
    inventoryTable = [];
    lastUpdate = null;
    res.json({
        success: true,
        message: 'Inventário limpo'
    });
});

// Rota de status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        server: 'running',
        inventoryCount: inventoryTable.length,
        lastUpdate: lastUpdate
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 Endpoints disponíveis:`);
    console.log(`   GET  /api/status      - Status do servidor`);
    console.log(`   GET  /api/inventory   - Obter inventário`);
    console.log(`   POST /api/sync        - Sincronizar com Action1`);
    console.log(`   DELETE /api/inventory - Limpar inventário`);
});
