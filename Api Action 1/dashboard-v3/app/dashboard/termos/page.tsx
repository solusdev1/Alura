'use client';

import { useEffect, useState } from 'react';

type TermRow = {
  _id: string;
  fileName: string;
  createdAt: string;
  version: number;
  status: string;
  downloadUrl: string;
  contextSnapshot: {
    responsavel: {
      nome: string;
      documento: string;
      cargo: string;
    };
  };
};

async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Resposta inválida do servidor.' };
  }
}

export default function TermosPage() {
  const [terms, setTerms] = useState<TermRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/api/termos');
        const data = await readJsonSafe(response);
        if (!response.ok) throw new Error((data as { error: string }).error || 'Erro ao carregar termos.');
        setTerms(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar termos.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documentos</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Termos Gerados</h2>
        <p className="text-sm text-gray-500">Consulte os termos emitidos, histórico de versões e downloads disponíveis.</p>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Termos Cadastrados ({terms.length})</h3>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Carregando termos...</div>
        ) : terms.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">Nenhum termo foi gerado ainda. Você pode emitir um termo a partir da página de equipamentos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {['Responsável', 'Documento', 'Arquivo', 'Versão', 'Status', 'Data', 'Ação'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {terms.map(term => {
                  const responsavel = term.contextSnapshot.responsavel;
                  return (
                    <tr key={String(term._id || term.fileName)} className="border-b border-gray-50 dark:border-gray-800">
                      <td className="py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">{responsavel.nome || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{responsavel.documento || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{term.fileName || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{term.version ?? '-'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{term.status || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">{term.createdAt ? new Date(term.createdAt).toLocaleString('pt-BR') : '-'}</td>
                      <td className="py-3 px-4">
                        {term.downloadUrl ? (
                          <a href={term.downloadUrl} className="font-semibold text-violet-600 hover:underline">
                            BAIXAR
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
