# Design: Operacao 100% Online no Vercel + Mongo

## Objetivo

Transformar o `Dashboard-v2.0` em uma aplicacao operando apenas online, com frontend e API servidos pela Vercel, persistencia centralizada no MongoDB Atlas e sincronizacao automatica com a API da Action1 executada uma vez por dia via `Vercel Cron`.

Ao final desta etapa, o sistema nao deve depender do `server/index.js` rodando localmente para funcionar em producao. O frontend deve falar apenas com rotas `api/*` da mesma origem, e todas as alteracoes manuais feitas no inventario ou nos termos devem ser persistidas no Mongo online.

## Resultado esperado

- Frontend publicado na Vercel usando a mesma origem para UI e API.
- MongoDB Atlas como banco unico da operacao online.
- Rotas de inventario, termos e sincronizacao expostas via `api/*`.
- `SYNC` diario rodando online por cron da Vercel.
- Dados da Action1 atualizados sem apagar campos manuais protegidos.
- Previa, geracao, historico e download de termos funcionando online.

## Escopo desta refatoracao

- Consolidar a camada HTTP online em `api/*`.
- Extrair e reutilizar a logica de dominio atual para inventario, termos e sync.
- Eliminar a dependencia operacional do backend Express para producao.
- Implementar rota protegida `POST /api/sync`.
- Configurar `Vercel Cron` para disparo diario.
- Garantir preservacao de campos manuais durante a sincronizacao.
- Garantir leitura e gravacao online do inventario editado pelo frontend.
- Garantir funcionamento online do fluxo de termos com Mongo e DOCX.

## Fora de escopo

- Migrar o projeto para outro provedor que nao seja Vercel.
- Criar painel administrativo separado para execucoes do sync.
- Assinatura digital dos termos.
- Fila assíncrona dedicada fora do runtime serverless.
- Reestruturar a UI alem do necessario para consumir a nova API.

## Premissas

- O volume diario da sincronizacao com a Action1 cabe em uma execucao serverless unica.
- O MongoDB Atlas continuara disponivel como banco central.
- As credenciais da Action1 e os segredos do cron serao configurados como environment variables na Vercel.
- Os templates DOCX `public/termo_clt.docx` e `public/termo_pj.docx` serao versionados no repositorio.

## Decisoes aprovadas

### Execucao do sync

- O sync diario sera executado por `Vercel Cron`.
- O cron chamara uma rota protegida `POST /api/sync`.

### Preservacao de campos manuais

- A sincronizacao da Action1 nao deve sobrescrever campos manuais editados pelo dashboard.
- A sync atualiza apenas os campos operacionais vindos da Action1.

### Escopo online

- Inventario, termos, historico, download e geracao de previa entram juntos nesta refatoracao online.

### Estrategia de arquitetura

- A logica de negocio sera consolidada em modulos compartilhados.
- A camada `api/*` ficara fina, chamando servicos e repositorios reutilizaveis.

## Problema atual

Hoje o projeto esta em estado hibrido:

- o frontend Vite ja esta pronto para Vercel;
- existe um backend Express local com a maior parte da logica;
- existe uma `api/index.js` online, mas incompleta em relacao ao backend local;
- o sync manual vive em `scripts/sync-manual.js` e depende do stack local;
- parte da logica de Mongo esta acoplada a fallback local em JSON, o que nao deve reger a operacao online.

Esse modelo aumenta risco de divergencia entre:

- o que funciona localmente;
- o que funciona online;
- o que o frontend chama em desenvolvimento;
- o que a Vercel realmente expoe em producao.

## Arquitetura alvo

### Camadas

1. `api/*`
   - camada HTTP serverless
   - recebe request, valida, autentica e retorna response
   - nao concentra regra de negocio complexa

2. `server/lib/*` e `server/services/*`
   - dominio compartilhado
   - normalizacao, merge, regras de sync, geracao de contexto de termo, renderizacao DOCX

3. `server/database/*`
   - repositorios Mongo
   - leitura e escrita centralizadas por colecao

4. `src/services/api.js`
   - cliente unico do frontend
   - fala apenas com `/api/...` em producao

### Fluxo online

- Usuario abre frontend na Vercel.
- Frontend chama `/api/inventory`, `/api/termos/*`, `/api/status` e afins.
- As rotas serverless acessam o Mongo Atlas.
- O `Vercel Cron` chama `/api/sync` 1x por dia.
- A rota `/api/sync` autentica na Action1, busca endpoints, normaliza e persiste.
- Os campos manuais protegidos sao preservados durante a escrita.

