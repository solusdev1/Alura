import {
    previewTermForUserSnapshot,
    generateTermForUserSnapshot
} from './termo-responsabilidade.js';
import {
    getEmailFailureSummary,
    sendGeneratedTermEmail
} from './m365-mail.js';
import {
    buildTermsRepository,
    getTermById,
    listTerms,
    listResponsaveis,
    upsertResponsavel
} from '../database/termos.js';
import {
    getDevicesByIds,
    updateDevicesCurrentAssignment
} from '../database/database.js';

function toResponsibleSnapshot(responsavel) {
    return {
        id: responsavel?._id || responsavel?.id || '',
        nome: responsavel?.nome || '',
        documento: responsavel?.documento || '',
        cargo: responsavel?.cargo || 'Colaborador'
    };
}

async function resolveEquipamentos(deviceIds) {
    const devices = await getDevicesByIds(deviceIds || []);
    if (!devices.length) {
        throw new Error('TERM_DEVICES_NOT_FOUND');
    }

    return devices;
}

export async function searchResponsaveis(query = '') {
    return listResponsaveis(query);
}

export async function previewTermo(payload = {}) {
    const {
        responsavel,
        deviceIds = [],
        metadata = {},
        tipoTemplate
    } = payload;

    const equipamentos = await resolveEquipamentos(deviceIds);
    const preview = await previewTermForUserSnapshot({
        responsavel,
        equipamentos,
        metadata,
        tipoTemplate
    });

    return {
        context: preview.context,
        fileName: preview.renderedDocument.fileName,
        templateName: preview.renderedDocument.templateName
    };
}

export async function generateTermo(payload = {}) {
    const {
        responsavel,
        deviceIds = [],
        metadata = {},
        tipoTemplate,
        sendEmail = false
    } = payload;

    const equipamentos = await resolveEquipamentos(deviceIds);
    const persistedResponsible = await upsertResponsavel(responsavel || {});

    const result = await generateTermForUserSnapshot({
        prisma: buildTermsRepository(),
        responsavel: toResponsibleSnapshot(persistedResponsible),
        equipamentos,
        metadata,
        tipoTemplate
    });

    const term = result.term;

    await updateDevicesCurrentAssignment(
        result.context.itens.map(item => item.equipmentId),
        {
            responsavelAtualId: result.context.responsavel.id,
            responsavelAtualNome: result.context.responsavel.nome,
            responsavelAtualDocumento: result.context.responsavel.documento,
            responsavelAtualCargo: result.context.responsavel.cargo,
            termoAtualId: term._id,
            termoAtualVersion: term.version
        }
    );

    let emailSent = false;
    let emailRecipient = null;
    let emailError = null;

    if (sendEmail) {
        try {
            const mailResult = await sendGeneratedTermEmail({
                context: result.context,
                renderedDocument: result.renderedDocument
            });
            emailSent = true;
            emailRecipient = mailResult.recipientEmail;
        } catch (error) {
            emailError = getEmailFailureSummary(error);
            console.error('Term email send failed:', {
                termId: term._id,
                fileName: term.fileName,
                responsavelId: result.context?.responsavel?.id,
                responsavelNome: result.context?.responsavel?.nome,
                message: error?.message,
                code: error?.code,
                stack: error?.stack
            });
        }
    }

    return {
        termId: term._id,
        version: term.version,
        fileName: term.fileName,
        unchanged: false,
        responsavel: result.context.responsavel,
        items: result.context.itens,
        downloadUrl: `/api/termos/${term._id}/download`,
        emailRequested: Boolean(sendEmail),
        emailSent,
        emailRecipient,
        emailError
    };
}

export async function sendTermoEmail(termId) {
    const term = await getTermById(termId);

    if (!term) {
        throw new Error('TERM_NOT_FOUND');
    }

    const documentBase64 = String(term.documentBase64 || '').trim();
    if (!documentBase64) {
        throw new Error('TERM_DOCUMENT_NOT_FOUND');
    }

    try {
        const mailResult = await sendGeneratedTermEmail({
            context: term.contextSnapshot || {},
            renderedDocument: {
                fileName: term.fileName || 'Termo.docx',
                buffer: Buffer.from(documentBase64, 'base64')
            }
        });

        return {
            termId: term._id,
            emailRequested: true,
            emailSent: true,
            emailRecipient: mailResult.recipientEmail,
            emailError: null
        };
    } catch (error) {
        console.error('Stored term email send failed:', {
            termId: term._id,
            fileName: term.fileName,
            message: error?.message,
            code: error?.code,
            stack: error?.stack
        });

        return {
            termId: term._id,
            emailRequested: true,
            emailSent: false,
            emailRecipient: null,
            emailError: getEmailFailureSummary(error)
        };
    }
}

export async function listGeneratedTerms(query = '') {
    return listTerms({ search: query });
}

export async function getGeneratedTerm(id) {
    return getTermById(id);
}
