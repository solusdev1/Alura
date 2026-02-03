import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import credentials from './database/configs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import {
    saveDevices,
    getAllDevices,
    getDevicesByStatus,
    getSyncMetadata,
    clearInventory,
    getStats,
    updateSyncStatus,
    closeDB,
    deleteDevicesByIds
} from './database/database.js';

import { updateDisplayName } from './routes/update-display-name.js';
import { saveDisplayName } from './routes/save-display-name.js';

const app = express();
const PORT = 3002;

// 🔒 SEGURANÇA: Helmet.js - Headers de segurança
app.use(helmet({
    contentSecurityPolicy: false, // Desabilitado para desenvolvimento
    crossOriginEmbedderPolicy: false
}));

// 🔒 SEGURANÇA: Rate Limiting - Prevenir abuso de API
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limite de 100 requisições por IP
    message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// 🔒 SEGURANÇA: CORS Whitelist - Apenas origens confiáveis
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3002',
    'https://inventario-two-gamma.vercel.app',
    'https://inventario-*.vercel.app' // Permitir previews do Vercel
];

app.use(cors({
    origin: function (origin, callback) {
        // Permitir requisições sem origin (Postman, curl, etc.)
        if (!origin) return callback(null, true);
        
        // Verificar se a origin está na whitelist
        const isAllowed = allowedOrigins.some(allowed => {
            if (allowed.includes('*')) {
                const regex = new RegExp('^' + allowed.replace('*', '.*') + '$');
                return regex.test(origin);
            }
            return allowed === origin;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS bloqueado: ${origin}`);
            callback(new Error('Origin não permitida pelo CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' })); // Limitar tamanho do body

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

// Função principal de sincronização
async function performSync() {
    try {
        console.log('🔄 Iniciando sincronização com Action1...');
        updateSyncStatus('syncing', 0);

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

        // 3️⃣ ENDPOINTS COM PAGINAÇÃO CORRETA
        for (const org of organizations) {
            console.log(`🔎 Org: ${org.name} (${org.id})`);

            // Buscar endpoints gerenciados com paginação usando 'from'
            console.log('   🔍 Buscando endpoints gerenciados...');
            let managedItems = [];
            let allUniqueIds = new Set();
            let from = 0;
            const limit = 50;
            let hasMore = true;
            
            while (hasMore) {
                const managedUrl = `${ACTION1_BASE_URL}/endpoints/managed/${org.id}?fields=*&limit=${limit}&from=${from}`;
                console.log(`      📄 Buscando a partir de ${from} (únicos: ${allUniqueIds.size})...`);
                
                try {
                    const managedData = await apiGet(managedUrl, headers);
                    const items = managedData.items || [];
                    const totalItems = managedData.total_items || managedData.total || 0;
                    
                    console.log(`         📊 Total na API: ${totalItems} | Retornados: ${items.length}`);
                    
                    if (items.length === 0) {
                        console.log(`         ⚠️ Nenhum item retornado, finalizando...`);
                        hasMore = false;
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
                    
                    // Verificar se há próxima página
                    if (managedData.next_page) {
                        // Incrementar 'from' pelo limite
                        from += limit;
                        console.log(`         🔗 Próxima página disponível: ${managedData.next_page}`);
                    } else {
                        // Verificar se já pegamos todos os itens
                        if (allUniqueIds.size >= totalItems || items.length < limit) {
                            console.log(`         ✅ Todos os itens foram recuperados`);
                            hasMore = false;
                        } else {
                            from += limit;
                        }
                    }
                    
                } catch (err) {
                    console.log(`         ❌ Erro: ${err.message}`);
                    hasMore = false;
                }
            }
            
            console.log(`      ✅ Total gerenciados únicos encontrados: ${managedItems.length}`);
            
            // Buscar endpoints não gerenciados
            let unmanagedItems = [];
            try {
                console.log('   🔍 Buscando endpoints não gerenciados...');
                let fromUnmanaged = 0;
                let hasMoreUnmanaged = true;
                
                while (hasMoreUnmanaged) {
                    const unmanagedUrl = `${ACTION1_BASE_URL}/endpoints/unmanaged/${org.id}?fields=*&limit=${limit}&from=${fromUnmanaged}`;
                    const unmanagedData = await apiGet(unmanagedUrl, headers);
                    const items = unmanagedData.items || [];
                    
                    if (items.length === 0) {
                        hasMoreUnmanaged = false;
                        break;
                    }
                    
                    unmanagedItems.push(...items);
                    
                    if (unmanagedData.next_page && items.length === limit) {
                        fromUnmanaged += limit;
                    } else {
                        hasMoreUnmanaged = false;
                    }
                }
                
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

            // Mapear dados para formato consistente
            const mapped = items.map(dev => {
                const hw = dev.hardware || {};
                const inv = dev.inventory || {};

                const custom = dev.custom || [];
                const adDisplayName = 
                custom.find(c => c.name === 'AD Display Name')?.value || '';
            
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
                
                // Normalizar status
                let statusNormalizado = dev.status || 'Desconhecido';
                if (statusNormalizado.toLowerCase() === 'connected') {
                    statusNormalizado = 'Online';
                } else if (statusNormalizado.toLowerCase() === 'disconnected') {
                    statusNormalizado = 'Offline';
                }
                
                // Determinar tipo de dispositivo
                const nomeDispositivo = dev.name || dev.device_name || '';
                let tipoDispositivo = dev.type || 'Não especificado';
                
                // Se o nome contém SJPCRONOT, é um notebook
                if (nomeDispositivo.includes('SJPCRONOT')) {
                    tipoDispositivo = 'Notebook';
                } else if (dev.type === 'Endpoint') {
                    tipoDispositivo = 'Workstation';
                }
            
                return {
                    id: dev.id,
                    nome: dev.name || dev.device_name || `Dispositivo-${dev.id}`,
                    dispositivo: dev.device_name || dev.name || 'N/A',
                    ip: dev.address || 'N/A',
                    mac: dev.MAC || 'N/A',
                    so: dev.OS || 'N/A',
                    usuario: (dev.user || 'N/A').replace(/\\/g, '/'),
                    adDisplayName,
                    status: statusNormalizado,
                    organizacao: org.name,
                    tipo: tipoDispositivo,
                    // modelo: dev.CPU_model || dev.CPUmodel || dev.hardware_model || 'N/A',
                    fabricante: dev.manufacturer || 'N/A',
                    serial: dev.serial || 'N/A',
                    memoria: dev.RAM || getMemory() || 'N/A',
                    disco: dev.disk || getDisk() || 'N/A',
                    cpu: dev.CPU_name || dev.processor || 'N/A',
                    gerenciado: managedItems.some(m => m.id === dev.id) ? 'Sim' : 'Não',
                    last_seen: dev.last_seen || null,
                    agent_version: dev.agent_version || null,
                    vulnerabilities: dev.vulnerabilities || { critical: 0, other: 0 },
                    missing_updates: dev.missing_updates || { critical: 0, other: 0 },
                    custom: dev.custom || []
                };
            });

            todosOsEndpoints.push(...mapped);
        }

        // 4️⃣ REMOVER DUPLICATAS (priorizar Online sobre Offline)
        console.log('🔄 Removendo duplicatas (priorizando dispositivos Online)...');
        const deviceMap = new Map();
        
        todosOsEndpoints.forEach(device => {
            const nome = device.nome.toLowerCase();
            
            if (!deviceMap.has(nome)) {
                // Primeiro dispositivo com este nome
                deviceMap.set(nome, device);
            } else {
                // Já existe um dispositivo com este nome
                const existing = deviceMap.get(nome);
                
                // Priorizar Online sobre Offline
                if (device.status === 'Online' && existing.status === 'Offline') {
                    console.log(`   🔄 Substituindo ${nome}: Offline → Online`);
                    deviceMap.set(nome, device);
                } else if (device.status === 'Online' && existing.status === 'Online') {
                    // Se ambos online, manter o mais recente
                    if (device.last_seen > existing.last_seen) {
                        console.log(`   🔄 Substituindo ${nome}: Online (mais recente)`);
                        deviceMap.set(nome, device);
                    }
                } else if (device.status === 'Offline' && existing.status === 'Offline') {
                    // Se ambos offline, manter o mais recente
                    if (device.last_seen > existing.last_seen) {
                        deviceMap.set(nome, device);
                    }
                }
                // Se device é Offline e existing é Online, manter existing (não faz nada)
            }
        });
        
        const totalAntes = todosOsEndpoints.length;
        todosOsEndpoints = Array.from(deviceMap.values());
        const totalDepois = todosOsEndpoints.length;
        const duplicatasRemovidas = totalAntes - totalDepois;
        
        if (duplicatasRemovidas > 0) {
            console.log(`✅ ${duplicatasRemovidas} duplicatas removidas (${totalAntes} → ${totalDepois})`);
        }

        // 5️⃣ SALVAR NO BANCO DE DADOS
        console.log('💾 Salvando no banco de dados...');
        await saveDevices(todosOsEndpoints);

        // Estatísticas finais
        const stats = await getStats();
        
        console.log(`\n✅ SINCRONIZAÇÃO COMPLETA E SALVA NO BANCO`);
        console.log(`📦 Total de dispositivos: ${stats.total}`);
        console.log(`   🟢 Online: ${stats.online}`);
        console.log(`   🔴 Offline: ${stats.offline}`);
        console.log(`   ⚙️  Gerenciados: ${stats.gerenciados}\n`);

        return {
            success: true,
            total: stats.total,
            stats: stats,
            message: 'Inventário sincronizado e salvo com sucesso'
        };

    } catch (error) {
        console.error('❌ Erro ao sincronizar:', error.message);
        updateSyncStatus('error', 0);
        throw error;
    }
}

// Rota para sincronização manual
app.post('/api/sync', async (req, res) => {
    try {
        const result = await performSync();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para obter o inventário do banco de dados (offline)
app.get('/api/inventory', async (req, res) => {
    try {
        const devices = await getAllDevices();
        const metadata = await getSyncMetadata();
        const stats = await getStats();
        
        res.json({
            success: true,
            total: devices.length,
            lastUpdate: metadata.last_sync,
            syncStatus: metadata.status,
            stats: stats,
            data: devices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para obter inventário filtrado por status
app.get('/api/inventory/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        
        // 🔒 Validar e sanitizar status
        const validStatuses = ['online', 'offline', 'connected', 'disconnected'];
        const sanitizedStatus = status.toLowerCase().trim();
        
        if (!validStatuses.includes(sanitizedStatus)) {
            return res.status(400).json({ 
                error: 'Status inválido',
                validStatuses: validStatuses,
                received: status
            });
        }
        const devices = await getDevicesByStatus(status);
        
        res.json({
            success: true,
            total: devices.length,
            status: status,
            data: devices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para limpar o inventário
app.delete('/api/inventory', async (req, res) => {
    try {
        await clearInventory();
        res.json({
            success: true,
            message: 'Inventário limpo do banco de dados'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota para remover dispositivos por IDs
app.post('/api/inventory/delete', async (req, res) => {
    try {
        const { ids } = req.body || {};

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Lista de IDs inválida'
            });
        }

        const result = await deleteDevicesByIds(ids);

        res.json({
            success: true,
            deleted: result.deletedCount || 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🆕 Rota para atualizar Display Name do PowerShell
app.post('/api/update-display-name', updateDisplayName);

// 🆕 Rota para salvar Display Name direto no MongoDB (bypass Action1 API)
app.post('/api/save-display-name', saveDisplayName);

// Rota para exportar CSV
app.get('/api/export/csv', async (req, res) => {
    try {
        const devices = await getAllDevices();
        
        // Cabeçalhos CSV
        const headers = [
            'ID', 'Nome', 'Tipo', 'Responsável', 'Email', 'IP', 'MAC', 
            'Sistema Operacional', 'Status', 'Organização', 'Modelo',
            'Fabricante', 'Serial', 'Memória', 'Disco', 'CPU', 
            'Gerenciado', 'Última Visualização', 'Versão do Agente'
        ];
        
        // Converter dados para CSV
        let csv = headers.join(',') + '\n';
        
        devices.forEach(device => {
            const email = device.usuario ? 
                `${device.usuario.toLowerCase().replace(/\\/g, '').replace(/\s/g, '.').replace(/carrarolog/g, '')}@carrarologistica.com.br` : 
                'N/A';
            
            const row = [
                device.id || '',
                `"${(device.nome || 'N/A').replace(/"/g, '""')}"`,
                device.tipo || 'N/A',
                `"${(device.usuario || 'N/A').replace(/"/g, '""')}"`,
                email,
                device.ip || 'N/A',
                device.mac || 'N/A',
                `"${(device.so || 'N/A').replace(/"/g, '""')}"`,
                device.status || 'N/A',
                `"${(device.organizacao || 'N/A').replace(/"/g, '""')}"`,
                device.modelo || 'N/A',
                `"${(device.fabricante || 'N/A').replace(/"/g, '""')}"`,
                device.serial || 'N/A',
                device.memoria || 'N/A',
                device.disco || 'N/A',
                `"${(device.cpu || 'N/A').replace(/"/g, '""')}"`,
                device.gerenciado || 'N/A',
                device.last_seen || 'N/A',
                device.agent_version || 'N/A'
            ];
            
            csv += row.join(',') + '\n';
        });
        
        // Configurar headers para download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="inventario_ti_${new Date().toISOString().split('T')[0]}.csv"`);
        res.send('\ufeff' + csv); // BOM para UTF-8
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Rota de status
app.get('/api/status', async (req, res) => {
    try {
        const metadata = await getSyncMetadata();
        const stats = await getStats();
        
        res.json({
            success: true,
            server: 'running',
            version: '2.0.0',
            database: 'mongodb',
            lastSync: metadata.last_sync,
            syncStatus: metadata.status,
            inventoryCount: stats.total,
            stats: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 🕐 AGENDAMENTO: Sincronizar automaticamente 1x por dia às 03:00
cron.schedule('0 3 * * *', async () => {
    console.log('⏰ Sincronização automática agendada iniciada...');
    try {
        await performSync();
        console.log('✅ Sincronização automática concluída');
    } catch (error) {
        console.error('❌ Erro na sincronização automática:', error.message);
    }
}, {
    timezone: "America/Sao_Paulo"
});

// Rota de teste HTML
app.get('/test', (req, res) => {
    res.sendFile(join(import.meta.dirname || __dirname, 'test-page.html'));
});

// Iniciar servidor
app.listen(PORT, async () => {
    const metadata = await getSyncMetadata();
    const stats = await getStats();
    
    console.log(`🚀 Servidor v2.0 rodando em http://localhost:${PORT}`);
    console.log(`📊 Endpoints disponíveis:`);
    console.log(`   GET    /test                         - Página de testes`);
    console.log(`   GET    /api/status                   - Status do servidor e banco`);
    console.log(`   GET    /api/inventory                - Obter inventário (offline)`);
    console.log(`   GET    /api/inventory/status/:status - Filtrar por status`);
    console.log(`   POST   /api/sync                     - Sincronizar com Action1`);
    console.log(`   POST   /api/update-display-name      - Atualizar Display Name do PowerShell`);
    console.log(`   POST   /api/save-display-name        - Salvar Display Name direto no MongoDB`);
    console.log(`   DELETE /api/inventory                - Limpar inventário`);
    console.log(`\n💾 Banco de dados: MongoDB (local)`);
    console.log(`⏰ Sincronização automática: Diariamente às 03:00`);
    console.log(`📦 Dispositivos no banco: ${stats.total}`);
    console.log(`🕐 Última sincronização: ${metadata.last_sync || 'Nunca'}`);
});

// Fechar conexão ao encerrar processo
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando servidor...');
    await closeDB();
    process.exit(0);
});
