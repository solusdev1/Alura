import {
    acquireSyncLock,
    clearInventory,
    createDevice,
    deleteDevicesByIds,
    getAllDevices,
    getDevicesByStatus,
    getSyncMetadata,
    releaseSyncLock,
    updateDeviceById
} from '../server/database/database.js';
import { runInventorySync } from '../server/lib/inventory-sync.js';
import {
    generateTermo,
    getGeneratedTerm,
    listGeneratedTerms,
    previewTermo,
    sendTermoEmail,
    searchResponsaveis
} from '../server/lib/termos-service.js';
import {
    checkRateLimit,
    sanitizeObject,
    validateStringLength
} from '../server/utils/security.js';

const ALLOWED_ORIGINS = [
    'https://inventario-two-gamma.vercel.app',
    'http://localhost:5173',
    'http://localhost:3002'
];

const SEARCH_MAX_LENGTH = 80;
const MAX_BULK_DELETE_IDS = 200;
const SYNC_LOCK_TTL_MS = 5 * 60 * 1000;

function readBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch {
            return {};
        }
    }
    return req.body;
}

function sanitizeStatus(rawStatus) {
    const validStatuses = ['online', 'offline', 'connected', 'disconnected'];
    const normalized = String(rawStatus || '').toLowerCase().trim();
    return validStatuses.includes(normalized) ? normalized : null;
}

function extractPath(req) {
    const path = (req.url || '').split('?')[0] || '/';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return normalizedPath.startsWith('/api/')
        ? normalizedPath.slice(4)
        : normalizedPath === '/api'
            ? '/'
            : normalizedPath;
}

function getQueryParam(req, key) {
    if (req.query && typeof req.query[key] !== 'undefined') {
        return req.query[key];
    }

    const queryString = (req.url || '').split('?')[1] || '';
    const params = new URLSearchParams(queryString);
    return params.get(key);
}

function json(res, status, payload) {
    return res.status(status).json(payload);
}

function getRequestOrigin(req) {
    return req.headers.origin || '';
}

function isAllowedOrigin(origin) {
    return origin && ALLOWED_ORIGINS.includes(origin);
}

function setSecurityHeaders(req, res) {
    const origin = getRequestOrigin(req);

    if (isAllowedOrigin(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-sync-secret');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
}

function getClientIdentifier(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }

    return req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';
}

function enforceRateLimit(req, { key, limit, windowMs }) {
    const rateLimit = checkRateLimit(`${key}:${getClientIdentifier(req)}`, limit, windowMs);
    if (!rateLimit.allowed) {
        const error = new Error('RATE_LIMITED');
        error.status = 429;
        error.meta = { retryAfter: rateLimit.retryAfter };
        throw error;
    }
}

function extractBearerToken(req) {
    const authHeader = req.headers.authorization || '';
    const bearer = authHeader.replace(/^Bearer\s+/i, '').trim();
    return bearer || '';
}

function extractSyncSecret(req) {
    return String(req.headers['x-sync-secret'] || extractBearerToken(req) || '').trim();
}

function isVercelCronRequest(req) {
    return String(req.headers['user-agent'] || '').includes('vercel-cron/1.0');
}

function validateSearchQuery(query) {
    return validateStringLength(String(query || ''), SEARCH_MAX_LENGTH, 'Busca');
}

function validateDevicePayload(payload, { requireNameAndType = false } = {}) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        const error = new Error('INVALID_DEVICE_PAYLOAD');
        error.status = 400;
        throw error;
    }

    const sanitized = sanitizeObject(payload);

    if (requireNameAndType) {
        validateStringLength(String(sanitized.nome || ''), 120, 'Nome');
        validateStringLength(String(sanitized.tipo || ''), 80, 'Tipo');
    }

    return sanitized;
}

function validateDeletePayload(payload) {
    if (!payload || !Array.isArray(payload.ids) || payload.ids.length === 0) {
        const error = new Error('INVALID_DELETE_IDS');
        error.status = 400;
        throw error;
    }

    if (payload.ids.length > MAX_BULK_DELETE_IDS) {
        const error = new Error('DELETE_LIMIT_EXCEEDED');
        error.status = 400;
        throw error;
    }

    return payload.ids.map(id => validateStringLength(String(id), 120, 'ID'));
}

function validateTermPayload(payload) {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        const error = new Error('INVALID_TERM_PAYLOAD');
        error.status = 400;
        throw error;
    }

    const deviceIds = Array.isArray(payload.deviceIds) ? payload.deviceIds : [];
    if (deviceIds.length === 0) {
        const error = new Error('TERM_DEVICE_IDS_REQUIRED');
        error.status = 400;
        throw error;
    }

    const responsavel = payload.responsavel || {};
    validateStringLength(String(responsavel.nome || ''), 120, 'Nome do responsavel');
    validateStringLength(String(responsavel.documento || ''), 32, 'Documento do responsavel');

    return {
        ...payload,
        deviceIds: deviceIds.map(id => validateStringLength(String(id), 120, 'ID do dispositivo')),
        responsavel: sanitizeObject(responsavel),
        metadata: sanitizeObject(payload.metadata || {}),
        sendEmail: Boolean(payload.sendEmail)
    };
}

