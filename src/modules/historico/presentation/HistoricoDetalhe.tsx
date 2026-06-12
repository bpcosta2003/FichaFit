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

export function HistoricoDetalhe({ sessaoId }: PropsHistoricoDetalhe) {
  const router = useRouter();
  const { sessao, carregando } = useSessaoHistorico(sessaoId);

  if (carregando) {
    return <p className="px-4 py-8 text-center text-gray-500">Carregando sessão…</p>;
  }

  if (sessao === null) {
    return (
      <div className="flex flex-col gap-4 px-4 py-8 text-center">
        <p className="text-gray-600">Sessão não encontrada.</p>
        <BotaoGrande variante="secundaria" onClick={() => router.push('/historico')}>
          Voltar para o histórico
        </BotaoGrande>
      </div>
    );
  }

  const exercicios = [...sessao.exercicios].sort((a, b) => a.ordem - b.ordem);

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-gray-900">{sessao.nomeFicha}</h1>
        <p className="text-sm text-gray-500">
          {formatarDataRelativa(sessao.iniciadaEm)} · {formatarDuracao(duracaoSegundos(sessao))}
          {sessao.status === 'cancelada' && ' · não concluído'}
        </p>
      </header>

      {sessao.series.length === 0 ? (
        <p className="rounded-2xl bg-gray-50 px-6 py-8 text-center text-gray-600">
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
                className="rounded-2xl border border-gray-200 bg-white p-4"
              >
                <h2 className="font-semibold text-gray-900">{exercicio.nome}</h2>
                <ul className="mt-2 flex flex-col gap-1">
                  {series.map((serie) => (
                    <li key={serie.id} className="flex justify-between text-sm text-gray-600">
                      <span>Série {serie.numeroSerie}</span>
                      <span>
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
    </div>
  );
}
