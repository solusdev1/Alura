import fs from 'fs';
import { join } from 'path';

const ACTION1_BASE_URL = 'https://app.action1.com/api/3.0';

type EnvMap = Record<string, string>;

let cachedEnvFileValues: EnvMap | null = null;
let cachedAction1Token: string | null = null;
let tokenExpiresAt: number = 0;

function stripWrappingQuotes(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function parseEnvFile(filePath: string): EnvMap {
  if (!fs.existsSync(filePath)) return {};

  try {
    const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
    const values: EnvMap = {};

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1);
      values[key] = stripWrappingQuotes(value);
    }

    return values;
  } catch {
    return {};
  }
}

function getEnvFileValues(): EnvMap {
  if (cachedEnvFileValues) return cachedEnvFileValues;

  const cwd = process.cwd();
  const candidates = [
    join(cwd, '..', 'Dashboard-v2.0', '.env'), // Menor prioridade (projeto antigo)
    join(cwd, '.env'),                         // Prioridade média
    join(cwd, '.env.local')                    // Maior prioridade (sempre vence)
  ];

  cachedEnvFileValues = candidates.reduce<EnvMap>((acc, filePath) => {
    const values = parseEnvFile(filePath);
    return { ...acc, ...values };
  }, {});

  return cachedEnvFileValues;
}

function getResolvedEnv(name: string) {
  const runtimeValue = stripWrappingQuotes(String(process.env[name] || ''));
  if (runtimeValue) return runtimeValue;

  const fileValue = stripWrappingQuotes(getEnvFileValues()[name] || '');
  return fileValue;
}

function getAuthPayload() {
  const payload = {
    grant_type: 'client_credentials',
    client_id: getResolvedEnv('ACTION1_CLIENT_ID'),
    client_secret: getResolvedEnv('ACTION1_CLIENT_SECRET'),
    scope: 'api'
  };

  const safeId = payload.client_id ? `${payload.client_id.substring(0, 5)}...` : 'VAZIO';
  const safeSecretLength = payload.client_secret ? payload.client_secret.length : 0;
  
  console.log('--------------------------------------------------');
  console.log('[DEBUG] Tentando autenticar na Action1...');
  console.log(`[DEBUG] Client ID (5 primeiros chars): ${safeId}`);
  console.log(`[DEBUG] Client Secret (tamanho do texto): ${safeSecretLength} caracteres`);
  console.log('--------------------------------------------------');

  return payload;
}

class Action1ApiError extends Error {
  status: number;
  retryAfterMs: number;

  constructor(message: string, status: number, retryAfterMs = 0) {
    super(message);
    this.name = 'Action1ApiError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readRetryAfterMs(response: Response): number {
  const raw = response.headers.get('retry-after');
  if (!raw) return 0;

  const seconds = Number(raw);
  if (!Number.isNaN(seconds)) return seconds * 1000;

  const dateMs = new Date(raw).getTime();
  return Number.isNaN(dateMs) ? 0 : Math.max(0, dateMs - Date.now());
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    throw new Action1ApiError(`Erro API ${response.status}: ${text.substring(0, 300)}`, response.status, readRetryAfterMs(response));
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`Resposta nao JSON: ${text.substring(0, 300)}`);
  }

  return JSON.parse(text);
}

function isForbiddenError(error: unknown): boolean {
  return String((error as { message: string }).message || '').includes('Erro API 403');
}

async function requestAction1Json(url: string, init: RequestInit, options: { maxAttempts?: number; context: string }) {
  const maxAttempts = options.maxAttempts ?? 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      return await parseJsonResponse(response);
    } catch (error) {
      const action1Error = error as Partial<Action1ApiError>;
      const isRateLimited = action1Error.status === 429;
      const isTransient = action1Error.status === 502 || action1Error.status === 503 || action1Error.status === 504;

      if ((isRateLimited || isTransient) && attempt < maxAttempts) {
        const waitMs = Math.max(action1Error.retryAfterMs || 0, attempt * 1500);
        console.warn(`Action1 ${options.context || 'request'} tentativa ${attempt}/${maxAttempts} falhou com ${action1Error.status}. Nova tentativa em ${waitMs}ms.`);
        await sleep(waitMs);
        continue;
      }

      console.error(`\n[ERRO API ACTION1] Falha na requisicao para: ${url}\nDetalhes do Erro:`, error);
      throw error;
    }
  }

  throw new Error('ACTION1_REQUEST_FAILED');
}

