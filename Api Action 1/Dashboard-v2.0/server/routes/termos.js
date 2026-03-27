import { Router } from 'express';
import {
    previewTermForUserSnapshot,
    generateTermForUserSnapshot
} from '../lib/termo-responsabilidade.js';
import {
    buildTermsRepository,
    getTermById,
    listTerms,
    listResponsaveis,
    upsertResponsavel
} from '../database/termos.js';
import { getDevicesByIds, updateDevicesCurrentAssignment } from '../database/database.js';

const router = Router();

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

router.get('/responsaveis', async (req, res) => {
    try {
        const items = await listResponsaveis(req.query.q || '');
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/preview', async (req, res) => {
    try {
        const { responsavel, deviceIds = [], metadata = {}, tipoTemplate } = req.body || {};
        const equipamentos = await resolveEquipamentos(deviceIds);

        const preview = await previewTermForUserSnapshot({
            responsavel,
            equipamentos,
            metadata,
            tipoTemplate
        });

        res.json({
            success: true,
            data: {
                context: preview.context,
                fileName: preview.renderedDocument.fileName,
                templateName: preview.renderedDocument.templateName
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/generate', async (req, res) => {
    try {
        const { responsavel, deviceIds = [], metadata = {}, tipoTemplate } = req.body || {};
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

        res.status(201).json({
            success: true,
            data: {
                termId: term._id,
                version: term.version,
                fileName: term.fileName,
                unchanged: false,
                responsavel: result.context.responsavel,
                items: result.context.itens,
                downloadUrl: `/api/termos/${term._id}/download`
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const items = await listTerms({ search: req.query.q || '' });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const term = await getTermById(req.params.id);
        if (!term) {
            return res.status(404).json({ success: false, error: 'TERM_NOT_FOUND' });
        }
        res.json({ success: true, data: term });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

router.get('/:id/download', async (req, res) => {
    try {
        const term = await getTermById(req.params.id);
        if (!term) {
            return res.status(404).json({ success: false, error: 'TERM_NOT_FOUND' });
        }

        const buffer = Buffer.from(term.documentBase64, 'base64');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${term.fileName}"`);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
