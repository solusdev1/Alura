// API para consumir o servidor local v2.0
// Detecta automaticamente se está em produção (Vercel) ou desenvolvimento (local)
const SERVER_URL = import.meta.env.PROD 
    ? '' // Vercel usa mesma origem
    : 'http://localhost:3002';

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

export async function deleteInventoryByIds(ids) {
    const response = await fetch(`${SERVER_URL}/api/inventory/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao excluir dispositivos');
    }

    return await response.json();
}
