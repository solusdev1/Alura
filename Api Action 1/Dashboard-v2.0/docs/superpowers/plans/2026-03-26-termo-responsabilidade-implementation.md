# Termo de Responsabilidade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add reusable CLT/PJ term generation with MongoDB-backed responsible-party reuse, term version history, current device ownership updates, and frontend selection/generation flows.

**Architecture:** Keep term-building and DOCX rendering in a pure backend module, move Mongo persistence into a dedicated repository layer, expose thin Express routes, and add a React modal-driven batch action from the inventory table. Persist generated DOCX files in Mongo as base64 so the flow works in local development and Vercel-hosted production without filesystem writes.

**Tech Stack:** Express, MongoDB, React, Vite, Docxtemplater, PizZip, Node buffers/base64

---

## File structure map

- Create: `server/lib/termo-responsabilidade.js`
- Create: `server/database/termos.js`
- Create: `server/routes/termos.js`
- Create: `src/components/GerarTermoModal.jsx`
- Modify: `server/database/database.js`
- Modify: `server/index.js`
- Modify: `src/components/App.jsx`
- Modify: `src/services/api.js`
- Modify: `src/styles/App.css`
- Modify: `package.json`
- Reuse: `public/termo_clt.docx`
- Reuse: `public/termo_pj.docx`

### Task 1: Install and wire backend DOCX dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Add DOCX dependencies**

Add `docxtemplater` and `pizzip` to runtime dependencies in `package.json`.

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: lockfile updated with the two new packages and install exits with code 0

- [ ] **Step 3: Verify packages are present**

Run: `npm ls docxtemplater pizzip`
Expected: both packages listed under the project

### Task 2: Extend inventory persistence with current-owner fields

**Files:**
- Modify: `server/database/database.js`

- [ ] **Step 1: Update allowed device fields**

Extend device create/update sanitization to include:
- `responsavelAtualId`
- `responsavelAtualNome`
- `responsavelAtualDocumento`
- `responsavelAtualCargo`
- `termoAtualId`
- `termoAtualVersion`

- [ ] **Step 2: Preserve existing ownership fields during merges**

Update merge logic so synced devices keep manual ownership fields from existing records, similar to `cloud`, `setor`, and `dataAlteracao`.

- [ ] **Step 3: Add targeted helper for bulk ownership updates**

Add a repository-style helper in `server/database/database.js` for bulk updating selected devices with current owner and active-term references.

- [ ] **Step 4: Run syntax verification**

Run: `node --check server/database/database.js`
Expected: no syntax errors

### Task 3: Build the reusable term domain module

**Files:**
- Create: `server/lib/termo-responsabilidade.js`

- [ ] **Step 1: Implement normalization helpers**

Create helpers for:
- text sanitization
- CPF/CNPJ normalization
- responsible key normalization
- stable hashing
- device normalization from dashboard records
- item summary aggregation

- [ ] **Step 2: Implement `buildTermContext`**

Port the agreed snapshot contract so it:
- validates selected devices
- requires `nome` and `documento`
- sorts items deterministically
- computes `itemSetHash`
- produces a closed `context`

- [ ] **Step 3: Implement template resolution**

Read `public/termo_clt.docx` and `public/termo_pj.docx` as read-only assets through a `getTemplateMetadata(tipoTemplate)` helper.

- [ ] **Step 4: Implement `renderTermDocument`**

Use `PizZip` and `Docxtemplater` to render the DOCX from `context`, returning:
- `buffer`
- `fileName`
- `templateName`
- `templateVersion`
- `templateHash`

- [ ] **Step 5: Implement preview/generation helpers**

Add:
- `previewTermForUserSnapshot`
- `generateTermForUserSnapshot`

Keep these thin and repository-driven rather than Mongo-specific.

- [ ] **Step 6: Run syntax verification**

Run: `node --check server/lib/termo-responsabilidade.js`
Expected: no syntax errors

### Task 4: Add MongoDB repository for responsaveis and termos

**Files:**
- Create: `server/database/termos.js`

- [ ] **Step 1: Implement responsible reuse**

Create helpers to:
- normalize document
- detect `CPF` vs `CNPJ`
- find existing responsible by normalized document
- insert or update canonical responsible data

- [ ] **Step 2: Implement version sequencing**

Add helper to find the latest term version for a `responsavelId` and return `nextVersion`.

- [ ] **Step 3: Implement term persistence**

Create a function that saves:
- metadata
- `contextSnapshot`
- base64 DOCX
- version
- template metadata

- [ ] **Step 4: Implement device ownership update**

After saving a term, bulk update selected devices with current owner fields and active-term references.

- [ ] **Step 5: Implement query helpers**

Add repository helpers for:
- listing responsaveis for search
- listing terms
- fetching a term by id
- returning a term download payload

- [ ] **Step 6: Run syntax verification**

Run: `node --check server/database/termos.js`
Expected: no syntax errors

