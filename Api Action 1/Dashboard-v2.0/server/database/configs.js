import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente antes de ler as credenciais
dotenv.config({ path: join(__dirname, '../../.env'), override: true });

// Configurações de credenciais da API Action1
// Use variáveis de ambiente para segurança
const credentials = {
    grant_type: 'client_credentials',
    client_id: process.env.ACTION1_CLIENT_ID || '',
    client_secret: process.env.ACTION1_CLIENT_SECRET || '',
    scope: 'api'
};

export default credentials;
