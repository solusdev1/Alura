// Configurações de credenciais da API Action1
// Use variáveis de ambiente para segurança
const credentials = {
    grant_type: 'client_credentials',
    client_id: process.env.ACTION1_CLIENT_ID || '',
    client_secret: process.env.ACTION1_CLIENT_SECRET || '',
    scope: 'api'
};

export default credentials;