### Task 5: Expose term routes in Express

**Files:**
- Create: `server/routes/termos.js`
- Modify: `server/index.js`

- [ ] **Step 1: Implement `/api/termos/responsaveis`**

Return searchable responsible records for autocomplete.

- [ ] **Step 2: Implement `/api/termos/preview`**

Resolve selected devices, build preview context, and surface warnings if devices already belong to another current responsible.

- [ ] **Step 3: Implement `/api/termos/generate`**

Drive the full flow:
- validate payload
- resolve/create responsible
- build context
- render DOCX
- save new term version
- update devices
- return term metadata

- [ ] **Step 4: Implement listing/detail/download routes**

Add:
- `GET /api/termos`
- `GET /api/termos/:id`
- `GET /api/termos/:id/download`

- [ ] **Step 5: Mount routes in `server/index.js`**

Register the terms router under `/api/termos`.

- [ ] **Step 6: Run syntax verification**

Run: `node --check server/routes/termos.js`
Expected: no syntax errors

### Task 6: Add frontend API client methods

**Files:**
- Modify: `src/services/api.js`

- [ ] **Step 1: Add responsible search client**

Create `searchTermResponsaveis(query)`.

- [ ] **Step 2: Add preview client**

Create `previewTerm(payload)`.

- [ ] **Step 3: Add generate/list/detail/download clients**

Create:
- `generateTerm(payload)`
- `getTerms(params?)`
- `getTermById(id)`
- `getTermDownloadUrl(id)`

- [ ] **Step 4: Run frontend build check**

Run: `npm run build`
Expected: build still passes or fails only on not-yet-implemented UI imports from later tasks

### Task 7: Add device selection and batch action to the inventory table

**Files:**
- Modify: `src/components/App.jsx`

- [ ] **Step 1: Add selection state**

Track selected device ids and derive selected device objects from the existing filtered inventory.

- [ ] **Step 2: Add row checkboxes and select-all support**

Enable selecting devices from the main table without breaking row click behavior for details.

- [ ] **Step 3: Add batch action bar**

Show `Gerar termo` only when at least one device is selected.

- [ ] **Step 4: Add current owner display**

Expose the current responsible fields in the table or details modal so the new ownership model is visible after generation.

- [ ] **Step 5: Run targeted syntax verification**

Run: `node --check src/components/App.jsx`
Expected: if `node --check` is not valid for JSX, skip and verify through Vite build in Task 9

### Task 8: Build the term-generation modal

**Files:**
- Create: `src/components/GerarTermoModal.jsx`
- Modify: `src/components/App.jsx`
- Modify: `src/styles/App.css`

- [ ] **Step 1: Create modal component skeleton**

Props should include:
- `open`
- `devices`
- `onClose`
- `onSuccess`

- [ ] **Step 2: Implement responsible selection flow**

Allow:
- searching existing responsaveis
- switching to manual responsible entry
- editing `nome`, `documento`, `cargo`

- [ ] **Step 3: Implement template selection and preview**

Add template selector (`CLT`/`PJ`) and call preview before final generation to show:
- total items
- item summary
- overwrite warnings

- [ ] **Step 4: Implement generate/download success flow**

On confirm:
- call generate API
- show success message
- offer immediate DOCX download
- return generated data to parent

- [ ] **Step 5: Integrate modal into `App.jsx`**

Open modal from the batch action bar, refresh inventory after success, and clear selection.

- [ ] **Step 6: Style modal states**

Add styles for:
- selection bar
- modal layout
- preview summary
- warning block
- success/download section

### Task 9: Verify backend and frontend together

**Files:**
- No code changes required unless bugs are found

- [ ] **Step 1: Run backend syntax checks**

Run:
- `node --check server/index.js`
- `node --check server/database/database.js`
- `node --check server/database/termos.js`
- `node --check server/routes/termos.js`
- `node --check server/lib/termo-responsabilidade.js`

Expected: all commands succeed

- [ ] **Step 2: Run frontend production build**

Run: `npm run build`
Expected: Vite build succeeds

- [ ] **Step 3: Smoke-test the main flow manually**

Run: `npm run server:only`
Expected:
- server starts without route-registration errors
- inventory endpoints still work
- terms endpoints are mounted

- [ ] **Step 4: Document any deployment env additions**

Capture required env/config changes for Vercel and MongoDB production in a short implementation note or README update if needed.

### Task 10: Finish the branch cleanly

**Files:**
- Review all modified files

- [ ] **Step 1: Re-run final verification**

Run the full verification set from Task 9 after any final fixes.

- [ ] **Step 2: Summarize deployment-impacting changes**

List:
- new Mongo collections
- new dependencies
- new API endpoints
- any required Vercel env vars

- [ ] **Step 3: Prepare for branch completion**

Do not merge or commit unrelated dirty-worktree changes. Only include files related to the term implementation if a commit is requested later.
