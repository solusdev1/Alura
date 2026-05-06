// No Next.js, as chamadas de API são relativas - sem necessidade de localhost:3002
const BASE = '';

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`);
  return json;
}

export async function getInventory() {
  return apiFetch('/api/inventory');
}

export async function getServerStatus() {
  return apiFetch('/api/status');
}

export async function syncInventory() {
  return apiFetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
}

export async function updateInventoryDevice(id: string, payload: Record<string, unknown>) {
  return apiFetch(`/api/inventory/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function deleteInventoryByIds(ids: string[]) {
  return apiFetch('/api/inventory/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) });
}

export async function createInventoryDevice(payload: Record<string, unknown>) {
  return apiFetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function searchTermResponsaveis(query: string) {
  return apiFetch(`/api/termos/responsaveis?q=${encodeURIComponent(query)}`);
}

export async function previewTermo(payload: Record<string, unknown>) {
  return apiFetch('/api/termos/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function generateTermo(payload: Record<string, unknown>) {
  return apiFetch('/api/termos/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function sendTermoEmail(termId: string) {
  return apiFetch(`/api/termos/${termId}/send-email`, { method: 'POST' });
}

export async function getMovimentacoes(params: { tipo?: string; deviceId?: string } = {}) {
  const search = new URLSearchParams();
  if (params.tipo) search.set('tipo', params.tipo);
  if (params.deviceId) search.set('deviceId', params.deviceId);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return apiFetch(`/api/movimentacoes${suffix}`);
}

export async function createMovimentacao(payload: Record<string, unknown>) {
  return apiFetch('/api/movimentacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function resolverMovimentacao(id: string, action: 'APROVADA' | 'REJEITADA') {
  return apiFetch(`/api/movimentacoes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action })
  });
}

export async function getSolicitacoes() {
  return apiFetch('/api/solicitacoes');
}

export async function createSolicitacao(payload: Record<string, unknown>) {
  return apiFetch('/api/solicitacoes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function updateSolicitacao(id: string, payload: Record<string, unknown>) {
  return apiFetch(`/api/solicitacoes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export async function getNotificacoes() {
  return apiFetch('/api/notificacoes');
}

export async function marcarNotificacaoLida(id: string) {
  return apiFetch(`/api/notificacoes/${id}`, {
    method: 'PATCH'
  });
}
