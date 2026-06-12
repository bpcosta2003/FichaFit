'use client';

import Link from 'next/link';

import { useHistorico } from '@/modules/historico/application/useHistorico';
import { duracaoSegundos } from '@/modules/sessao/domain/SessaoTreino';
import { formatarDataRelativa, formatarDuracao } from '@/shared/utils/formatacao';

export function HistoricoPage() {
  const { sessoes, carregando } = useHistorico();

  if (carregando) {
    return <p className="px-4 py-8 text-center text-gray-500">Carregando histórico…</p>;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Histórico</h1>

      {sessoes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 px-6 py-10 text-center">
          <span aria-hidden="true" className="text-4xl">
            📅
          </span>
          <p className="text-gray-600">
            Nenhum treino concluído ainda. Quando você concluir uma sessão, ela aparece aqui.
          </p>
          <Link
            href="/treinos"
            className="flex min-h-toque items-center font-semibold text-primaria-600"
          >
            Ir para minhas fichas
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessoes.map((sessao) => (
            <li key={sessao.id}>
              <Link
                href={`/historico/${sessao.id}`}
                className="flex min-h-toque flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50"
              >
                <span className="text-lg font-semibold text-gray-900">{sessao.nomeFicha}</span>
                <span className="text-sm text-gray-500">
                  {formatarDataRelativa(sessao.iniciadaEm)} ·{' '}
                  {formatarDuracao(duracaoSegundos(sessao))} ·{' '}
                  {sessao.series.length === 1 ? '1 série' : `${sessao.series.length} séries`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
