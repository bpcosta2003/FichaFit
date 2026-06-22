'use client';

import { useRouter } from 'next/navigation';

import { useSessaoHistorico } from '@/modules/historico/application/useHistorico';
import { duracaoSegundos, seriesDoExercicio } from '@/modules/sessao/domain/SessaoTreino';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import {
  formatarDataRelativa,
  formatarDuracao,
  formatarPesoKg,
} from '@/shared/utils/formatacao';

interface PropsHistoricoDetalhe {
  sessaoId: string;
}

interface Estatistica {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}

export function HistoricoDetalhe({ sessaoId }: PropsHistoricoDetalhe) {
  const router = useRouter();
  const { sessao, carregando } = useSessaoHistorico(sessaoId);

  if (carregando) {
    return <p className="px-5 py-8 text-center text-texto-suave">Carregando sessão…</p>;
  }

  if (sessao === null) {
    return (
      <div className="flex flex-col gap-4 px-5 py-8 text-center">
        <p className="text-texto-suave">Sessão não encontrada.</p>
        <BotaoGrande variante="secundaria" onClick={() => router.push('/historico')}>
          Voltar para o histórico
        </BotaoGrande>
      </div>
    );
  }

  const exercicios = [...sessao.exercicios].sort((a, b) => a.ordem - b.ordem);
  const volumeKg = sessao.series.reduce((total, s) => total + s.repeticoes * s.pesoKg, 0);
  const concluida = sessao.status === 'concluida';

  const estatisticas: Estatistica[] = [
    { rotulo: 'Duração', valor: formatarDuracao(duracaoSegundos(sessao)) },
    { rotulo: 'Séries', valor: String(sessao.series.length) },
    { rotulo: 'Volume total', valor: formatarPesoKg(volumeKg) },
    { rotulo: 'Exercícios', valor: String(exercicios.length), destaque: true },
  ];

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <header className="flex flex-col items-center gap-3 text-center">
        <div className="flex w-full items-center">
          <button
            type="button"
            aria-label="Voltar para o histórico"
            onClick={() => router.push('/historico')}
            className="flex h-12 w-12 items-center justify-center rounded-full text-texto-suave active:bg-superficie"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden="true">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fogo/30 bg-fogo/10 text-3xl">
          🏆
        </div>
        <h1 className="font-titulo text-4xl font-bold uppercase leading-[0.95] tracking-tight text-texto">
          {concluida ? 'Treino concluído!' : sessao.nomeFicha}
        </h1>
        <p className="text-texto-suave">
          {sessao.nomeFicha} · {formatarDataRelativa(sessao.iniciadaEm)}
          {!concluida && ' · não concluído'}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {estatisticas.map((estatistica) => (
          <div
            key={estatistica.rotulo}
            className={`rounded-2xl border px-4 py-4 ${
              estatistica.destaque ? 'border-fogo/40 bg-fogo/10' : 'border-borda bg-superficie'
            }`}
          >
            <p
              className={`font-numero text-4xl leading-none ${
                estatistica.destaque ? 'text-fogo' : 'text-texto'
              }`}
            >
              {estatistica.valor}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wide text-texto-suave">
              {estatistica.rotulo}
            </p>
          </div>
        ))}
      </div>

      {sessao.series.length === 0 ? (
        <p className="rounded-2xl border border-borda bg-superficie px-6 py-8 text-center text-texto-suave">
          Nenhuma série foi registrada nesta sessão.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {exercicios.map((exercicio) => {
            const series = seriesDoExercicio(sessao, exercicio.exercicioFichaId);
            if (series.length === 0) {
              return null;
            }
            return (
              <li
                key={exercicio.exercicioFichaId}
                className="rounded-2xl border border-borda bg-superficie p-4"
              >
                <h2 className="font-titulo text-lg font-semibold uppercase tracking-tight text-texto">
                  {exercicio.nome}
                </h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {series.map((serie) => (
                    <li key={serie.id} className="flex justify-between text-sm">
                      <span className="text-texto-suave">Série {serie.numeroSerie}</span>
                      <span className="font-medium text-texto">
                        {serie.repeticoes} reps × {formatarPesoKg(serie.pesoKg)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}

      <BotaoGrande onClick={() => router.push('/treinos')}>Voltar aos treinos</BotaoGrande>
    </div>
  );
}