export async function authenticateAction1(): Promise<string> {
  // Reutiliza o token se ainda for valido (com margem de seguranca de 1 minuto)
  if (cachedAction1Token && Date.now() < tokenExpiresAt - 60000) {
    return cachedAction1Token;
  }

  const authPayload = getAuthPayload();

  if (!authPayload.client_id || !authPayload.client_secret) {
    throw new Error('ACTION1_CREDENTIALS_MISSING');
  }

  try {
    const payload = await requestAction1Json(
      `${ACTION1_BASE_URL}/oauth2/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(authPayload)
      },
      { context: 'auth' }
    );

    if (!payload.access_token) {
      throw new Error('ACTION1_TOKEN_MISSING');
    }

    cachedAction1Token = payload.access_token;
    // Action1 tokens geralmente expiram em 1 hora (3600s). Fazemos fallback para 50 min.
    const expiresInMs = payload.expires_in ? (payload.expires_in * 1000) : 50 * 60 * 1000;
    tokenExpiresAt = Date.now() + expiresInMs;

    return cachedAction1Token;
  } catch (error) {
    console.error('\n[ERRO AUTENTICACAO] Detalhes da recusa da Action1:', error);
    const message = String((error as { message: string }).message || '');

    if (message.includes('Erro API 401')) {
      throw new Error('Falha na autenticacao com o Action1. Revise ACTION1_CLIENT_ID e ACTION1_CLIENT_SECRET.');
    }

    if (message.includes('Erro API 429')) {
      throw new Error('A API do Action1 limitou temporariamente a sincronizacao. Aguarde alguns instantes e tente novamente.');
    }

    throw error instanceof Error ? error : new Error('ACTION1_AUTH_FAILED');
  }
}

async function action1Get(path: string, token: string) {
  return requestAction1Json(
    `${ACTION1_BASE_URL}${path}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } },
    { context: path }
  );
}

async function listAllEndpointsByKind(kind: string, organizationId: string, token: string, existingIds = new Set<string>()) {
  const uniqueItems: unknown[] = [];
  let from = 0;
  const limit = 50;
  let hasMore = true;

  while (hasMore) {
    const payload = await action1Get(`/endpoints/${kind}/${organizationId}?fields=*&limit=${limit}&from=${from}`, token);
    const items: { id: string }[] = payload.items || [];
    const totalItems: number = payload.total_items || payload.total || 0;

    if (!items.length) break;

    for (const item of items) {
      if (existingIds.has(item.id)) continue;
      existingIds.add(item.id);
      uniqueItems.push(item);
    }

    from += limit;
    hasMore = from < totalItems && items.length > 0;

    if (hasMore) {
      await sleep(250);
    }
  }

  return uniqueItems;
}

export async function listOrganizationEndpoints(organizationId: string, token: string) {
  const seenIds = new Set<string>();
  const managed = await listAllEndpointsByKind('managed', organizationId, token, seenIds);
  let unmanaged: unknown[] = [];

  try {
    unmanaged = await listAllEndpointsByKind('unmanaged', organizationId, token, seenIds);
  } catch (error) {
    if (!isForbiddenError(error)) throw error;
    console.warn(`Action1 unmanaged sem permissao para org ${organizationId}`);
  }

  return [...managed, ...unmanaged];
}

export async function listAllEndpoints(token: string) {
  const data = await action1Get('/organizations', token);
  const organizations: { id: string }[] = data.items || [];

  if (!organizations.length) {
    throw new Error('ACTION1_ORGANIZATIONS_NOT_FOUND');
  }

  const endpoints: unknown[] = [];

  for (const org of organizations) {
    const orgEndpoints = await listOrganizationEndpoints(org.id, token);
    endpoints.push(...orgEndpoints);
  }

  return endpoints;
}
