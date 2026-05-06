// API para consumir o servidor local v2.0
// Detecta automaticamente se está em produção (Vercel) ou desenvolvimento (local)
// Camada HTTP do frontend.
// Centraliza URLs de endpoint e tratamento de erros.
export const SERVER_URL = import.meta.env.PROD
    ? '' // Vercel usa mesma origem
    : 'http://localhost:3002';

const SYNC_SECRET = import.meta.env.VITE_SYNC_SECRET || '';

async function parseApiError(response, fallbackMessage) {
    try {
        const error = await response.json();
        return error.error || fallbackMessage;
    } catch {
        return fallbackMessage;
    }
}

// Dispara sincronizacao manual com Action1 via backend.
export async function syncInventory() {
    const headers = {};
    if (SYNC_SECRET) {
        headers['x-sync-secret'] = SYNC_SECRET;
    }

    const response = await fetch(`${SERVER_URL}/api/sync`, {
        method: 'POST',
        headers
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao sincronizar'));
    }

    return await response.json();
}

// L? o snapshot consolidado do inventario retornado pelo backend.
export async function getInventory() {
    const response = await fetch(`${SERVER_URL}/api/inventory`);

    if (!response.ok) {
        throw new Error('Erro ao buscar inventário');
    }

    const result = await response.json();
    return result.data || [];
}

export async function getInventoryByStatus(status) {
    const response = await fetch(`${SERVER_URL}/api/inventory/status/${status}`);

    if (!response.ok) {
        throw new Error('Erro ao buscar inventário por status');
    }

    const result = await response.json();
    return result.data || [];
}

export async function getServerStatus() {
    const response = await fetch(`${SERVER_URL}/api/status`);

    if (!response.ok) {
        throw new Error('Servidor não está respondendo');
    }

    return await response.json();
}

export async function clearInventory() {
    const response = await fetch(`${SERVER_URL}/api/inventory`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Erro ao limpar inventário');
    }

    return await response.json();
}

export async function deleteInventoryByIds(ids) {
    const response = await fetch(`${SERVER_URL}/api/inventory/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao excluir dispositivos'));
    }

    return await response.json();
}

// Atualiza somente os campos editaveis de um item do inventario.
export async function updateInventoryDevice(id, payload) {
    const response = await fetch(`${SERVER_URL}/api/inventory/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao atualizar dispositivo'));
    }

    return await response.json();
}

// Cria dispositivo manual quando ele nao vem da sync do Action1.
export async function createInventoryDevice(payload) {
    const response = await fetch(`${SERVER_URL}/api/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao criar dispositivo'));
    }

    return await response.json();
}

export async function searchTermResponsaveis(query = '') {
    const response = await fetch(`${SERVER_URL}/api/termos/responsaveis?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
        throw new Error('Erro ao buscar responsaveis');
    }

    const result = await response.json();
    return result.data || [];
}

export async function previewTermo(payload) {
    const response = await fetch(`${SERVER_URL}/api/termos/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao gerar pre-visualizacao do termo'));
    }

    return await response.json();
}

export async function generateTermo(payload) {
    const response = await fetch(`${SERVER_URL}/api/termos/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao gerar termo'));
    }

    return await response.json();
}

export async function sendTermoEmail(termId) {
    const response = await fetch(`${SERVER_URL}/api/termos/${encodeURIComponent(termId)}/send-email`, {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao enviar email do termo'));
    }

    return await response.json();
}

export async function getAdminSnapshot() {
    const response = await fetch(`${SERVER_URL}/api/admin/snapshot`);
    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao carregar administração'));
    }

    const result = await response.json();
    return result.data || { bases: [], users: [], movements: [], reports: [] };
}

export async function createBase(payload) {
    const response = await fetch(`${SERVER_URL}/api/admin/bases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao criar base'));
    }

    return await response.json();
}

export async function toggleBaseStatus(id) {
    const response = await fetch(`${SERVER_URL}/api/admin/bases/${encodeURIComponent(id)}/toggle`, {
        method: 'PATCH'
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao atualizar base'));
    }

    return await response.json();
}

export async function createAdminUser(payload) {
    const response = await fetch(`${SERVER_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao criar usuário'));
    }

    return await response.json();
}

export async function updateAdminUser(id, payload) {
    const response = await fetch(`${SERVER_URL}/api/admin/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao atualizar usuário'));
    }

    return await response.json();
}

export async function createMovement(payload) {
    const response = await fetch(`${SERVER_URL}/api/admin/movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao solicitar movimentação'));
    }

    return await response.json();
}

export async function respondMovement(id, payload) {
    const response = await fetch(`${SERVER_URL}/api/admin/movements/${encodeURIComponent(id)}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(await parseApiError(response, 'Erro ao responder movimentação'));
    }

    return await response.json();
}
