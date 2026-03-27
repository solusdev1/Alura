# Design: Termo de Responsabilidade no Dashboard-v2.0

## Objetivo

Integrar ao `Dashboard-v2.0` um fluxo de geracao de termo de responsabilidade com templates `CLT` e `PJ`, permitindo que o TI selecione equipamentos do inventario atual, informe ou reutilize um responsavel, gere um novo DOCX versionado e mantenha historico completo no MongoDB.

O sistema tambem deve preparar o projeto para operacao 100% online, com persistencia centralizada em MongoDB e comportamento compativel com deploy na Vercel.

## Escopo da primeira versao

- Selecionar equipamentos da tabela atual, incluindo itens sincronizados e itens manuais.
- Informar manualmente `nome`, `CPF/CNPJ` e `cargo` do responsavel no momento da geracao, com reaproveitamento posterior.
- Manter um cadastro leve de responsaveis no MongoDB, sem depender de API externa.
- Gerar novo termo sempre que o TI confirmar a operacao.
- Salvar snapshot fechado do responsavel e dos equipamentos no momento da emissao.
- Atualizar o vinculo atual dos equipamentos para refletir a posse operacional mais recente.
- Baixar o DOCX gerado a partir dos templates reais `CLT` e `PJ`.

## Fora de escopo desta fase

- Assinatura digital.
- Cadastro administrativo separado de responsaveis.
- Workflow de aprovacao.
- Edicao retroativa de termos antigos.
- Integracao com API externa de RH ou identidade.

## Requisitos funcionais

### Geracao de termo

1. O usuario do TI seleciona um ou mais equipamentos na tabela principal.
2. O usuario escolhe o template `CLT` ou `PJ`.
3. O usuario pode:
   - buscar um responsavel ja utilizado anteriormente; ou
   - cadastrar um novo responsavel informando nome, documento e cargo.
4. O sistema monta um `context` padronizado com responsavel, itens e metadados.
5. O sistema gera um novo DOCX preenchido.
6. O sistema cria um novo registro versionado de termo no MongoDB.
7. O sistema atualiza o vinculo atual dos equipamentos selecionados para o responsavel escolhido.

### Historico

- Todo termo antigo deve permanecer imutavel.
- O historico deve ser consultavel por responsavel ou por termo.
- O arquivo DOCX precisa continuar disponivel para download depois da geracao.

### Posse atual do equipamento

- Cada equipamento deve guardar quem e o responsavel atual.
- Se um equipamento trocar de pessoa, o vinculo atual e atualizado apenas na operacao nova.
- O termo anterior continua preservado como fotografia historica.

## Arquitetura proposta

### Backend

Adicionar tres camadas novas no servidor Express:

1. `server/lib/termo-responsabilidade.js`
   - modulo puro e reutilizavel
   - responsavel por normalizacao, validacao, hash, montagem de contexto e renderizacao DOCX

2. `server/database/termos.js`
   - adaptador MongoDB para responsaveis e termos
   - responsavel por buscar/criar responsavel, calcular proxima versao, salvar termo e atualizar dispositivos

3. `server/routes/termos.js`
   - endpoints HTTP para preview, geracao, listagem e download

### Frontend

Adicionar ao fluxo existente do inventario:

- selecao de linhas na tabela
- acao em lote `Gerar termo`
- modal de geracao de termo com:
  - seletor de template
  - busca de responsavel existente
  - formulario manual para novo responsavel
  - resumo dos equipamentos selecionados
  - confirmacao da operacao

## Modelo de dados

### Colecao `responsaveis`

Documento canonico e leve para reutilizacao futura.

```js
{
  _id,
  nome,
  documento,
  documentoNormalizado,
  tipoDocumento, // CPF ou CNPJ
  cargo,
  status, // ATIVO por padrao
  createdAt,
  updatedAt
}
```

### Colecao `termos_responsabilidade`

Historico imutavel dos documentos gerados.

```js
{
  _id,
  responsavelId,
  responsavelChave,
  version,
  status, // ATIVO por padrao nesta fase
  tipoTemplate, // CLT ou PJ
  itemSetHash,
  totalItens,
  resumoTipos,
  baseId,
  baseNome,
  emittedById,
  deliveryBatchId,
  assignmentId,
  fileName,
  templateName,
  templateVersion,
  templateHash,
  documentBase64,
  contextSnapshot,
  createdAt
}
```