function authorizeSync(req) {
    const providedSecret = extractSyncSecret(req);
    const cronSecret = String(process.env.CRON_SECRET || '').trim();
    const syncSecret = String(process.env.SYNC_SECRET || '').trim();

    if (req.method === 'GET') {
        if (cronSecret) {
            if (providedSecret !== cronSecret) {
                const error = new Error('CRON_UNAUTHORIZED');
                error.status = 401;
                throw error;
            }
            return;
        }

        if (!isVercelCronRequest(req)) {
            const error = new Error('CRON_UNAUTHORIZED');
            error.status = 401;
            throw error;
        }

        return;
    }

    if (syncSecret && providedSecret !== syncSecret) {
        const error = new Error('SYNC_UNAUTHORIZED');
        error.status = 401;
        throw error;
    }
}

function toHttpError(error) {
    const status = Number(error?.status || 500);
    const retryAfter = error?.meta?.retryAfter;

    const mapped = {
        CRON_UNAUTHORIZED: { status: 401, body: { error: 'CRON_UNAUTHORIZED' } },
        SYNC_UNAUTHORIZED: { status: 401, body: { error: 'SYNC_UNAUTHORIZED' } },
        SYNC_ALREADY_RUNNING: { status: 409, body: { error: 'SYNC_ALREADY_RUNNING' } },
        RATE_LIMITED: { status: 429, body: { error: 'RATE_LIMITED', retryAfter } },
        DEVICE_NOT_FOUND: { status: 404, body: { error: 'DEVICE_NOT_FOUND' } },
        TERM_NOT_FOUND: { status: 404, body: { error: 'TERM_NOT_FOUND' } },
        TERM_DOCUMENT_NOT_FOUND: { status: 404, body: { error: 'TERM_DOCUMENT_NOT_FOUND' } },
        TERM_DEVICES_NOT_FOUND: { status: 404, body: { error: 'TERM_DEVICES_NOT_FOUND' } },
        INVALID_DELETE_IDS: { status: 400, body: { error: 'INVALID_DELETE_IDS' } },
        DELETE_LIMIT_EXCEEDED: { status: 400, body: { error: 'DELETE_LIMIT_EXCEEDED' } },
        INVALID_DEVICE_PAYLOAD: { status: 400, body: { error: 'INVALID_DEVICE_PAYLOAD' } },
        INVALID_TERM_PAYLOAD: { status: 400, body: { error: 'INVALID_TERM_PAYLOAD' } },
        TERM_DEVICE_IDS_REQUIRED: { status: 400, body: { error: 'TERM_DEVICE_IDS_REQUIRED' } },
        INVALID_RESPONSIBLE_DOCUMENT: { status: 400, body: { error: 'INVALID_RESPONSIBLE_DOCUMENT' } }
    };

    if (mapped[error?.message]) {
        return mapped[error.message];
    }

    if (status >= 400 && status < 500) {
        return { status, body: { error: error.message || 'BAD_REQUEST' } };
    }

    return {
        status: 500,
        body: { error: 'INTERNAL_SERVER_ERROR' }
    };
}

async function handleSync(req, res) {
    authorizeSync(req);
    enforceRateLimit(req, { key: 'sync', limit: 10, windowMs: 60 * 1000 });

    const lockToken = await acquireSyncLock({
        owner: `${req.method}:${getClientIdentifier(req)}`,
        ttlMs: SYNC_LOCK_TTL_MS
    });

    if (!lockToken) {
        throw new Error('SYNC_ALREADY_RUNNING');
    }

    try {
        const result = await runInventorySync();
        return json(res, 200, result);
    } finally {
        await releaseSyncLock(lockToken);
    }
}

