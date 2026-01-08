# Guia de Teste do Dashboard Action1

## Status Atual
- ✅ Servidor Backend rodando em: http://localhost:3001
- ✅ Frontend React rodando em: http://localhost:5173
- ⚠️ Inventário vazio (precisa sincronizar)

## Como Testar

### 1. Testar com Mock Data (dados de exemplo)
1. Abra http://localhost:5173
2. Por padrão, já mostra dados mock
3. Você verá 2 dispositivos de exemplo

### 2. Testar com API Real do Action1
1. No dashboard, clique em "📋 Usando Mock Data"
2. Agora mostrará "💾 Usando Servidor Local"
3. Clique em "🔄 Sincronizar com Action1"
4. O sistema vai:
   - Autenticar na API Action1
   - Buscar organizações
   - Buscar todos os dispositivos
   - Armazenar no servidor local
   - Mostrar no dashboard

### 3. Verificar Status do Servidor
Abra um terminal e execute:
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/status" -Method GET
$response | ConvertTo-Json
```

### 4. Testar Sincronização Manual
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/sync" -Method POST
$response | ConvertTo-Json
```

### 5. Ver Inventário Armazenado
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/inventory" -Method GET
$response.data | ConvertTo-Json
```

## Troubleshooting

### Dashboard não carrega
- Verifique se http://localhost:5173 está acessível
- Veja o console do navegador (F12) para erros

### "Servidor Offline"
- Verifique se o servidor está rodando: `npm run server`
- Teste: http://localhost:3001/api/status

### Erro ao Sincronizar
- Verifique suas credenciais em `src/api/configs.js`
- Veja os logs do terminal onde o servidor está rodando
- Execute `node test-api.js` para testar a API diretamente

## Endpoints da API

- `GET /api/status` - Status do servidor
- `GET /api/inventory` - Obter inventário armazenado
- `POST /api/sync` - Sincronizar com Action1
- `DELETE /api/inventory` - Limpar inventário
