import { sendGeneratedTermEmail, getEmailFailureSummary } from '../m365/mail';
import { getTermById, listTerms, listResponsaveis, upsertResponsavel } from '../db/termos';
import { getDevicesByIds, updateDevicesCurrentAssignment } from '../db/devices';

type TermPayload = {
  responsavel: Record<string, unknown>;
  deviceIds: string[];
  metadata: Record<string, unknown>;
  tipoTemplate: string;
  sendEmail: boolean;
};
type TermPayloadInput = Partial<TermPayload>;

function toResponsibleSnapshot(responsavel: Record<string, unknown>) {
  return {
    id: String(responsavel._id || responsavel.id || ''),
    nome: String(responsavel.nome || ''),
    documento: String(responsavel.documento || ''),
    cargo: String(responsavel.cargo || 'Colaborador')
  };
}

async function resolveEquipamentos(deviceIds: string[]) {
  const devices = await getDevicesByIds(deviceIds || []);
  if (!devices.length) throw new Error('TERM_DEVICES_NOT_FOUND');
  return devices;
}

export async function searchResponsaveis(query = '') {
  return listResponsaveis(query);
}

export async function previewTermo(payload: TermPayloadInput = {}) {
  const { responsavel, deviceIds = [], metadata = {}, tipoTemplate } = payload;
  const equipamentos = await resolveEquipamentos(deviceIds);
  const { generateTermForUserSnapshot } = await import('./generator');
  const { context, renderedDocument } = await generateTermForUserSnapshot({
    responsavel: toResponsibleSnapshot((responsavel || {}) as Record<string, unknown>),
    equipamentos,
    metadata,
    tipoTemplate: tipoTemplate || 'CLT'
  });
  return { context, fileName: renderedDocument.fileName, templateName: renderedDocument.templateName };
}

export async function generateTermo(payload: TermPayloadInput = {}) {
  const { responsavel, deviceIds = [], metadata = {}, tipoTemplate, sendEmail = false } = payload;
  const equipamentos = await resolveEquipamentos(deviceIds);
  const persistedResponsible = await upsertResponsavel(responsavel || {});
  const { generateTermForUserSnapshot } = await import('./generator');

  const result = await generateTermForUserSnapshot({
    responsavel: toResponsibleSnapshot(persistedResponsible as Record<string, unknown>),
    equipamentos,
    metadata,
    tipoTemplate: tipoTemplate || 'CLT'
  });

  const term = result.term as Record<string, unknown>;

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
  let emailRecipient: string | null = null;
  let emailError: string | null = null;

  if (sendEmail) {
    try {
      const mailResult = await sendGeneratedTermEmail({ context: result.context, renderedDocument: result.renderedDocument });
      emailSent = true;
      emailRecipient = mailResult.recipientEmail;
    } catch (error) {
      emailError = getEmailFailureSummary(error);
      console.error('Term email send failed:', { termId: term._id, error: (error as Error).message });
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

export async function sendTermoEmail(termId: string) {
  const term = await getTermById(termId) as Record<string, unknown> | null;
  if (!term) throw new Error('TERM_NOT_FOUND');
  const documentBase64 = String(term.documentBase64 || '').trim();
  if (!documentBase64) throw new Error('TERM_DOCUMENT_NOT_FOUND');

  try {
    const mailResult = await sendGeneratedTermEmail({
      context: (term.contextSnapshot || {}) as Record<string, unknown>,
      renderedDocument: { fileName: String(term.fileName || 'Termo.docx'), buffer: Buffer.from(documentBase64, 'base64') }
    });
    return { termId: term._id, emailRequested: true, emailSent: true, emailRecipient: mailResult.recipientEmail, emailError: null };
  } catch (error) {
    return { termId: term._id, emailRequested: true, emailSent: false, emailRecipient: null, emailError: getEmailFailureSummary(error) };
  }
}

export async function listGeneratedTerms(query = '') {
  return listTerms({ search: query });
}

export async function getGeneratedTerm(id: string) {
  return getTermById(id);
}
