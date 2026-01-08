import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json());

app.get('/api/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!' });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor de teste rodando em http://localhost:${PORT}`);
});

// Manter o processo vivo
process.on('SIGTERM', () => {
    console.log('Encerrando servidor...');
    process.exit(0);
});
