// Vercel Serverless Function - API Handler
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DATABASE || 'action1_inventory';

// 🔒 SEGURANÇA: CORS Whitelist
const ALLOWED_ORIGINS = [
    'https://inventario-two-gamma.vercel.app',
    'http://localhost:5173',
    'http://localhost:3002'
];

let cachedClient = null;
let cachedDb = null;

async function connectDB() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = await MongoClient.connect(MONGO_URI);
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    return db;
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

    // Parse the path - Vercel passa apenas o path após /api/
    const path = req.url || '';
    const cleanPath = path.startsWith('/') ? path : `/${path}`;

    try {
        // Status endpoint
        if (cleanPath.includes('status') || path === '' || path === '/') {
            const db = await connectDB();
            const devices = await db.collection('devices').find({}).toArray();
            const metadata = await db.collection('metadata').findOne({});

            return res.status(200).json({
                server: 'online',
                database: 'connected',
                totalDevices: devices.length,
                lastSync: metadata?.lastSync || null,
                environment: 'vercel',
                path: path,
                cleanPath: cleanPath
            });
        }

        // Inventory by status
        if (cleanPath.includes('inventory/status/')) {
            const parts = cleanPath.split('/');
            const status = parts[parts.length - 1];
            
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
            
            // Sanitizar para prevenir ReDoS
            const escapedStatus = sanitizedStatus.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const db = await connectDB();
            const devices = await db.collection('devices')
                .find({ status: new RegExp(escapedStatus, 'i') })
                .toArray();
            return res.status(200).json({ data: devices });
        }

        // Inventory endpoint
        if (cleanPath.includes('inventory')) {
            const db = await connectDB();
            const devices = await db.collection('devices').find({}).toArray();
            return res.status(200).json({ data: devices });
        }

        return res.status(404).json({ 
            error: 'Endpoint not found',
            received: cleanPath,
            originalUrl: req.url
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            error: error.message,
            hint: 'Check environment variables: MONGODB_URI and MONGODB_DATABASE'
        });
    }
}
