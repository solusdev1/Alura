import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import {
  deactivateActiveTerms,
  getLatestTermVersion,
  insertTerm
} from '../db/termos';

const TEMPLATE_PATHS: Record<string, string> = {
  CLT: path.join(/*turbopackIgnore: true*/ process.cwd(), 'backend', 'templates', 'termo_clt.docx'),
  PJ: path.join(/*turbopackIgnore: true*/ process.cwd(), 'backend', 'templates', 'termo_pj.docx')
};

type Equipamento = Record<string, unknown>;
type Responsavel = { id: string; nome: string; documento: string; cargo: string };
type Metadata = Partial<{ deliveryDate: string; tipoTemplate: string; baseId: string; baseNome: string; emittedById: string; deliveryBatchId: string; assignmentId: string }>;

function sanitizeText(...values: unknown[]): string {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const s = String(value).trim();
    if (s) return s;
  }
  return '';
}

function normalizeDocumentKey(documento: unknown): string {
  return String(documento || '').replace(/\D/g, '');
}

function normalizeResponsibleKey(params: { responsavelId: string; nome: string; documento: string }): string {
  const stableId = sanitizeText(params.responsavelId);
  if (stableId) return stableId;
  return `${sanitizeText(params.nome).toLowerCase()}::${normalizeDocumentKey(params.documento)}`;
}

function createStableHash(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function summarizeTypes(items: ReturnType<typeof normalizeEquipamento>[]): string {
  const counts = new Map<string, number>();
  items.forEach(item => {
    const tipo = sanitizeText(item.tipo, 'Item');
    counts.set(tipo, (counts.get(tipo) || 0) + 1);
  });
  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([tipo, total]) => `${tipo}: ${total}`)
    .join(' | ');
}

function normalizeEquipamento(equipamento: Equipamento, index: number) {
  const equipmentId = sanitizeText(equipamento.equipmentId, equipamento.id, `equip-${index + 1}`);
  return {
    equipmentId,
    nome: sanitizeText(equipamento.nome, equipamento.dispositivo, equipamento.hostname, equipmentId),
    tipo: sanitizeText(equipamento.tipo, equipamento.type, 'Equipamento'),
    marca: sanitizeText(equipamento.marca, equipamento.brand, equipamento.fabricante),
    modelo: sanitizeText(equipamento.modelo, equipamento.model),
    patrimonio: sanitizeText(equipamento.patrimonio, equipamento.assetTag),
    serie: sanitizeText(equipamento.serie, equipamento.serialNumber, equipamento.serial),
    imei: sanitizeText(equipamento.imei),
    observacoes: sanitizeText(equipamento.observacoes, equipamento.notes, equipamento.descricao, equipamento.hostname)
  };
}

function getTemplateMetadata(tipoTemplate: string) {
  const normalized = sanitizeText(tipoTemplate, 'CLT').toUpperCase();
  const filePath = TEMPLATE_PATHS[normalized];
  if (!filePath || !fs.existsSync(filePath)) throw new Error('TERM_TEMPLATE_NOT_FOUND');
  const fileBuffer = fs.readFileSync(filePath);
  return {
    tipoTemplate: normalized,
    fileBuffer,
    templateName: normalized === 'PJ' ? 'termo_pj.docx' : 'termo_clt.docx',
    templateVersion: '1',
    templateHash: crypto.createHash('sha256').update(fileBuffer).digest('hex')
  };
}

function sanitizeDocxTemplate(zip: PizZip) {
  Object.keys(zip.files).forEach(fileName => {
    if (!fileName.endsWith('.xml') || !fileName.startsWith('word/')) return;
    const file = zip.file(fileName);
    if (!file) return;
    const xml = file.asText();
    const normalized = xml
      .replace(/\{\{\s*([^{}]+)\s*\}\}/g, '[[$1]]')
      .replace(/\{\s*([^{}#\/][^{}]*)\s*\}\}/g, '[[$1]]')
      .replace(/\{#\s*([^{}]+)\s*\}/g, '[[#$1]]')
      .replace(/\{\/\s*([^{}]+)\s*\}/g, '[[/$1]]');
    if (normalized !== xml) zip.file(fileName, normalized);
  });
}

export function buildTermContext(params: { responsavel: Responsavel; equipamentos: Equipamento[]; metadata: Metadata }) {
  const { responsavel, equipamentos, metadata = {} } = params;
  if (!Array.isArray(equipamentos) || equipamentos.length === 0) throw new Error('INVALID_EQUIPMENT_SET');

  const nome = sanitizeText(responsavel.nome);
  const documento = sanitizeText(responsavel.documento);
  const cargo = sanitizeText(responsavel.cargo, 'Colaborador');
  if (!nome || !documento) throw new Error('INVALID_RESPONSIBLE');

  const itens = equipamentos.map(normalizeEquipamento).sort((a, b) => {
    const pc = (a.patrimonio || '').localeCompare(b.patrimonio || '');
    return pc !== 0 ? pc : a.equipmentId.localeCompare(b.equipmentId);
  });

  const itemSetHash = createStableHash(itens.map(item => ({ equipmentId: item.equipmentId, tipo: item.tipo, patrimonio: item.patrimonio, serie: item.serie })));

  const deliveryDate = metadata.deliveryDate ? new Date(metadata.deliveryDate) : new Date();
  const dataHoje = Number.isNaN(deliveryDate.getTime()) ? new Date().toLocaleDateString('pt-BR') : deliveryDate.toLocaleDateString('pt-BR');

  return {
    responsavel: {
      id: sanitizeText(responsavel.id),
      chave: normalizeResponsibleKey({ responsavelId: sanitizeText(responsavel.id), nome, documento }),
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

export function renderTermDocument(params: { tipoTemplate: string; context: ReturnType<typeof buildTermContext> }) {
  const { tipoTemplate, context } = params;
  const template = getTemplateMetadata(tipoTemplate);
  const zip = new PizZip(template.fileBuffer.toString('binary'));
  sanitizeDocxTemplate(zip);

  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, delimiters: { start: '[[', end: ']]' } });
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
    itens: context.itens.map(item => ({ ...item, serialNumber: item.serie, quantidade: 1, obs: item.observacoes }))
  });

  const safeName = context.responsavel.nome.replace(/\s+/g, '_');
  const fileName = `Termo_${template.tipoTemplate}_${safeName}.docx`;
  return {
    buffer: doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' }) as Buffer,
    fileName,
    templateName: template.templateName,
    templateVersion: template.templateVersion,
    templateHash: template.templateHash
  };
}

export async function generateTermForUserSnapshot(input: {
  responsavel: Responsavel;
  equipamentos: Equipamento[];
  metadata: Metadata;
  tipoTemplate: string;
}) {
  const context = buildTermContext({
    responsavel: input.responsavel,
    equipamentos: input.equipamentos,
    metadata: { ...input.metadata, tipoTemplate: input.tipoTemplate || input.metadata.tipoTemplate }
  });

  const renderedDocument = renderTermDocument({
    tipoTemplate: input.tipoTemplate || context.emissao.tipoTemplate,
    context
  });

  await deactivateActiveTerms(context.responsavel.chave);
  const latestVersion = await getLatestTermVersion(context.responsavel.id);
  const createdAt = new Date().toISOString();

  const term = await insertTerm({
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

  return { term, context, renderedDocument };
}
