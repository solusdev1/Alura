// Vercel Serverless Function - API Handler
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DATABASE || 'action1_inventory';

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
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
            const db = await connectDB();
            const devices = await db.collection('devices')
                .find({ status: new RegExp(status, 'i') })
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