export default async function handler(req, res) {
    setSecurityHeaders(req, res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const cleanPath = extractPath(req);

    try {
        if (req.method === 'GET' && (cleanPath === '/' || cleanPath === '/status')) {
            const devices = await getAllDevices();
            const metadata = await getSyncMetadata();

            return json(res, 200, {
                server: 'online',
                database: 'connected',
                totalDevices: devices.length,
                lastSync: metadata?.last_sync || metadata?.lastSync || null,
                syncStatus: metadata?.status || 'unknown',
                environment: 'vercel'
            });
        }

        if ((req.method === 'GET' || req.method === 'POST') && cleanPath === '/sync') {
            return await handleSync(req, res);
        }

        if (req.method === 'GET' && cleanPath.startsWith('/inventory/status/')) {
            const parts = cleanPath.split('/').filter(Boolean);
            const status = parts[parts.length - 1];
            const sanitizedStatus = sanitizeStatus(status);

            if (!sanitizedStatus) {
                return json(res, 400, {
                    error: 'INVALID_STATUS',
                    validStatuses: ['online', 'offline', 'connected', 'disconnected'],
                    received: status
                });
            }

            const devices = await getDevicesByStatus(sanitizedStatus);
            return json(res, 200, { data: devices });
        }

        if (req.method === 'POST' && cleanPath === '/inventory/delete') {
            enforceRateLimit(req, { key: 'inventory-delete', limit: 20, windowMs: 5 * 60 * 1000 });
            const ids = validateDeletePayload(readBody(req));
            const result = await deleteDevicesByIds(ids);
            return json(res, 200, { success: true, deleted: result.deletedCount || 0 });
        }

        if (req.method === 'DELETE' && cleanPath === '/inventory') {
            enforceRateLimit(req, { key: 'inventory-clear', limit: 5, windowMs: 10 * 60 * 1000 });
            await clearInventory();
            return json(res, 200, { success: true });
        }

        if (req.method === 'POST' && cleanPath === '/inventory') {
            enforceRateLimit(req, { key: 'inventory-create', limit: 60, windowMs: 10 * 60 * 1000 });
            const payload = validateDevicePayload(readBody(req), { requireNameAndType: true });
            const device = await createDevice(payload);
            return json(res, 201, { success: true, data: device });
        }

        if (req.method === 'PATCH' && cleanPath.startsWith('/inventory/')) {
            enforceRateLimit(req, { key: 'inventory-update', limit: 120, windowMs: 10 * 60 * 1000 });
            const id = validateStringLength(
                decodeURIComponent(cleanPath.replace('/inventory/', '')),
                120,
                'ID'
            );
            const payload = validateDevicePayload(readBody(req));
            const result = await updateDeviceById(id, payload);

            if (!result.matchedCount) {
                return json(res, 404, { error: 'DEVICE_NOT_FOUND' });
            }

            return json(res, 200, { success: true, data: result.device });
        }

        if (req.method === 'GET' && cleanPath === '/inventory') {
            const devices = await getAllDevices();
            return json(res, 200, { data: devices });
        }

        if (req.method === 'GET' && cleanPath === '/termos/responsaveis') {
            enforceRateLimit(req, { key: 'termos-search', limit: 120, windowMs: 5 * 60 * 1000 });
            const query = validateSearchQuery(getQueryParam(req, 'q') || '');
            const items = await searchResponsaveis(query);
            return json(res, 200, { success: true, data: items });
        }

        if (req.method === 'POST' && cleanPath === '/termos/preview') {
            enforceRateLimit(req, { key: 'termos-preview', limit: 60, windowMs: 10 * 60 * 1000 });
            const payload = validateTermPayload(readBody(req));
            const data = await previewTermo(payload);
            return json(res, 200, { success: true, data });
        }

        if (req.method === 'POST' && cleanPath === '/termos/generate') {
            enforceRateLimit(req, { key: 'termos-generate', limit: 30, windowMs: 10 * 60 * 1000 });
            const payload = validateTermPayload(readBody(req));
            const data = await generateTermo(payload);
            return json(res, 201, { success: true, data });
        }

        if (req.method === 'POST' && cleanPath.startsWith('/termos/') && cleanPath.endsWith('/send-email')) {
            enforceRateLimit(req, { key: 'termos-send-email', limit: 30, windowMs: 10 * 60 * 1000 });
            const [, termosSegment, id, action] = cleanPath.split('/');
            if (termosSegment !== 'termos' || !id || action !== 'send-email') {
                return json(res, 404, {
                    error: 'ENDPOINT_NOT_FOUND',
                    received: cleanPath
                });
            }

            const data = await sendTermoEmail(id);
            return json(res, 200, { success: true, data });
        }

        if (req.method === 'GET' && cleanPath === '/termos') {
            enforceRateLimit(req, { key: 'termos-list', limit: 120, windowMs: 5 * 60 * 1000 });
            const query = validateSearchQuery(getQueryParam(req, 'q') || '');
            const items = await listGeneratedTerms(query);
            return json(res, 200, { success: true, data: items });
        }

        if (req.method === 'GET' && cleanPath.startsWith('/termos/')) {
            const [, termosSegment, id, action] = cleanPath.split('/');
            if (termosSegment !== 'termos' || !id) {
                return json(res, 404, {
                    error: 'ENDPOINT_NOT_FOUND',
                    received: cleanPath
                });
            }

            const term = await getGeneratedTerm(id);
            if (!term) {
                return json(res, 404, { success: false, error: 'TERM_NOT_FOUND' });
            }

            if (action === 'download') {
                const buffer = Buffer.from(term.documentBase64, 'base64');
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
                res.setHeader('Content-Disposition', `attachment; filename="${term.fileName}"`);
                return res.status(200).send(buffer);
            }

            return json(res, 200, { success: true, data: term });
        }

        return json(res, 404, {
            error: 'ENDPOINT_NOT_FOUND',
            received: cleanPath
        });
    } catch (error) {
        const httpError = toHttpError(error);
        console.error('API Error:', {
            path: cleanPath,
            method: req.method,
            message: error?.message,
            stack: error?.stack
        });
        return json(res, httpError.status, httpError.body);
    }
}
