'use client';

import type { ExercicioSessao, SerieRealizada } from '@/modules/sessao/domain/SessaoTreino';
import { formatarPesoKg } from '@/shared/utils/formatacao';

interface PropsCardExercicio {
  exercicio: ExercicioSessao;
  indice: number;
  totalExercicios: number;
  seriesFeitas: number;
  seriesRegistradas: SerieRealizada[];
}

// Exercício atual na sessão ativa — números gigantes, legível de longe.
export function CardExercicio({
  exercicio,
  indice,
  totalExercicios,
  seriesFeitas,
  seriesRegistradas,
}: PropsCardExercicio) {
  const serieAtual = Math.min(seriesFeitas + 1, exercicio.seriesPlanejadas);
  return (
    <section className="flex flex-col gap-4">
      <p className="font-titulo text-xs font-semibold uppercase tracking-[0.2em] text-fogo">
        Exercício {indice + 1} de {totalExercicios}
      </p>
      <h2 className="font-titulo text-4xl font-bold uppercase leading-[0.95] tracking-tight text-texto">
        {exercicio.nome}
      </h2>

      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1.5" aria-label="Séries concluídas">
          {Array.from({ length: exercicio.seriesPlanejadas }, (_, posicao) => (
            <span
              key={posicao}
              className={`h-1.5 flex-1 rounded-full ${
                posicao < seriesFeitas ? 'gradiente-fogo' : 'bg-borda'
              }`}
            />
          ))}
        </div>
        <span className="font-titulo text-sm font-semibold uppercase tracking-wide text-texto-suave">
          Série {serieAtual} de {exercicio.seriesPlanejadas}
        </span>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 rounded-xl border border-borda bg-superficie px-4 py-3">
          <p className="font-titulo text-[0.65rem] font-semibold uppercase tracking-widest text-texto-suave">
            Meta reps
          </p>
          <p className="font-numero text-2xl text-texto">
            {exercicio.repeticoesMin} – {exercicio.repeticoesMax}
          </p>
        </div>
        {exercicio.cargaReferenciaKg !== null && (
          <div className="flex-1 rounded-xl border border-borda bg-superficie px-4 py-3">
            <p className="font-titulo text-[0.65rem] font-semibold uppercase tracking-widest text-texto-suave">
              Referência
            </p>
            <p className="font-numero text-2xl text-texto">
              {formatarPesoKg(exercicio.cargaReferenciaKg)}
            </p>
          </div>
        )}
      </div>

      {seriesRegistradas.length > 0 && (
        <ul className="flex flex-col gap-2">
          {seriesRegistradas.map((serie) => (
            <li
              key={serie.id}
              className="flex items-center justify-between rounded-xl border border-fogo/30 bg-fogo/10 px-4 py-2.5"
            >
              <span className="font-titulo text-sm font-semibold uppercase tracking-wide text-texto-suave">
                Série {serie.numeroSerie}
              </span>
              <span className="flex items-center gap-2">
                <span className="font-numero text-xl text-texto">
                  {serie.repeticoes} × {formatarPesoKg(serie.pesoKg)}
                </span>
                <span aria-hidden="true" className="text-fogo">
                  ✓
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
