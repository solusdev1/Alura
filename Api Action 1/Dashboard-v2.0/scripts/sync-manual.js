import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '../.env'), override: true });

// Importar funções do banco de dados
import {
    saveDevices,
    getSyncMetadata,
    updateSyncStatus,
    closeDB
} from '../server/database/database.js';

const ACTION1_BASE_URL = 'https://app.action1.com/api/3.0';

// Credenciais da Action1
const credentials = {
    grant_type: 'client_credentials',
    client_id: process.env.ACTION1_CLIENT_ID || '',
    client_secret: process.env.ACTION1_CLIENT_SECRET || '',
    scope: 'api'
};

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
async function syncEndpoints() {
    console.log('\n🔄 ========================================');
    console.log('   SINCRONIZAÇÃO MANUAL - ACTION1');
    console.log('   ========================================\n');
    
    try {
        // Verificar credenciais
        if (!credentials.client_id || !credentials.client_secret) {
            throw new Error('❌ Credenciais da Action1 não configuradas no .env');
        }

        updateSyncStatus('syncing', 0);

        // 1️⃣ AUTENTICAÇÃO
        console.log('🔐 Autenticando na API Action1...');
        console.log(`   Client ID: ${credentials.client_id.substring(0, 30)}...`);
        console.log(`   Client Secret: ${credentials.client_secret.substring(0, 10)}...`);
        
        const authRes = await fetch(`${ACTION1_BASE_URL}/oauth2/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(credentials)
        });

        if (!authRes.ok) {
            const errorText = await authRes.text();
            console.log(`   Response: ${errorText}`);
            throw new Error(`Falha na autenticação (${authRes.status})`);
        }

        const { access_token } = await authRes.json();
        console.log('✅ Autenticação bem-sucedida!\n');

        const headers = {
            Authorization: `Bearer ${access_token}`,
            Accept: 'application/json'
        };

        // 2️⃣ ORGANIZAÇÕES
        console.log('🏢 Buscando organizações...');
        const orgData = await apiGet(`${ACTION1_BASE_URL}/organizations`, headers);
        const organizations = orgData.items || [];

        if (!organizations.length) {
            throw new Error('Nenhuma organização encontrada');
        }

        console.log(`✅ ${organizations.length} organização(ões) encontrada(s)\n`);

        let todosOsEndpoints = [];

        // 3️⃣ ENDPOINTS COM PAGINAÇÃO
        for (const org of organizations) {
            console.log(`📋 Organização: ${org.name} (${org.id})`);

            // Buscar endpoints gerenciados
            console.log('   🔍 Buscando endpoints gerenciados...');
            let managedItems = [];
            let allUniqueIds = new Set();
            let from = 0;
            const limit = 50;
            let hasMore = true;
            
            while (hasMore) {
                const managedUrl = `${ACTION1_BASE_URL}/endpoints/managed/${org.id}?fields=*&limit=${limit}&from=${from}`;
                
                try {
                    const managedData = await apiGet(managedUrl, headers);
                    const items = managedData.items || [];
                    const totalItems = managedData.total_items || managedData.total || 0;
                    
                    // Filtrar duplicados
                    const uniqueItems = items.filter(item => {
                        if (allUniqueIds.has(item.id)) return false;
                        allUniqueIds.add(item.id);
                        return true;
                    });
                    
                    managedItems.push(...uniqueItems);
                    
                    console.log(`      ✓ Página ${Math.floor(from/limit) + 1}: ${uniqueItems.length} únicos (Total: ${allUniqueIds.size}/${totalItems})`);
                    
                    from += limit;
                    hasMore = from < totalItems && uniqueItems.length > 0;
                    
                } catch (error) {
                    console.error(`      ❌ Erro ao buscar página: ${error.message}`);
                    hasMore = false;
                }
            }

            // Buscar endpoints não gerenciados
            console.log('   🔍 Buscando endpoints não gerenciados...');
            let unmanagedItems = [];
            let unmanagedFrom = 0;
            let unmanagedHasMore = true;
            
            while (unmanagedHasMore) {
                const unmanagedUrl = `${ACTION1_BASE_URL}/endpoints/unmanaged/${org.id}?fields=*&limit=${limit}&from=${unmanagedFrom}`;
                
                try {
                    const unmanagedData = await apiGet(unmanagedUrl, headers);
                    const items = unmanagedData.items || [];
                    const totalItems = unmanagedData.total_items || unmanagedData.total || 0;
                    
                    // Filtrar duplicados com endpoints gerenciados
                    const uniqueItems = items.filter(item => {
                        if (allUniqueIds.has(item.id)) return false;
                        allUniqueIds.add(item.id);
                        return true;
                    });
                    
                    unmanagedItems.push(...uniqueItems);
                    
                    console.log(`      ✓ Página ${Math.floor(unmanagedFrom/limit) + 1}: ${uniqueItems.length} únicos (Total: ${allUniqueIds.size}/${totalItems})`);
                    
                    unmanagedFrom += limit;
                    unmanagedHasMore = unmanagedFrom < totalItems && uniqueItems.length > 0;
                    
                } catch (error) {
                    console.error(`      ❌ Erro ao buscar página: ${error.message}`);
                    unmanagedHasMore = false;
                }
            }

            console.log(`   ✅ Total: ${managedItems.length} gerenciados + ${unmanagedItems.length} não gerenciados = ${managedItems.length + unmanagedItems.length}\n`);

            // Combinar todos os endpoints
            const allOrgEndpoints = [...managedItems, ...unmanagedItems];
            todosOsEndpoints.push(...allOrgEndpoints);
        }

        console.log(`\n📊 TOTAL DE ENDPOINTS ENCONTRADOS: ${todosOsEndpoints.length}\n`);

        // 4️⃣ PROCESSAR E SALVAR
        console.log('💾 Processando e salvando no banco de dados...');
        
        const dispositivosProcessados = todosOsEndpoints.map(dev => {
            const hw = dev.hardware_summary || {};
            const inv = dev.inventory || {};
            
            // Extrair AD Display Name do custom attribute
            const custom = dev.custom || [];
            const adDisplayName = custom.find(c => c.name === 'AD Display Name')?.value || '';
            
            const getRAM = () =>
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
                so: dev.OS || dev.os || dev.operating_system || 'N/A',
                status: statusNormalizado,
                organizacao: dev.organization_name || 'Carraro',
                modelo: dev.model || hw.model || 'N/A',
                fabricante: dev.manufacturer || hw.manufacturer || 'N/A',
                serial: dev.serial || dev.serial_number || hw.serial_number || 'N/A',
                memoria: dev.RAM || getRAM() || 'N/A',
                disco: dev.disk || getDisk() || 'N/A',
                cpu: dev.CPU_name || dev.CPU_model || hw.processor || inv.processor?.name || 'N/A',
                tipo: tipoDispositivo,
                usuario: (dev.user || dev.last_logged_in_user || 'N/A').replace(/\\/g, '/'),
                adDisplayName,
                gerenciado: dev.managed ? 'Sim' : 'Não',
                last_seen: dev.last_seen || 'N/A',
                agent_version: dev.agent_version || 'N/A',
                custom: dev.custom || []
            };
        });

        // 5️⃣ REMOVER DUPLICADOS - Manter apenas o mais recente/online
        console.log(`📦 Total processado: ${dispositivosProcessados.length} dispositivos`);
        console.log('🔍 Removendo duplicados (priorizando online e mais recente)...\n');
        
        // Agrupar por nome de dispositivo (normalizado)
        const grupos = {};
        
        dispositivosProcessados.forEach(dev => {
            // Normalizar nome do dispositivo (remover domínio, lowercase)
            const nomeNormalizado = (dev.dispositivo || dev.nome)
                .toLowerCase()
                .split('.')[0]  // Remove domínio (.carrarologistica.com.br)
                .trim();
            
            if (!grupos[nomeNormalizado]) {
                grupos[nomeNormalizado] = [];
            }
            grupos[nomeNormalizado].push(dev);
        });
        
        // Para cada grupo, escolher o melhor dispositivo
        const dispositivosUnicos = [];
        let duplicadosRemovidos = 0;
        
        Object.entries(grupos).forEach(([nome, dispositivos]) => {
            if (dispositivos.length > 1) {
                console.log(`   🔄 Duplicado encontrado: ${nome} (${dispositivos.length} registros)`);
                
                // Ordenar: Online primeiro, depois por last_seen mais recente
                dispositivos.sort((a, b) => {
                    // 1. Prioridade: Online > Offline
                    if (a.status === 'Online' && b.status !== 'Online') return -1;
                    if (b.status === 'Online' && a.status !== 'Online') return 1;
                    
                    // 2. Prioridade: Mais recente (last_seen)
                    const dateA = a.last_seen && a.last_seen !== 'N/A' ? new Date(a.last_seen) : new Date(0);
                    const dateB = b.last_seen && b.last_seen !== 'N/A' ? new Date(b.last_seen) : new Date(0);
                    return dateB - dateA;
                });
                
                const escolhido = dispositivos[0];
                console.log(`      ✅ Mantido: ${escolhido.status} | Last seen: ${escolhido.last_seen}`);
                
                dispositivos.slice(1).forEach(removido => {
                    console.log(`      ❌ Removido: ${removido.status} | Last seen: ${removido.last_seen}`);
                    duplicadosRemovidos++;
                });
                
                dispositivosUnicos.push(escolhido);
            } else {
                dispositivosUnicos.push(dispositivos[0]);
            }
        });
        
        console.log(`\n📊 Duplicados removidos: ${duplicadosRemovidos}`);
        console.log(`📦 Dispositivos únicos: ${dispositivosUnicos.length}\n`);
        
        await saveDevices(dispositivosUnicos);
        
        console.log(`✅ ${dispositivosUnicos.length} dispositivos salvos no banco!\n`);

        // Estatísticas finais
        const stats = dispositivosUnicos.reduce((acc, dev) => {
            acc.total++;
            if (dev.status === 'Online') acc.online++;
            if (dev.status === 'Offline') acc.offline++;
            return acc;
        }, { total: 0, online: 0, offline: 0 });

        console.log('📈 ESTATÍSTICAS:');
        console.log(`   Total: ${stats.total}`);
        console.log(`   Online: ${stats.online}`);
        console.log(`   Offline: ${stats.offline}`);
        
        await updateSyncStatus('completed', todosOsEndpoints.length);
        
        console.log('\n✅ Sincronização concluída com sucesso!');
        console.log('========================================\n');

    } catch (error) {
        await updateSyncStatus('error', 0);
        console.error('\n❌ ERRO NA SINCRONIZAÇÃO:');
        console.error(`   ${error.message}\n`);
        console.log('========================================\n');
        process.exit(1);
    } finally {
        await closeDB();
        process.exit(0);
    }
}

// Executar
syncEndpoints();
