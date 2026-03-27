import {
    previewTermForUserSnapshot,
    generateTermForUserSnapshot
} from './termo-responsabilidade.js';
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
        tipoTemplate
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

    return {
        termId: term._id,
        version: term.version,
        fileName: term.fileName,
        unchanged: false,
        responsavel: result.context.responsavel,
        items: result.context.itens,
        downloadUrl: `/api/termos/${term._id}/download`
    };
}

export async function listGeneratedTerms(query = '') {
    return listTerms({ search: query });
}

export async function getGeneratedTerm(id) {
    return getTermById(id);
}

