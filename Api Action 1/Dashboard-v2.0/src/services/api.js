// API para consumir o servidor local v2.0
const SERVER_URL = 'http://localhost:3002';

export async function syncInventory() {
    const response = await fetch(`${SERVER_URL}/api/sync`, {
        method: 'POST',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao sincronizar');
    }

    return await response.json();
}

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
