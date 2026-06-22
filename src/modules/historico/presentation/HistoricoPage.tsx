'use client';

import Link from 'next/link';

import { useHistorico } from '@/modules/historico/application/useHistorico';
import { duracaoSegundos, type SessaoTreino } from '@/modules/sessao/domain/SessaoTreino';
import { formatarDataRelativa, formatarDuracao } from '@/shared/utils/formatacao';

const UM_DIA_MS = 24 * 60 * 60 * 1000;

function diaLocal(iso: string): number {
  const d = new Date(iso);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function treinosNaSemana(sessoes: SessaoTreino[]): number {
  const limite = Date.now() - 7 * UM_DIA_MS;
  return sessoes.filter((s) => new Date(s.iniciadaEm).getTime() >= limite).length;
}

// Sequência de dias consecutivos com treino, terminando hoje ou ontem.
function sequenciaDias(sessoes: SessaoTreino[]): number {
  const dias = new Set(sessoes.map((s) => diaLocal(s.iniciadaEm)));
  if (dias.size === 0) {
    return 0;
  }
  const hoje = diaLocal(new Date().toISOString());
  let cursor = dias.has(hoje) ? hoje : hoje - UM_DIA_MS;
  let total = 0;
  while (dias.has(cursor)) {
    total += 1;
    cursor -= UM_DIA_MS;
  }
  return total;
}

export function HistoricoPage() {
  const { sessoes, carregando } = useHistorico();

  if (carregando) {
    return <p className="px-5 py-8 text-center text-texto-suave">Carregando histórico…</p>;
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <h1 className="font-titulo text-5xl font-bold uppercase leading-tight tracking-tight text-texto">
        Histórico
      </h1>

      {sessoes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-borda bg-superficie px-6 py-10 text-center">
          <p className="text-texto-suave">
            Nenhum treino concluído ainda. Quando você concluir uma sessão, ela aparece aqui.
          </p>
          <Link
            href="/treinos"
            className="flex min-h-toque items-center font-titulo font-semibold uppercase tracking-wide text-fogo"
          >
            Ir para minhas fichas
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-borda bg-superficie px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-texto-suave">Esta semana</p>
              <p className="font-numero text-4xl leading-none text-fogo">
                {treinosNaSemana(sessoes)}
              </p>
              <p className="text-xs text-texto-suave">treinos</p>
            </div>
            <div className="rounded-2xl border border-borda bg-superficie px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-texto-suave">Sequência</p>
              <p className="font-numero text-4xl leading-none text-fogo">
                {sequenciaDias(sessoes)}
              </p>
              <p className="text-xs text-texto-suave">dias</p>
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            {sessoes.map((sessao) => (
              <li key={sessao.id}>
                <Link
                  href={`/historico/${sessao.id}`}
                  className="flex min-h-toque flex-col gap-2 rounded-2xl border border-borda bg-superficie p-4 active:bg-superficie-2"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 break-words font-titulo text-xl font-bold uppercase tracking-tight text-texto">
                      {sessao.nomeFicha}
                    </span>
                    <span className="shrink-0 text-sm text-texto-suave">
                      {formatarDataRelativa(sessao.iniciadaEm)} ·{' '}
                      {formatarDuracao(duracaoSegundos(sessao))}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-lg bg-superficie-2 px-2.5 py-1 text-xs font-medium text-texto-suave">
                      {sessao.exercicios.length} exercícios
                    </span>
                    <span className="rounded-lg bg-superficie-2 px-2.5 py-1 text-xs font-medium text-texto-suave">
                      {sessao.series.length} séries
                    </span>
                    {sessao.status === 'cancelada' && (
                      <span className="rounded-lg bg-superficie-2 px-2.5 py-1 text-xs font-medium text-texto-suave">
                        não concluído
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
