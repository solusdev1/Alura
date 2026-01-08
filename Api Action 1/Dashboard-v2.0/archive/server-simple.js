import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let inventoryTable = [];

// Status
app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        server: 'running',
        inventoryCount: inventoryTable.length,
        lastUpdate: null
    });
});

// Inventory
app.get('/api/inventory', (req, res) => {
    res.json({
        success: true,
        total: inventoryTable.length,
        lastUpdate: null,
        data: inventoryTable
    });
});

// Sync
app.post('/api/sync', async (req, res) => {
    try {
        console.log('Sincronização chamada');
        res.json({ success: true, total: 0, message: 'Teste' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor SIMPLES rodando em http://localhost:${PORT}`);
});

process.on('uncaughtException', (err) => {
    console.error('ERRO CRÍTICO:', err);
});
