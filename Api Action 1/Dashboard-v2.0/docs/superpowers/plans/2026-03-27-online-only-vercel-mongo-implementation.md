# Online-Only Vercel + Mongo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to execute this plan when the user explicitly authorizes delegated execution. Do not start implementation from this document without first reading the linked spec and validating the current worktree.

## Goal

Refatorar o projeto para operar somente online, com frontend Vite e API unificada no Vercel, Mongo Atlas como fonte única de verdade, geração de termos 100% online e sincronização diária com o Action1 via `Vercel Cron`, preservando os campos manuais do inventário.

## Source Of Truth

- Spec aprovada: [2026-03-27-online-only-vercel-mongo-design.md](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/docs/superpowers/specs/2026-03-27-online-only-vercel-mongo-design.md)
- API serverless atual: [api/index.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/api/index.js)
- Backend Express atual: [server/index.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/index.js)
- Repositório de inventário: [server/database/database.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/database/database.js)
- Repositório de termos: [server/database/termos.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/database/termos.js)
- Rotas de termos: [server/routes/termos.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/routes/termos.js)
- Geração DOCX: [server/lib/termo-responsabilidade.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/lib/termo-responsabilidade.js)
- Cliente frontend: [src/services/api.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/src/services/api.js)
- Sync manual atual: [scripts/sync-manual.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/scripts/sync-manual.js)
- Configuração Vercel: [vercel.json](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/vercel.json)

## Architecture Target

- `dist/` continua servindo o frontend Vite no Vercel.
- `api/*` vira a única superfície HTTP online.
- A lógica de domínio sai de handlers monolíticos e passa a viver em módulos compartilhados.
- Mongo Atlas passa a ser obrigatório no modo online.
- `POST /api/sync` fica protegido por segredo e acionado por `Vercel Cron`.
- A sync atualiza dados do Action1 sem sobrescrever campos manuais protegidos.
- O fluxo de termos usa a mesma base online para preview, geração, histórico e download.

## Manual Fields To Preserve During Sync

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

## Constraints

- Não reverter mudanças locais já existentes no worktree.
- Não depender do backend Express para produção final.
- Não deixar lógica duplicada entre `server/` e `api/` sem um plano de transição.
- Manter compatibilidade com o frontend já apontando para `/api/...` em produção.
- Tratar `../../PROJETOTI-API-FRONT/` e `../../unifi-voucher/` como fora do escopo.

---

## Phase 1: Extrair camada compartilhada de domínio

### Objective

Criar módulos reutilizáveis para inventário, sync e termos, para que tanto a API online quanto eventuais scripts internos usem a mesma lógica.

### Tasks

1. Criar uma pasta de domínio compartilhado, preferencialmente `server/lib/` ou `lib/online/`, com serviços pequenos e sem dependência direta de Express.
2. Extrair de [server/database/database.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/database/database.js) os blocos de:
   - conexão Mongo
   - leitura/escrita de dispositivos
   - merge de dados Action1 com campos manuais
   - metadados de sync
3. Extrair de [server/database/termos.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/database/termos.js) um repositório de termos sem acoplamento à camada HTTP.
4. Encapsular a autenticação e as chamadas ao Action1 em um cliente dedicado, reaproveitável pela sync online.
5. Definir uma interface mínima para:
   - `inventoryRepository`
   - `termsRepository`
   - `action1Client`
   - `syncService`

### Validation

- Os novos módulos devem poder ser importados tanto por `api/*` quanto por scripts Node.
- `node --check` deve passar nos novos arquivos.

---

## Phase 2: Consolidar CRUD online do inventário

### Objective

Fazer com que a API Vercel cubra o CRUD real do inventário, substituindo a dependência do Express para operações de produção.

### Tasks

1. Refatorar [api/index.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/api/index.js) para virar um handler enxuto que delega ao domínio compartilhado.
2. Implementar ou completar os endpoints:
   - `GET /api/status`
   - `GET /api/inventory`
   - `GET /api/inventory/status/:status`
   - `POST /api/inventory`
   - `PATCH /api/inventory/:id`
   - `POST /api/inventory/delete`
3. Migrar a lógica hoje usada por [server/index.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/index.js) para esses handlers.
4. Unificar a nomenclatura das variáveis de ambiente Mongo:
   - preferir `MONGODB_URI`
   - preferir `MONGODB_DATABASE`
   - remover divergências com `MONGODB_DB_NAME`
5. Garantir que a atualização manual dos campos editáveis continue persistindo corretamente no Mongo Atlas.

### Validation

- Conferir compatibilidade com [src/services/api.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/src/services/api.js).
- Validar respostas JSON esperadas pelo frontend.

---

## Phase 3: Mover a sync do Action1 para a API online

### Objective

Transformar a sync atual em uma operação serverless segura, idempotente e preparada para execução diária via cron.

### Tasks