### Colecao `devices`

Manter estrutura atual e adicionar os campos de posse operacional:

```js
{
  ...camposExistentes,
  responsavelAtualId,
  responsavelAtualNome,
  responsavelAtualDocumento,
  responsavelAtualCargo,
  termoAtualId,
  termoAtualVersion,
  updatedAt
}
```

## Contrato do modulo de termo

O modulo de dominio deve preservar a interface do projeto anterior sempre que possivel, trocando apenas a persistencia Prisma por adaptadores Mongo.

```js
export function buildTermContext({ responsavel, equipamentos, metadata = {} }) {}
export function renderTermDocument({ tipoTemplate, context }) {}
export async function previewTermForUserSnapshot(input) {}
export async function generateTermForUserSnapshot({ repository, ...input }) {}
```

O contrato de montagem do snapshot continua sendo o coracao da regra:

- validar conjunto de equipamentos
- normalizar responsavel
- ordenar itens de forma estavel
- gerar `itemSetHash`
- produzir `contextSnapshot` fechado

## Politica de versionamento

- Sempre gerar nova versao quando o TI confirmar a operacao.
- A versao e sequencial por responsavel.
- Termos antigos nunca sao editados.
- `itemSetHash` continua sendo salvo para auditoria e comparacao futura.
- Se o mesmo conjunto for gerado novamente, ainda assim a nova versao e criada.
- Futuramente pode existir apenas um aviso de duplicidade, sem bloquear a geracao.

## Regras de vinculacao de responsavel

### Cadastro leve

- O TI informa manualmente `nome`, `CPF/CNPJ` e `cargo`.
- Se o `documentoNormalizado` ja existir em `responsaveis`, o sistema reutiliza o cadastro.
- Se o nome ou cargo mudarem, o cadastro canonico e atualizado antes da nova geracao.

### Vinculo atual por equipamento

Ao gerar um termo:

- todos os equipamentos selecionados passam a apontar para o responsavel escolhido;
- o `termoAtualId` e `termoAtualVersion` sao atualizados nesses itens;
- o termo salvo mantem seu proprio snapshot independente do estado futuro dos equipamentos.

## Templates DOCX

### Templates suportados

- `CLT`
- `PJ`

### Origem dos arquivos

Os dois modelos reais existentes devem ser usados como base.

Para compatibilidade com Vercel:

- os templates nao devem depender de escrita em disco;
- o backend deve ler os arquivos como assets somente-leitura;
- a resolucao de template deve ser abstraida, por exemplo `templateProvider.get(tipoTemplate)`.

## Endpoints propostos

### `GET /api/termos/responsaveis`

Lista responsaveis ja utilizados.

Uso:

- autocomplete por nome
- busca por documento

### `POST /api/termos/preview`

Recebe:

```js
{
  tipoTemplate,
  responsavel,
  equipamentoIds,
  metadata
}
```

Retorna:

- responsavel resolvido
- equipamentos resolvidos
- resumo do contexto
- avisos de conflito ou sobrescrita de posse atual

### `POST /api/termos/generate`

Recebe os mesmos dados do preview e:

- cria ou reutiliza o responsavel
- gera o DOCX
- salva termo versionado
- atualiza os equipamentos

Retorna:

```js
{
  termId,
  version,
  fileName,
  responsavel,
  items,
  createdAt
}
```

### `GET /api/termos`

Lista historico de termos com filtros por:

- responsavel
- documento
- template
- periodo

### `GET /api/termos/:id`

Retorna detalhes do snapshot salvo.

### `GET /api/termos/:id/download`

Retorna o arquivo DOCX armazenado no MongoDB.

## Fluxo de UI

### Selecao

- adicionar checkbox por linha na tabela principal
- permitir selecao mista de equipamentos sincronizados e manuais
- exibir barra de acoes em lote quando houver selecao

### Modal `GerarTermoModal`

Campos:

- `tipoTemplate` (`CLT` ou `PJ`)
- busca por responsavel existente
- opcao para novo responsavel
- nome
- documento
- cargo

Resumo exibido:

- quantidade de itens selecionados
- lista resumida dos itens
- total por tipo
- alertas sobre equipamentos ja vinculados a outro responsavel atual

### Pos-confirmacao

- gerar termo
- exibir feedback de sucesso
- oferecer botao de download imediato
- limpar selecao
- atualizar tabela com novo responsavel atual

## Persistencia do DOCX

Na primeira versao, o DOCX sera salvo no MongoDB usando `documentBase64`.

Motivos:

- evita dependencia de filesystem na Vercel;
- simplifica deploy online;
- mantem historico autocontido;
- reduz numero de integracoes externas nesta fase.

Limite conhecido:

- crescimento do banco conforme volume de termos.

Mitigacao futura:

- mover armazenamento binario para blob storage e manter apenas referencia.

## Operacao 100% online com MongoDB e Vercel

### Objetivo

Eliminar dependencia operacional de MongoDB local para o fluxo principal do sistema.

### Diretriz

- usar `MONGODB_URI` hospedado em nuvem
- usar o backend de rotas/funcao em ambiente online
- evitar qualquer dependencia de escrita local no runtime
- manter fallback local apenas para desenvolvimento se necessario, sem ser o caminho principal de producao

### Ajustes necessarios

- centralizar configuracao para ambiente Vercel
- remover qualquer dependencia de caminhos locais para assets gravados
- tratar templates DOCX como assets de leitura
- garantir que o fluxo de geracao use apenas MongoDB remoto e memoria temporaria

## Tratamento de erros

### Backend

Erros esperados:

- responsavel sem nome ou documento
- nenhum equipamento selecionado
- equipamento inexistente
- template inexistente
- falha de renderizacao DOCX
- falha de persistencia MongoDB

Resposta padrao:

```js
{
  success: false,
  error: "CODIGO_ERRO",
  message: "Mensagem legivel para o TI"
}
```

### Frontend

- exibir erro amigavel no modal
- manter selecao atual para evitar retrabalho
- nao limpar formulario em caso de falha

## Seguranca e rastreabilidade

- apenas TI gera termo nesta fase
- registrar `emittedById` quando houver identidade do operador disponivel
- salvar `createdAt` em todos os documentos
- manter snapshot fechado do que foi emitido

## Testes recomendados

### Unidade

- normalizacao de responsavel
- normalizacao de itens heterogeneos
- ordenacao estavel dos itens
- hash do conjunto
- renderizacao com template `CLT`
- renderizacao com template `PJ`

### Integracao

- criar novo responsavel e gerar termo
- reutilizar responsavel existente e gerar nova versao
- atualizar posse atual de equipamentos
- baixar DOCX armazenado

### UI

- selecionar multiplos equipamentos
- abrir modal
- buscar responsavel existente
- cadastrar novo responsavel
- gerar e baixar termo

## Plano incremental de implementacao

1. Preparar assets de template e modulo puro de termo.
2. Modelar colecoes Mongo e repositrio de termos/responsaveis.
3. Criar endpoints Express.
4. Adicionar selecao de equipamentos na UI.
5. Implementar modal de geracao.
6. Integrar download e historico.
7. Ajustar operacao para deploy online/Vercel.

## Decisoes validadas

- usar os dois templates reais `CLT` e `PJ`
- selecao mista de equipamentos
- responsavel informado manualmente pelo TI na primeira vez
- cadastro leve com reaproveitamento posterior
- modelo opcao 3: responsavel canonico + vinculo atual por equipamento + snapshot por termo
- sempre gerar nova versao
- salvar historico no MongoDB
- preparar sistema para operacao 100% online

## Riscos e mitigacoes

### Ambiguidade de responsavel por nome

Mitigacao:

- identidade primaria baseada em `documentoNormalizado`

### Crescimento do tamanho do MongoDB por DOCX em base64

Mitigacao:

- aceitavel na fase inicial
- planejar blob storage em fase futura

### Conflito de posse operacional

Mitigacao:

- mostrar aviso no preview antes da confirmacao
- sempre registrar historico completo antes de atualizar o estado atual