## Estrutura proposta

### API online

Criar ou consolidar estes handlers:

- `api/status.js`
- `api/inventory/index.js`
- `api/inventory/[id].js`
- `api/inventory/delete.js`
- `api/inventory/status/[status].js`
- `api/termos/responsaveis.js`
- `api/termos/preview.js`
- `api/termos/generate.js`
- `api/termos/index.js`
- `api/termos/[id].js`
- `api/termos/[id]/download.js`
- `api/sync.js`

Se a organizacao em subpastas complicar o roteamento da Vercel, a alternativa aceitavel e manter arquivos simples em `api/` com nomes explicitos. O importante e cada endpoint online ter responsabilidade unica e chamar modulos compartilhados.

### Modulos compartilhados

Centralizar a logica nestes blocos:

- `server/database/mongo.js`
  - conexao unica e cacheada com Mongo Atlas

- `server/database/inventory-repository.js`
  - CRUD do inventario
  - leitura por status
  - update parcial de dispositivo

- `server/database/termos.js`
  - responsaveis, termos, historico, download

- `server/lib/action1-sync.js`
  - autenticacao Action1
  - paginacao
  - normalizacao
  - deduplicacao
  - merge com campos manuais

- `server/lib/termo-responsabilidade.js`
  - montagem de contexto
  - renderizacao DOCX
  - integracao com repositorio de termos

### Frontend

O frontend deve depender apenas de:

- `getInventory`
- `getInventoryByStatus`
- `updateInventoryDevice`
- `createInventoryDevice`
- `deleteInventoryByIds`
- `searchTermResponsaveis`
- `previewTermo`
- `generateTermo`
- `syncInventory`
- `getServerStatus`

Em producao, `SERVER_URL` deve permanecer vazio para usar mesma origem.

## Regras de dados do inventario

### Fonte de verdade

- Mongo Atlas sera a unica fonte de verdade online.
- O fallback JSON pode continuar para desenvolvimento local, mas nao deve reger a execucao em producao.

### Campos operacionais vindos da Action1

Esses campos podem ser atualizados pela sync:

- `nome`
- `dispositivo`
- `ip`
- `mac`
- `so`
- `status`
- `organizacao`
- `modelo`
- `fabricante`
- `serial`
- `memoria`
- `disco`
- `cpu`
- `tipo`
- `usuario`
- `gerenciado`
- `last_seen`
- `agent_version`
- `custom`

### Campos manuais protegidos

Esses campos devem ser preservados se ja existirem no Mongo:

- `cloud`
- `setor`
- `dataAlteracao`
- `responsavelAtualId`
- `responsavelAtualNome`
- `responsavelAtualDocumento`
- `responsavelAtualCargo`
- `termoAtualId`
- `termoAtualVersion`
- `adDisplayName`
- `city`

### Itens manuais fora da Action1

Itens criados manualmente no dashboard devem continuar existindo no Mongo mesmo que nao venham da sync.

Tipos extras atualmente suportados:

- `bipe`
- `celular`
- `coletor`
- `roteador`
- `switch`

## Fluxo do sync diario

### Entrada

- `POST /api/sync`

### Autorizacao

- Deve exigir um segredo compartilhado, por exemplo `x-sync-secret`.
- Se a chamada vier do cron sem segredo valido, responder `401`.

### Etapas

1. Validar segredo.
2. Marcar metadata como `syncing`.
3. Autenticar na Action1.
4. Buscar organizacoes.
5. Buscar endpoints gerenciados e nao gerenciados com paginacao.
6. Normalizar os dispositivos.
7. Deduplicar por equipamento.
8. Carregar estado atual do Mongo.
9. Aplicar merge preservando campos manuais.
10. Persistir snapshot consolidado.
11. Atualizar metadata com `last_sync`, totais e status `completed`.
12. Em caso de erro, persistir `status = error` e a mensagem resumida.

### Execucao por cron

No `vercel.json`, incluir `crons` apontando para `/api/sync`.

Horario recomendado:

- `0 6 * * *`

O horario exato deve ser ajustado para o fuso desejado, considerando UTC da Vercel.

## Fluxo de termos online

### Preview

- `POST /api/termos/preview`
- Resolve equipamentos pelo Mongo.
- Monta contexto.
- Renderiza DOCX em memoria.
- Retorna `context`, `fileName` e `templateName`.
- Nao persiste termo nesta etapa.

