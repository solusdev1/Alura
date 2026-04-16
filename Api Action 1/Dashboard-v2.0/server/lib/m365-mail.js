import fetch from 'node-fetch';
import { validateEmail } from '../utils/security.js';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

function getRequiredEnv(name) {
    const value = String(process.env[name] || '').trim();
    return value;
}

export function getM365MailConfig() {
    return {
        tenantId: getRequiredEnv('M365_TENANT_ID'),
        clientId: getRequiredEnv('M365_CLIENT_ID'),
        clientSecret: getRequiredEnv('M365_CLIENT_SECRET'),
        senderEmail: getRequiredEnv('M365_SENDER_EMAIL'),
        recipientEmail: getRequiredEnv('M365_RECIPIENT_EMAIL')
    };
}

export function validateM365MailConfig() {
    const config = getM365MailConfig();
    const missing = Object.entries(config)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        const error = new Error(`M365_EMAIL_NOT_CONFIGURED:${missing.join(',')}`);
        error.code = 'M365_EMAIL_NOT_CONFIGURED';
        throw error;
    }

    if (!validateEmail(config.senderEmail) || !validateEmail(config.recipientEmail)) {
        const error = new Error('M365_EMAIL_INVALID_ADDRESS');
        error.code = 'M365_EMAIL_INVALID_ADDRESS';
        throw error;
    }

    return config;
}

async function getGraphAccessToken(config) {
    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: GRAPH_SCOPE,
        grant_type: 'client_credentials'
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`M365_TOKEN_ERROR:${response.status}:${errorText}`);
        error.code = 'M365_TOKEN_ERROR';
        throw error;
    }

    const data = await response.json();
    if (!data?.access_token) {
        const error = new Error('M365_TOKEN_MISSING');
        error.code = 'M365_TOKEN_MISSING';
        throw error;
    }

    return data.access_token;
}

function buildEmailMessage({ context, renderedDocument, config }) {
    const responsibleName = context?.responsavel?.nome || 'RESPONSAVEL';
    const totalItems = context?.totalItens || 0;
    const emissionDate = context?.emissao?.data || new Date().toLocaleDateString('pt-BR');

    return {
        message: {
            subject: `Termo de responsabilidade - ${responsibleName}`,
            body: {
                contentType: 'Text',
                content: [
                    `Olá,`,
                    ``,
                    `Segue em anexo o termo de responsabilidade gerado para ${responsibleName}.`,
                    `Quantidade de itens: ${totalItems}.`,
                    `Data de emissão: ${emissionDate}.`,
                    ``,
                    `Este email foi enviado automaticamente pelo sistema de inventário.`
                ].join('\n')
            },
            toRecipients: [
                {
                    emailAddress: {
                        address: config.recipientEmail
                    }
                }
            ],
            attachments: [
                {
                    '@odata.type': '#microsoft.graph.fileAttachment',
                    name: renderedDocument.fileName,
                    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    contentBytes: renderedDocument.buffer.toString('base64')
                }
            ]
        },
        saveToSentItems: true
    };
}

function summarizeEmailError(error) {
    const code = error?.code || '';
    const message = String(error?.message || '');

    if (code === 'M365_EMAIL_NOT_CONFIGURED') {
        return 'Microsoft 365 não configurado no ambiente.';
    }

    if (code === 'M365_EMAIL_INVALID_ADDRESS') {
        return 'Endereço de email do Microsoft 365 inválido.';
    }

    if (code === 'M365_TOKEN_ERROR' || code === 'M365_TOKEN_MISSING') {
        return 'Falha ao autenticar no Microsoft 365.';
    }

    if (code === 'M365_SEND_ERROR') {
        return 'Falha ao enviar email pelo Microsoft 365.';
    }

    if (message.startsWith('M365_EMAIL_NOT_CONFIGURED')) {
        return 'Microsoft 365 não configurado no ambiente.';
    }

    return 'Falha ao enviar email pelo Microsoft 365.';
}

export async function sendGeneratedTermEmail({ context, renderedDocument }) {
    const config = validateM365MailConfig();
    const accessToken = await getGraphAccessToken(config);
    const payload = buildEmailMessage({ context, renderedDocument, config });
    const sender = encodeURIComponent(config.senderEmail);

    const response = await fetch(`${GRAPH_BASE_URL}/users/${sender}/sendMail`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`M365_SEND_ERROR:${response.status}:${errorText}`);
        error.code = 'M365_SEND_ERROR';
        throw error;
    }

    return {
        recipientEmail: config.recipientEmail,
        senderEmail: config.senderEmail
    };
}

export function getEmailFailureSummary(error) {
    return summarizeEmailError(error);
}
