import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEMPLATE_PATHS = {
    CLT: join(__dirname, '../../public/termo_clt.docx'),
    PJ: join(__dirname, '../../public/termo_pj.docx')
};

function sanitizeText(...values) {
    for (const value of values) {
        if (value === undefined || value === null) continue;
        const sanitized = String(value).trim();
        if (sanitized) return sanitized;
    }
    return '';
}

function normalizeDocumentKey(documento) {
    return String(documento || '').replace(/\D/g, '');
}

function normalizeResponsibleKey({ responsavelId, nome, documento }) {
    const stableId = sanitizeText(responsavelId);
    if (stableId) return stableId;
    return `${sanitizeText(nome).toLowerCase()}::${normalizeDocumentKey(documento)}`;
}

function createStableHash(value) {
    return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function summarizeTypes(items) {
    const counts = new Map();
    items.forEach(item => {
        const tipo = sanitizeText(item.tipo, 'Item');
        counts.set(tipo, (counts.get(tipo) || 0) + 1);
    });

    return Array.from(counts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([tipo, total]) => `${tipo}: ${total}`)
        .join(' | ');
}

function validateEquipamentosSnapshot(equipamentos) {
    if (!Array.isArray(equipamentos) || equipamentos.length === 0) {
        throw new Error('INVALID_EQUIPMENT_SET');
    }
}

function normalizeEquipamento(equipamento, index) {
    const equipmentId = sanitizeText(equipamento?.equipmentId, equipamento?.id, `equip-${index + 1}`);
    return {
        equipmentId,
        nome: sanitizeText(equipamento?.nome, equipamento?.dispositivo, equipamento?.hostname, equipmentId),
        tipo: sanitizeText(equipamento?.tipo, equipamento?.type, 'Equipamento'),
        marca: sanitizeText(equipamento?.marca, equipamento?.brand, equipamento?.fabricante),
        modelo: sanitizeText(equipamento?.modelo, equipamento?.model),
        patrimonio: sanitizeText(equipamento?.patrimonio, equipamento?.assetTag),
        serie: sanitizeText(equipamento?.serie, equipamento?.serialNumber, equipamento?.serial),
        imei: sanitizeText(equipamento?.imei),
        observacoes: sanitizeText(
            equipamento?.observacoes,
            equipamento?.notes,
            equipamento?.descricao,
            equipamento?.hostname
        )
    };
}

function getTemplateMetadata(tipoTemplate) {
    const normalizedType = sanitizeText(tipoTemplate, 'CLT').toUpperCase();
    const filePath = TEMPLATE_PATHS[normalizedType];

    if (!filePath || !fs.existsSync(filePath)) {
        throw new Error('TERM_TEMPLATE_NOT_FOUND');
    }

    const fileBuffer = fs.readFileSync(filePath);

    return {
        tipoTemplate: normalizedType,
        fileBuffer,
        templateName: normalizedType === 'PJ' ? 'termo_pj.docx' : 'termo_clt.docx',
        templateVersion: '1',
        templateHash: crypto.createHash('sha256').update(fileBuffer).digest('hex')
    };
}

function sanitizeDocxTemplate(zip) {
    Object.keys(zip.files).forEach((fileName) => {
        if (!fileName.endsWith('.xml')) return;
        if (!fileName.startsWith('word/')) return;

        const file = zip.file(fileName);
        if (!file) return;

        const xml = file.asText();
        const normalizedXml = xml
            // Os templates recebidos misturam tags como "{{campo}}",
            // "{campo}}" e blocos "{#itens}". Convertendo tudo para
            // delimitadores proprietarios evitamos conflitos na leitura.
            .replace(/\{\{\s*([^{}]+?)\s*\}\}/g, '[[$1]]')
            .replace(/\{\s*([^{}#\/][^{}]*?)\s*\}\}/g, '[[$1]]')
            .replace(/\{#\s*([^{}]+?)\s*\}/g, '[[#$1]]')
            .replace(/\{\/\s*([^{}]+?)\s*\}/g, '[[/$1]]');

        if (normalizedXml !== xml) {
            zip.file(fileName, normalizedXml);
        }
    });
}

export function buildTermContext({
    responsavel,
    equipamentos,
    metadata = {}
}) {
    validateEquipamentosSnapshot(equipamentos);

    const nome = sanitizeText(responsavel?.nome, equipamentos[0]?.responsible, equipamentos[0]?.adDisplayName);
    const documento = sanitizeText(responsavel?.documento);
    const cargo = sanitizeText(responsavel?.cargo, 'Colaborador');

    if (!nome || !documento) {
        throw new Error('INVALID_RESPONSIBLE');
    }

    const itens = equipamentos
        .map(normalizeEquipamento)
        .sort((a, b) => {
            const patrimonioCompare = (a.patrimonio || '').localeCompare(b.patrimonio || '');
            if (patrimonioCompare !== 0) return patrimonioCompare;
            return a.equipmentId.localeCompare(b.equipmentId);
        });

    const itemSetHash = createStableHash(
        itens.map(item => ({
            equipmentId: item.equipmentId,
            tipo: item.tipo,
            patrimonio: item.patrimonio,
            serie: item.serie
        }))
    );

    const deliveryDate = metadata.deliveryDate ? new Date(metadata.deliveryDate) : new Date();
    const dataHoje = Number.isNaN(deliveryDate.getTime())
        ? new Date().toLocaleDateString('pt-BR')
        : deliveryDate.toLocaleDateString('pt-BR');

    return {
        responsavel: {
            id: sanitizeText(responsavel?.id),
            chave: normalizeResponsibleKey({
                responsavelId: sanitizeText(responsavel?.id),
                nome,
                documento
            }),
            nome: nome.toUpperCase(),
            documento,
            cargo
        },
        emissao: {
            data: dataHoje,
            baseId: sanitizeText(metadata.baseId),
            baseNome: sanitizeText(metadata.baseNome),
            emittedById: sanitizeText(metadata.emittedById),
            deliveryBatchId: sanitizeText(metadata.deliveryBatchId),
            assignmentId: sanitizeText(metadata.assignmentId),
            tipoTemplate: sanitizeText(metadata.tipoTemplate, 'CLT').toUpperCase()
        },
        itens,
        totalItens: itens.length,
        resumoTipos: summarizeTypes(itens),
        itemSetHash
    };
}

export function renderTermDocument({ tipoTemplate, context }) {
    const template = getTemplateMetadata(tipoTemplate);
    const zip = new PizZip(template.fileBuffer.toString('binary'));
    sanitizeDocxTemplate(zip);

    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: {
            start: '[[',
            end: ']]'
        }
    });

    doc.render({
        nome: context.responsavel.nome,
        documento: context.responsavel.documento,
        cpf: context.responsavel.documento,
        cnpj: context.responsavel.documento,
        cargo: context.responsavel.cargo,
        data: context.emissao.data,
        data_hoje: context.emissao.data,
        total_itens: context.totalItens,
        resumo_tipos: context.resumoTipos,
        base_emissora: context.emissao.baseNome || '-',
        itens: context.itens.map(item => ({
            ...item,
            serialNumber: item.serie,
            quantidade: 1,
            obs: item.observacoes
        }))
    });

    const safeName = context.responsavel.nome.replace(/\s+/g, '_');
    const fileName = `Termo_${template.tipoTemplate}_${safeName}.docx`;

    return {
        buffer: doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE'
        }),
        fileName,
        templateName: template.templateName,
        templateVersion: template.templateVersion,
        templateHash: template.templateHash
    };
}

export async function replaceActiveTermForUser({
    prisma,
    context,
    renderedDocument
}) {
    await prisma.deactivateActiveTerms(context.responsavel.chave);

    const latestVersion = await prisma.getLatestTermVersion(context.responsavel.id);
    const createdAt = new Date().toISOString();

    return prisma.insertTerm({
        responsavelId: context.responsavel.id,
        responsavelChave: context.responsavel.chave,
        version: latestVersion + 1,
        status: 'ATIVO',
        tipoTemplate: context.emissao.tipoTemplate,
        itemSetHash: context.itemSetHash,
        totalItens: context.totalItens,
        resumoTipos: context.resumoTipos,
        baseId: context.emissao.baseId || '',
        baseNome: context.emissao.baseNome || '',
        emittedById: context.emissao.emittedById || '',
        deliveryBatchId: context.emissao.deliveryBatchId || '',
        assignmentId: context.emissao.assignmentId || '',
        fileName: renderedDocument.fileName,
        templateName: renderedDocument.templateName,
        templateVersion: renderedDocument.templateVersion,
        templateHash: renderedDocument.templateHash,
        documentBase64: renderedDocument.buffer.toString('base64'),
        contextSnapshot: context,
        createdAt,
        updatedAt: createdAt
    });
}

export async function createTermSnapshot({
    prisma,
    context,
    renderedDocument
}) {
    const term = await replaceActiveTermForUser({
        prisma,
        context,
        renderedDocument
    });

    return {
        term,
        replaced: true,
        unchanged: false
    };
}

export async function previewTermForUserSnapshot(input) {
    const context = buildTermContext({
        responsavel: input.responsavel,
        equipamentos: input.equipamentos,
        metadata: {
            ...input.metadata,
            tipoTemplate: input.tipoTemplate || input.metadata?.tipoTemplate
        }
    });

    const renderedDocument = renderTermDocument({
        tipoTemplate: input.tipoTemplate || context.emissao.tipoTemplate,
        context
    });

    return { context, renderedDocument };
}

export async function generateTermForUserSnapshot({
    prisma,
    ...input
}) {
    const { context, renderedDocument } = await previewTermForUserSnapshot(input);
    const snapshot = await createTermSnapshot({
        prisma,
        context,
        renderedDocument
    });

    return {
        ...snapshot,
        context,
        renderedDocument
    };
}
