import credentials from '../database/configs.js';

const ACTION1_BASE_URL = 'https://app.action1.com/api/3.0';

function getAuthPayload() {
    return {
        grant_type: 'client_credentials',
        client_id: process.env.ACTION1_CLIENT_ID || credentials.client_id || '',
        client_secret: process.env.ACTION1_CLIENT_SECRET || credentials.client_secret || '',
        scope: 'api'
    };
}

async function parseJsonResponse(response) {
    const text = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
        throw new Error(`Erro API ${response.status}: ${text.substring(0, 300)}`);
    }

    if (!contentType.includes('application/json')) {
        throw new Error(`Resposta não JSON: ${text.substring(0, 300)}`);
    }

    return JSON.parse(text);
}

function isForbiddenAction1Error(error) {
    return String(error?.message || '').includes('Erro API 403');
}

export async function authenticateAction1() {
    const authPayload = getAuthPayload();
    if (!authPayload.client_id || !authPayload.client_secret) {
        throw new Error('ACTION1_CREDENTIALS_MISSING');
    }

    const response = await fetch(`${ACTION1_BASE_URL}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(authPayload)
    });

    const payload = await parseJsonResponse(response);
    if (!payload.access_token) {
        throw new Error('ACTION1_TOKEN_MISSING');
    }

    return payload.access_token;
}

export async function action1Get(path, token) {
    return parseJsonResponse(await fetch(`${ACTION1_BASE_URL}${path}`, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
        }
    }));
}

export async function listOrganizations(token) {
    const data = await action1Get('/organizations', token);
    return data.items || [];
}

async function listEndpointsPage(kind, organizationId, token, from = 0, limit = 50) {
    return action1Get(`/endpoints/${kind}/${organizationId}?fields=*&limit=${limit}&from=${from}`, token);
}

async function listAllEndpointsByKind(kind, organizationId, token, existingIds = new Set()) {
    const uniqueItems = [];
    let from = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
        const payload = await listEndpointsPage(kind, organizationId, token, from, limit);
        const items = payload.items || [];
        const totalItems = payload.total_items || payload.total || 0;

        if (!items.length) {
            hasMore = false;
            break;
        }

        for (const item of items) {
            if (existingIds.has(item.id)) continue;
            existingIds.add(item.id);
            uniqueItems.push(item);
        }

        from += limit;
        hasMore = from < totalItems && items.length > 0;
    }

    return uniqueItems;
}

export async function listOrganizationEndpoints(organizationId, token) {
    const seenIds = new Set();
    const managed = await listAllEndpointsByKind('managed', organizationId, token, seenIds);
    let unmanaged = [];

    try {
        unmanaged = await listAllEndpointsByKind('unmanaged', organizationId, token, seenIds);
    } catch (error) {
        if (!isForbiddenAction1Error(error)) {
            throw error;
        }

        console.warn(
            `Action1 unmanaged endpoints sem permissao para a organizacao ${organizationId}; continuando com endpoints gerenciados.`
        );
    }

    return [...managed, ...unmanaged];
}

export async function listAllEndpoints(token) {
    const organizations = await listOrganizations(token);
    if (!organizations.length) {
        throw new Error('ACTION1_ORGANIZATIONS_NOT_FOUND');
    }

    const endpoints = [];
    for (const organization of organizations) {
        const orgEndpoints = await listOrganizationEndpoints(organization.id, token);
        endpoints.push(...orgEndpoints);
    }

    return endpoints;
}
