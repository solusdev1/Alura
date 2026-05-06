const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

function getRequiredEnv(name: string): string {
  return String(process.env[name] || '').trim();
}

function getM365MailConfig() {
  return {
    tenantId: getRequiredEnv('M365_TENANT_ID'),
    clientId: getRequiredEnv('M365_CLIENT_ID'),
    clientSecret: getRequiredEnv('M365_CLIENT_SECRET'),
    senderEmail: getRequiredEnv('M365_SENDER_EMAIL'),
    recipientEmail: getRequiredEnv('M365_RECIPIENT_EMAIL')
  };
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateM365MailConfig() {
  const config = getM365MailConfig();
  const missing = Object.entries(config).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    const error = Object.assign(new Error(`M365_EMAIL_NOT_CONFIGURED:${missing.join(',')}`), { code: 'M365_EMAIL_NOT_CONFIGURED' });
    throw error;
  }
  if (!validateEmail(config.senderEmail) || !validateEmail(config.recipientEmail)) {
    throw Object.assign(new Error('M365_EMAIL_INVALID_ADDRESS'), { code: 'M365_EMAIL_INVALID_ADDRESS' });
  }
  return config;
}

async function getGraphAccessToken(config: ReturnType<typeof getM365MailConfig>): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`;
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, scope: GRAPH_SCOPE, grant_type: 'client_credentials' }).toString()
  });
  if (!response.ok) {
    const text = await response.text();
    throw Object.assign(new Error(`M365_TOKEN_ERROR:${response.status}:${text}`), { code: 'M365_TOKEN_ERROR' });
  }
  const data = await response.json();
  if (!data.access_token) throw Object.assign(new Error('M365_TOKEN_MISSING'), { code: 'M365_TOKEN_MISSING' });
  return data.access_token;
}

type TermContext = Record<string, unknown>;
type RenderedDocument = { fileName: string; buffer: Buffer };

export async function sendGeneratedTermEmail(params: { context: TermContext; renderedDocument: RenderedDocument }) {
  const { context, renderedDocument } = params;
  const config = validateM365MailConfig();
  const accessToken = await getGraphAccessToken(config);

  const responsavel = (context.responsavel || {}) as Record<string, unknown>;
  const emissao = (context.emissao || {}) as Record<string, unknown>;
  const payload = {
    message: {
      subject: `Termo de responsabilidade - ${responsavel.nome || 'RESPONSAVEL'}`,
      body: {
        contentType: 'Text',
        content: [
          'Olá,', '',
          `Segue em anexo o termo de responsabilidade gerado para ${responsavel.nome || 'RESPONSAVEL'}.`,
          `Quantidade de itens: ${context.totalItens || 0}.`,
          `Data de emissão: ${emissao.data || new Date().toLocaleDateString('pt-BR')}.`,
          '', 'Este email foi enviado automaticamente pelo sistema de inventário.'
        ].join('\n')
      },
      toRecipients: [{ emailAddress: { address: config.recipientEmail } }],
      attachments: [{
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: renderedDocument.fileName,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        contentBytes: renderedDocument.buffer.toString('base64')
      }]
    },
    saveToSentItems: true
  };

  const response = await fetch(`${GRAPH_BASE_URL}/users/${encodeURIComponent(config.senderEmail)}/sendMail`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw Object.assign(new Error(`M365_SEND_ERROR:${response.status}:${text}`), { code: 'M365_SEND_ERROR' });
  }

  return { recipientEmail: config.recipientEmail, senderEmail: config.senderEmail };
}

export function getEmailFailureSummary(error: unknown): string {
  const code = (error as { code: string }).code || '';
  if (code === 'M365_EMAIL_NOT_CONFIGURED') return 'Microsoft 365 não configurado no ambiente.';
  if (code === 'M365_EMAIL_INVALID_ADDRESS') return 'Endereço de email do Microsoft 365 inválido.';
  if (code === 'M365_TOKEN_ERROR' || code === 'M365_TOKEN_MISSING') return 'Falha ao autenticar no Microsoft 365.';
  if (code === 'M365_SEND_ERROR') return 'Falha ao enviar email pelo Microsoft 365.';
  return 'Falha ao enviar email pelo Microsoft 365.';
}
