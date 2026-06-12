'use client';

import type { ExercicioSessao } from '@/modules/sessao/domain/SessaoTreino';
import { formatarPesoKg } from '@/shared/utils/formatacao';

interface PropsCardExercicio {
  exercicio: ExercicioSessao;
  indice: number;
  totalExercicios: number;
  seriesFeitas: number;
}

// Exercício atual na sessão ativa — informação grande e legível de longe.
export function CardExercicio({
  exercicio,
  indice,
  totalExercicios,
  seriesFeitas,
}: PropsCardExercicio) {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm text-gray-500">
        Exercício {indice + 1} de {totalExercicios}
      </p>
      <h2 className="text-3xl font-bold leading-tight text-gray-900">{exercicio.nome}</h2>
      <p className="text-xl font-semibold text-primaria-600">
        {Math.min(seriesFeitas + 1, exercicio.seriesPlanejadas)}{' '}
        <span className="font-normal text-gray-600">
          de {exercicio.seriesPlanejadas} séries
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
          {exercicio.repeticoesMin}–{exercicio.repeticoesMax} reps
        </span>
        {exercicio.cargaReferenciaKg !== null && (
          <span className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
            Ref: {formatarPesoKg(exercicio.cargaReferenciaKg)}
          </span>
        )}
      </div>
      <div className="flex gap-1.5" aria-label="Séries concluídas">
        {Array.from({ length: exercicio.seriesPlanejadas }, (_, posicao) => (
          <span
            key={posicao}
            className={`h-2 flex-1 rounded-full ${
              posicao < seriesFeitas ? 'bg-primaria-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
