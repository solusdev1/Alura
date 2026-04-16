import { useEffect, useMemo, useState } from 'react'
import { SERVER_URL, generateTermo, previewTermo, searchTermResponsaveis, sendTermoEmail } from '../services/api.js'

const EMPTY_RESPONSAVEL = {
  nome: '',
  documento: '',
  cargo: 'Colaborador'
}

function GerarTermoModal({ open, onClose, devices, onGenerated }) {
  const [tipoTemplate, setTipoTemplate] = useState('CLT')
  const [responsavel, setResponsavel] = useState(EMPTY_RESPONSAVEL)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [loadingSendEmail, setLoadingSendEmail] = useState(false)
  const [preview, setPreview] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setTipoTemplate('CLT')
    setResponsavel(EMPTY_RESPONSAVEL)
    setSearch('')
    setSuggestions([])
    setPreview(null)
    setSubmitResult(null)
    setError('')
  }, [open])

  useEffect(() => {
    if (!open || search.trim().length < 2) {
      setSuggestions([])
      return
    }

    let active = true
    setLoadingSuggestions(true)
    searchTermResponsaveis(search)
      .then(items => {
        if (active) setSuggestions(items)
      })
      .catch(() => {
        if (active) setSuggestions([])
      })
      .finally(() => {
        if (active) setLoadingSuggestions(false)
      })

    return () => {
      active = false
    }
  }, [open, search])

  const conflitos = useMemo(() => {
    return devices.filter(device => {
      const atual = String(device.responsavelAtualNome || '').trim()
      if (!atual) return false
      return atual.toLowerCase() !== String(responsavel.nome || '').trim().toLowerCase()
    })
  }, [devices, responsavel.nome])

  if (!open) return null

  const fillFromSuggestion = (item) => {
    setResponsavel({
      nome: item.nome || '',
      documento: item.documento || '',
      cargo: item.cargo || 'Colaborador'
    })
    setSearch(item.nome || '')
    setSuggestions([])
  }

  const buildPayload = () => ({
    tipoTemplate,
    responsavel,
    deviceIds: devices.map(device => device.id),
    metadata: {
      tipoTemplate
    }
  })

  const handlePreview = async () => {
    setError('')
    setSubmitResult(null)
    setLoadingPreview(true)
    try {
      const result = await previewTermo(buildPayload())
      setPreview(result.data || null)
    } catch (err) {
      setError(err.message || 'Erro ao montar pre-visualizacao')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitResult(null)
    setLoadingSubmit(true)
    try {
      const result = await generateTermo(buildPayload())
      const data = result.data || {}
      if (data.downloadUrl) {
        window.open(`${SERVER_URL}${data.downloadUrl}`, '_blank', 'noopener,noreferrer')
      }
      setSubmitResult(data)
      await onGenerated?.(data)
    } catch (err) {
      setError(err.message || 'Erro ao gerar termo')
    } finally {
      setLoadingSubmit(false)
    }
  }

  const handleDownload = () => {
    if (!submitResult?.downloadUrl) return
    window.open(`${SERVER_URL}${submitResult.downloadUrl}`, '_blank', 'noopener,noreferrer')
  }

  const handleSendEmail = async () => {
    if (!submitResult?.termId) return

    setError('')
    setLoadingSendEmail(true)

    try {
      const result = await sendTermoEmail(submitResult.termId)
      const emailData = result.data || {}
      setSubmitResult(prev => ({
        ...(prev || {}),
        ...emailData,
        downloadUrl: prev?.downloadUrl,
        fileName: prev?.fileName,
        termId: prev?.termId || emailData.termId
      }))
    } catch (err) {
      setError(err.message || 'Erro ao enviar email do termo')
    } finally {
      setLoadingSendEmail(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="edit-modal term-modal" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="term-header">
          <div>
            <h3>Gerar termo de responsabilidade</h3>
            <p>{devices.length} equipamento(s) selecionado(s)</p>
          </div>
        </div>

        <label>Template
          <select value={tipoTemplate} onChange={(e) => setTipoTemplate(e.target.value)}>
            <option value="CLT">CLT</option>
            <option value="PJ">PJ</option>
          </select>
        </label>

        <label>Buscar responsavel ja usado
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Digite nome ou documento"
          />
        </label>

        {loadingSuggestions && <p>Buscando responsaveis...</p>}
        {!loadingSuggestions && suggestions.length > 0 && (
          <div className="term-suggestions">
            {suggestions.map(item => (
              <button
                key={item._id || item.documentoNormalizado}
                type="button"
                className="term-suggestion"
                onClick={() => fillFromSuggestion(item)}
              >
                <strong>{item.nome}</strong>
                <span>{item.documento} • {item.cargo}</span>
              </button>
            ))}
          </div>
        )}

        <label>Nome do responsavel
          <input
            value={responsavel.nome}
            onChange={(e) => setResponsavel(prev => ({ ...prev, nome: e.target.value }))}
            required
          />
        </label>

        <label>CPF ou CNPJ
          <input
            value={responsavel.documento}
            onChange={(e) => setResponsavel(prev => ({ ...prev, documento: e.target.value }))}
            required
          />
        </label>

        <label>Cargo
          <input
            value={responsavel.cargo}
            onChange={(e) => setResponsavel(prev => ({ ...prev, cargo: e.target.value }))}
          />
        </label>

        {conflitos.length > 0 && (
          <div className="term-warning">
            <strong>Atenção:</strong> {conflitos.length} item(ns) já estão vinculados a outro responsável atual.
          </div>
        )}

        <div className="term-selected-list">
          {devices.map(device => (
            <div key={device.id} className="term-selected-item">
              <strong>{device.tipo || 'Equipamento'}</strong>
              <span>{device.nome}</span>
              <small>{device.responsavelAtualNome || device.adDisplayName || device.usuario || 'Sem responsável atual'}</small>
            </div>
          ))}
        </div>

        {preview && (
          <div className="term-preview">
            <strong>Prévia</strong>
            <span>Arquivo: {preview.fileName}</span>
            <span>Total de itens: {preview.context?.totalItens || devices.length}</span>
            <span>Resumo: {preview.context?.resumoTipos || '-'}</span>
          </div>
        )}

        {submitResult && (
          <div className={`term-preview ${submitResult.emailRequested && !submitResult.emailSent ? 'term-warning' : ''}`}>
            <strong>Resultado</strong>
            <span>Termo gerado com sucesso.</span>
            {submitResult.emailRequested && submitResult.emailSent && (
              <span>Email enviado com sucesso para {submitResult.emailRecipient || 'o destinatario configurado'}.</span>
            )}
            {submitResult.emailRequested && !submitResult.emailSent && (
              <span>
                Termo gerado com sucesso, mas o envio do email falhou.
                {submitResult.emailError ? ` ${submitResult.emailError}` : ''}
              </span>
            )}
          </div>
        )}

        {error && <div className="error">{error}</div>}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>{submitResult ? 'Fechar' : 'Cancelar'}</button>
          <button type="button" onClick={handlePreview} disabled={loadingPreview || loadingSubmit || loadingSendEmail}>
            {loadingPreview ? 'Montando...' : 'Atualizar prévia'}
          </button>
          {submitResult?.downloadUrl && (
            <button type="button" onClick={handleDownload} disabled={loadingSubmit || loadingSendEmail}>
              Baixar termo
            </button>
          )}
          {submitResult?.termId && (
            <button type="button" onClick={handleSendEmail} disabled={loadingSubmit || loadingSendEmail}>
              {loadingSendEmail ? 'Enviando...' : submitResult.emailSent ? 'Enviar novamente' : 'Enviar por email'}
            </button>
          )}
          <button type="submit" disabled={loadingSubmit || loadingSendEmail}>
            {loadingSubmit ? 'Gerando...' : 'Gerar termo'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default GerarTermoModal
