// Vercel Serverless Function - API Handler
import {
    clearInventory,
    createDevice,
    deleteDevicesByIds,
    getAllDevices,
    getDevicesByStatus,
    getSyncMetadata,
    updateDeviceById
} from '../server/database/database.js';
import { runInventorySync } from '../server/lib/inventory-sync.js';
import {
    generateTermo,
    getGeneratedTerm,
    listGeneratedTerms,
    previewTermo,
    searchResponsaveis
} from '../server/lib/termos-service.js';

const ALLOWED_ORIGINS = [
    'https://inventario-two-gamma.vercel.app',
    'http://localhost:5173',
    'http://localhost:3002'
];

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

export default async function handler(req, res) {
    const origin = req.headers.origin;
    
    // 🔒 SEGURANÇA: Verificar origem
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // Permitir requisições sem origin (curl, Postman)
        res.setHeader('Access-Control-Allow-Origin', '*');
    } else {
        console.warn(`⚠️ CORS bloqueado: ${origin}`);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

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

        if (req.method === 'POST' && cleanPath === '/sync') {
            const syncSecret = process.env.SYNC_SECRET || '';
            const providedSecret = req.headers['x-sync-secret']
                || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');

            if (syncSecret && providedSecret !== syncSecret) {
                return json(res, 401, { error: 'SYNC_UNAUTHORIZED' });
            }

            const result = await runInventorySync();
            return json(res, 200, result);
        }

        if (req.method === 'GET' && cleanPath.startsWith('/inventory/status/')) {
            const parts = cleanPath.split('/').filter(p => p);
            const status = parts[parts.length - 1];
            const sanitizedStatus = sanitizeStatus(status);

            if (!sanitizedStatus) {
                return json(res, 400, {
                    error: 'Status inválido',
                    validStatuses: ['online', 'offline', 'connected', 'disconnected'],
                    received: status
                });
            }

            const devices = await getDevicesByStatus(sanitizedStatus);
            return json(res, 200, { data: devices });
        }

        if (req.method === 'POST' && cleanPath === '/inventory/delete') {
            const body = readBody(req);
            const ids = body.ids;
            if (!Array.isArray(ids) || ids.length === 0) {
                return json(res, 400, { error: 'Lista de IDs inválida' });
            }

            const result = await deleteDevicesByIds(ids);
            return json(res, 200, { success: true, deleted: result.deletedCount || 0 });
        }

        if (req.method === 'DELETE' && cleanPath === '/inventory') {
            await clearInventory();
            return json(res, 200, { success: true });
        }

        if (req.method === 'POST' && cleanPath === '/inventory') {
            const payload = readBody(req);
            const device = await createDevice(payload);
            return json(res, 201, { success: true, data: device });
        }

        if (req.method === 'PATCH' && cleanPath.startsWith('/inventory/')) {
            const id = decodeURIComponent(cleanPath.replace('/inventory/', ''));
            const payload = readBody(req);
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
            const query = getQueryParam(req, 'q') || '';
            const items = await searchResponsaveis(query);
            return json(res, 200, { success: true, data: items });
        }

        if (req.method === 'POST' && cleanPath === '/termos/preview') {
            const payload = readBody(req);
            const data = await previewTermo(payload);
            return json(res, 200, { success: true, data });
        }

        if (req.method === 'POST' && cleanPath === '/termos/generate') {
            const payload = readBody(req);
            const data = await generateTermo(payload);
            return json(res, 201, { success: true, data });
        }

        if (req.method === 'GET' && cleanPath === '/termos') {
            const query = getQueryParam(req, 'q') || '';
            const items = await listGeneratedTerms(query);
            return json(res, 200, { success: true, data: items });
        }

        if (req.method === 'GET' && cleanPath.startsWith('/termos/')) {
            const [, termosSegment, id, action] = cleanPath.split('/');
            if (termosSegment !== 'termos' || !id) {
                return json(res, 404, { error: 'Endpoint not found', received: cleanPath, originalUrl: req.url });
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
            error: 'Endpoint not found',
            received: cleanPath,
            originalUrl: req.url
        });

    } catch (error) {
        console.error('API Error:', error);
        return json(res, 500, {
            error: error.message,
            hint: 'Check environment variables and serverless logs'
        });
    }
}
