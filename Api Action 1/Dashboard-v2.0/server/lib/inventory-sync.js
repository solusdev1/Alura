import {
    saveDevices,
    updateSyncStatus
} from '../database/database.js';
import {
    authenticateAction1,
    listAllEndpoints
} from './action1-client.js';

function getCustomValue(customAttributes, names) {
    return customAttributes.find(attribute => names.includes(attribute.name))?.value || '';
}

function normalizeEndpoint(endpoint) {
    const hardwareSummary = endpoint.hardware_summary || {};
    const inventory = endpoint.inventory || {};
    const custom = endpoint.custom || [];

    const memory = endpoint.memory_total
        ?? endpoint.memory_size
        ?? hardwareSummary.memory_total
        ?? hardwareSummary.memory_size
        ?? inventory.memory?.total
        ?? 'N/A';

    const disk = endpoint.storage_total
        ?? endpoint.storage_total_size
        ?? hardwareSummary.storage_total
        ?? hardwareSummary.storage_total_size
        ?? inventory.storage?.total
        ?? 'N/A';

    let status = endpoint.status || 'Desconhecido';
    if (String(status).toLowerCase() === 'connected') status = 'Online';
    if (String(status).toLowerCase() === 'disconnected') status = 'Offline';

    const nomeDispositivo = endpoint.name || endpoint.device_name || '';
    let tipoDispositivo = endpoint.type || 'Não especificado';
    if (nomeDispositivo.includes('SJPCRONOT')) {
        tipoDispositivo = 'Notebook';
    } else if (endpoint.type === 'Endpoint') {
        tipoDispositivo = 'Workstation';
    }

    return {
        id: endpoint.id,
        nome: endpoint.name || endpoint.device_name || `Dispositivo-${endpoint.id}`,
        dispositivo: endpoint.device_name || endpoint.name || 'N/A',
        ip: endpoint.address || 'N/A',
        mac: endpoint.MAC || 'N/A',
        so: endpoint.OS || endpoint.os || endpoint.operating_system || 'N/A',
        status,
        organizacao: endpoint.organization_name || 'Carraro',
        modelo: endpoint.model || hardwareSummary.model || 'N/A',
        fabricante: endpoint.manufacturer || hardwareSummary.manufacturer || 'N/A',
        serial: endpoint.serial || endpoint.serial_number || hardwareSummary.serial_number || 'N/A',
        memoria: memory,
        disco: disk,
        cpu: endpoint.CPU_name || endpoint.CPU_model || hardwareSummary.processor || inventory.processor?.name || 'N/A',
        tipo: tipoDispositivo,
        usuario: (endpoint.user || endpoint.last_logged_in_user || 'N/A').replace(/\\/g, '/'),
        adDisplayName: getCustomValue(custom, ['AD Display Name']),
        city: getCustomValue(custom, ['City']),
        gerenciado: endpoint.managed ? 'Sim' : 'Não',
        last_seen: endpoint.last_seen || 'N/A',
        agent_version: endpoint.agent_version || 'N/A',
        custom
    };
}

function deduplicateDevices(devices) {
    const groups = new Map();
    for (const device of devices) {
        const normalizedName = String(device.dispositivo || device.nome || '')
            .toLowerCase()
            .split('.')[0]
            .trim();

        if (!groups.has(normalizedName)) {
            groups.set(normalizedName, []);
        }

        groups.get(normalizedName).push(device);
    }

    const uniqueDevices = [];
    let duplicatesRemoved = 0;

    for (const group of groups.values()) {
        if (group.length === 1) {
            uniqueDevices.push(group[0]);
            continue;
        }

        group.sort((a, b) => {
            if (a.status === 'Online' && b.status !== 'Online') return -1;
            if (b.status === 'Online' && a.status !== 'Online') return 1;

            const dateA = a.last_seen && a.last_seen !== 'N/A' ? new Date(a.last_seen) : new Date(0);
            const dateB = b.last_seen && b.last_seen !== 'N/A' ? new Date(b.last_seen) : new Date(0);
            return dateB - dateA;
        });

        uniqueDevices.push(group[0]);
        duplicatesRemoved += group.length - 1;
    }

    return {
        devices: uniqueDevices,
        duplicatesRemoved
    };
}

function buildSyncStats(allEndpoints, processedDevices, uniqueDevices, duplicatesRemoved) {
    return uniqueDevices.reduce((stats, device) => {
        stats.total = uniqueDevices.length;
        stats.sourceEndpoints = allEndpoints.length;
        stats.processed = processedDevices.length;
        stats.duplicatesRemoved = duplicatesRemoved;
        if (device.status === 'Online') stats.online += 1;
        if (device.status === 'Offline') stats.offline += 1;
        return stats;
    }, {
        total: 0,
        sourceEndpoints: allEndpoints.length,
        processed: processedDevices.length,
        duplicatesRemoved,
        online: 0,
        offline: 0
    });
}

export async function runInventorySync() {
    await updateSyncStatus('syncing', 0);

    try {
        const token = await authenticateAction1();
        const allEndpoints = await listAllEndpoints(token);
        const processedDevices = allEndpoints.map(normalizeEndpoint);
        const { devices: uniqueDevices, duplicatesRemoved } = deduplicateDevices(processedDevices);

        await saveDevices(uniqueDevices);
        await updateSyncStatus('completed', uniqueDevices.length);

        return {
            success: true,
            stats: buildSyncStats(allEndpoints, processedDevices, uniqueDevices, duplicatesRemoved),
            devices: uniqueDevices
        };
    } catch (error) {
        await updateSyncStatus('error', 0);
        throw error;
    }
}