1. Extrair de [scripts/sync-manual.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/scripts/sync-manual.js) a lógica de sincronização para um serviço compartilhado.
2. Criar `POST /api/sync` usando esse serviço.
3. Proteger a rota com um segredo dedicado, por exemplo `SYNC_SECRET`, aceito por header como `Authorization` ou `x-sync-secret`.
4. Garantir que a sync:
   - autentique no Action1
   - recupere dispositivos com paginação
   - normalize e deduplique
   - preserve os campos manuais definidos na spec
   - atualize `metadata.last_sync`, `status`, `total_devices` e erro, quando houver
5. Atualizar [api/save-remote.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/api/save-remote.js) e rotas relacionadas para usar a mesma camada de persistência ou removê-las se ficarem redundantes.
6. Planejar timeout e tamanho de lote compatíveis com execução serverless do Vercel.

### Validation

- Rodar a sync manualmente via chamada autenticada e verificar atualização do metadata.
- Confirmar que edições manuais persistem após nova sync.

---

## Phase 4: Migrar termos para handlers online

### Objective

Deixar preview, geração, listagem, histórico e download de termos funcionando online sem depender do Express local.

### Tasks

1. Reaproveitar a lógica de [server/routes/termos.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/routes/termos.js) em rotas serverless:
   - `GET /api/termos/responsaveis`
   - `POST /api/termos/preview`
   - `POST /api/termos/generate`
   - `GET /api/termos`
   - `GET /api/termos/:id`
   - `GET /api/termos/:id/download`
2. Garantir que [server/lib/termo-responsabilidade.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/lib/termo-responsabilidade.js) funcione no ambiente serverless sem caminhos frágeis.
3. Validar disponibilidade dos templates em produção:
   - [public/termo_clt.docx](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/public/termo_clt.docx)
   - [public/termo_pj.docx](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/public/termo_pj.docx)
4. Ao gerar termo, persistir histórico e atualizar os dispositivos com os campos de responsável/termo atual.
5. Validar download do DOCX diretamente pela rota online.

### Validation

- Preview não pode mais retornar `Multi error`.
- Geração deve persistir termo e refletir o responsável atual nos dispositivos.

---

## Phase 5: Limpar fronteira entre Express local e Vercel

### Objective

Reduzir duplicação e deixar claro o que permanece apenas para desenvolvimento interno e o que é produção.

### Tasks

1. Identificar em [server/index.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/index.js) o que ainda precisa existir só para desenvolvimento local.
2. Se fizer sentido, manter o Express apenas como casca dev usando os mesmos módulos compartilhados.
3. Remover ou desativar rotas locais redundantes quando já existir equivalente em `api/*`.
4. Revisar:
   - [server/routes/update-display-name.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/routes/update-display-name.js)
   - [server/routes/save-display-name.js](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/server/routes/save-display-name.js)
   para decidir se entram na camada online ou saem do escopo da operação principal.
5. Atualizar a documentação operacional para refletir a arquitetura online-only.

### Validation

- Não deve existir endpoint crítico disponível apenas no servidor local.

---

## Phase 6: Configurar Vercel para operação contínua

### Objective

Preparar deploy, cron e variáveis para o ambiente online final.

### Tasks

1. Atualizar [vercel.json](/c:/Users/suporteti/Documents/Programação/Api%20Action%201/Dashboard-v2.0/vercel.json) para incluir cron diário chamando `/api/sync`.
2. Definir a lista final de variáveis obrigatórias:
   - `MONGODB_URI`
   - `MONGODB_DATABASE`
   - `ACTION1_CLIENT_ID`
   - `ACTION1_CLIENT_SECRET`
   - `SYNC_SECRET`
3. Garantir que o frontend continue consumindo a mesma origem em produção.
4. Validar `npm run build` e, se necessário, `npm run vercel-build`.
5. Preparar checklist de publicação:
   - preview deploy
   - smoke test de inventário
   - smoke test de termos
   - chamada manual de `/api/sync`
   - validação de cron agendado

### Validation

- Build de produção precisa completar.
- Cron e rota protegida precisam estar consistentes com a configuração final do Vercel.

---

## Suggested Execution Order

1. Extrair domínio compartilhado.
2. Consolidar CRUD online do inventário.
3. Subir sync online com preservação de campos manuais.
4. Migrar termos para a API online.
5. Limpar duplicações com o Express local.
6. Configurar Vercel cron e checklist de publicação.

## Risks To Watch

- Divergência entre variáveis de ambiente Mongo pode quebrar deploy silenciosamente.
- Tempo de execução da sync pode exceder o perfil serverless se a paginação do Action1 crescer.
- Geração de DOCX em serverless pode falhar se os templates não estiverem acessíveis no bundle final.
- Duplicação entre `server/` e `api/` pode gerar regressões se handlers novos e antigos divergirem.
- Worktree já está sujo; qualquer implementação precisa isolar mudanças do plano das alterações paralelas existentes.

## Verification Checklist

- `node --check` nos arquivos novos e refatorados.
- `npm run build`
- teste manual de `GET /api/status`
- teste manual de CRUD de inventário
- teste manual de `POST /api/sync` autenticado
- teste manual de `POST /api/termos/preview`
- teste manual de `POST /api/termos/generate`
- teste manual de `GET /api/termos/:id/download`

