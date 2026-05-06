# Dashboard V3 - Inventario de TI

Sistema Next.js 16 com App Router para gestao de equipamentos, bases, usuarios, movimentacoes, solicitacoes e termos de responsabilidade.

## Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

Para validar producao:

```bash
npm run build
npm run start
```

## Estrutura do projeto

```text
app/
  page.tsx                         Rotas e paginas reais do App Router
  dashboard/**/page.tsx            Telas autenticadas
  api/**/route.ts                  Entradas HTTP exigidas pelo Next

frontend/
  api/client.ts                    Cliente HTTP usado pelos componentes
  components/                      Componentes React reutilizaveis
  styles/globals.css               CSS global e Tailwind

backend/
  api/**/route.ts                  Implementacao das APIs exportadas por app/api
  auth.ts                          Configuracao NextAuth
  db/                              Acesso a MongoDB e fallback JSON
  action1/                         Integracao Action1
  termos/                          Geracao, envio e regras de termos
  m365/                            Envio de email Microsoft 365
  scripts/windows/                 Scripts de operacao do servidor interno
  templates/                       Modelos DOCX dos termos

public/                            Arquivos estaticos
```

## Convencoes

- `app/` contem somente o que o Next precisa rotear: `page.tsx`, `layout.tsx` e `route.ts`.
- `frontend/` nao contem rotas. Use para componentes, estilos e funcoes chamadas pelo navegador.
- `backend/` concentra regras de servidor, banco, integracoes e scripts.
- `app/api/**/route.ts` deve continuar como ponte fina para `backend/api/**/route.ts`, porque Route Handlers do Next 16 precisam existir dentro de `app`.
- Dados locais em `backend/data/*.json` sao operacionais e ficam ignorados pelo Git. Para servidor interno, prefira MongoDB configurado via `.env.local`.

## Variaveis de ambiente

Use `.env.example` como base e crie `.env.local` no servidor. O arquivo real de ambiente nao deve ser versionado.

## Scripts uteis

```bash
npm run dev          # desenvolvimento
npm run build        # build de producao
npm run start        # servidor Next apos build
npm run seed:admin   # cria/atualiza usuario admin
```

## Observacao sobre build

O build com Next 16/Turbopack passa. Pode aparecer aviso de NFT nas rotas de termos que geram DOCX por causa do uso de templates em `backend/templates`; isso fica restrito a `preview` e `generate`, que sao as rotas que realmente precisam ler os modelos.