### Generate

- `POST /api/termos/generate`
- Resolve equipamentos.
- Faz `upsert` do responsavel.
- Gera DOCX.
- Persiste termo no Mongo.
- Atualiza posse atual dos equipamentos.
- Retorna `termId`, `downloadUrl`, responsavel e itens.

### Historico e download

- `GET /api/termos`
- `GET /api/termos/:id`
- `GET /api/termos/:id/download`

Todos operam inteiramente no Mongo online.

## Modelo de metadata operacional

Colecao `metadata`, documento `_id = sync_info`:

```js
{
  _id: 'sync_info',
  last_sync: '2026-03-27T06:00:00.000Z',
  total_devices: 123,
  status: 'completed', // syncing | completed | error | manual_delete
  error_message: '',
  updated_at: '2026-03-27T06:01:10.000Z'
}
```

## Seguranca

### CORS

- Em producao, como frontend e API compartilham origem, reduzir CORS ao minimo.
- Permitir localhost apenas para desenvolvimento.

### Segredos

Variaveis previstas:

- `MONGODB_URI`
- `MONGODB_DATABASE`
- `ACTION1_CLIENT_ID`
- `ACTION1_CLIENT_SECRET`
- `SYNC_SECRET`

### Sync protegido

- O endpoint `POST /api/sync` nao deve ficar publico sem segredo.
- O frontend nao deve chamar essa rota automaticamente.
- O botao de sync manual da UI pode chamar a mesma rota, desde que o backend aceite uma estrategia segura para uso administrativo. Se isso nao for trivial agora, o botao manual pode ser tratado como segunda etapa.

## Compatibilidade local

Para desenvolvimento, podemos manter:

- `server/index.js` para testes locais
- fallback JSON apenas local

Mas a regra principal e:

- a logica de producao deve viver em modulos reutilizaveis pela Vercel
- o backend local nao pode ser a unica implementacao completa

## Riscos

### Timeout do sync

Se a Action1 devolver muitos endpoints, a execucao serverless pode ficar longa.

Mitigacao:

- reduzir trabalho desnecessario no handler
- evitar logs excessivos
- manter normalizacao e merge eficientes
- se necessario, futuramente dividir por organizacao

### Divergencia entre local e online

Mitigacao:

- uma unica camada de dominio compartilhada
- handlers `api/*` finos
- evitar duplicar regras entre `api/index.js` e `server/index.js`

### Campos manuais perdidos

Mitigacao:

- merge por preservacao, nunca overwrite cego
- testes cobrindo update manual + sync posterior

### Termos quebrando em producao

Mitigacao:

- manter templates no repositorio
- validar renderizacao DOCX por modulo compartilhado
- manter os normalizadores de placeholders ja introduzidos

## Testes necessarios

### Inventario

- listar inventario online
- criar dispositivo manual
- editar dispositivo manual
- excluir por ids
- buscar por status

### Sync

- chamada autorizada executa sync
- chamada sem segredo falha com `401`
- sync atualiza dados operacionais
- sync preserva campos manuais protegidos
- sync atualiza metadata corretamente

### Termos

- preview online com template `CLT`
- preview online com template `PJ`
- generate persiste termo
- generate atualiza posse atual do equipamento
- listagem de termos retorna historico
- download retorna DOCX valido

### Integracao frontend

- frontend carrega dados do Mongo online
- alteracoes manuais persistem e reaparecem apos refresh
- sync diario nao apaga alteracoes protegidas

## Plano de implementacao

### Fase 1

- extrair conexao Mongo reutilizavel
- consolidar repositorio de inventario
- consolidar modulo de sync Action1

### Fase 2

- completar endpoints `api/inventory*`
- completar `api/status`
- ajustar frontend para depender apenas da API online consolidada

### Fase 3

- portar fluxo completo de termos para `api/termos*`
- validar preview, generate e download online

### Fase 4

- criar `api/sync`
- adicionar protecao por segredo
- configurar `vercel.json` com `crons`

### Fase 5

- validar preview deploy
- subir GitHub
- publicar na Vercel

## Criterios de aceite

- Aplicacao funciona em producao sem servidor local.
- Inventario online le e grava no Mongo Atlas.
- Edicoes manuais feitas pelo frontend continuam salvas apos sync.
- Sync da Action1 executa online 1x por dia.
- Fluxo de termos funciona online do preview ao download.
- Frontend usa mesma origem `/api/*` em producao.
