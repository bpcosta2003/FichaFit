'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useProgressaoCarga } from '@/modules/sessao/application/useProgressaoCarga';
import { useSessaoAtiva } from '@/modules/sessao/application/useSessaoAtiva';
import { seriesDoExercicio } from '@/modules/sessao/domain/SessaoTreino';
import type { SugestaoCarga } from '@/modules/sessao/domain/progressaoCarga';
import { AvisoProgressao } from '@/shared/components/AvisoProgressao';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { CardExercicio } from '@/shared/components/CardExercicio';
import { LogadorSerie } from '@/shared/components/LogadorSerie';
import { ModalConfirmacao } from '@/shared/components/ModalConfirmacao';
import { ProgressoSessao } from '@/shared/components/ProgressoSessao';
import { TimerDescanso } from '@/shared/components/TimerDescanso';
import { useStatusOnline } from '@/shared/hooks/useStatusOnline';
import { useTimer } from '@/shared/hooks/useTimer';
import { formatarPesoKg } from '@/shared/utils/formatacao';

interface PropsFichaTreinoPage {
  fichaId: string;
}

// TELA PRINCIPAL — sessão de treino ativa.
// Contrato UX: ações primárias no bottom 40%, header não-interativo,
// timer substitui os inputs (nunca overlay), nenhum modal durante uso ativo.
export function FichaTreinoPage({ fichaId }: PropsFichaTreinoPage) {
  const router = useRouter();
  const { online } = useStatusOnline();
  const {
    sessao,
    carregando,
    erro,
    exercicio,
    progresso,
    completa,
    seriesFeitas,
    sugerirPeso,
    iniciar,
    registrar,
    concluir,
    cancelar,
  } = useSessaoAtiva(fichaId);
  const timer = useTimer();
  const { sugerir: sugerirProgressao, carregando: carregandoProgressao } = useProgressaoCarga();
  const [repeticoes, setRepeticoes] = useState(8);
  const [pesoKg, setPesoKg] = useState(0);
  const [sugestaoProgressao, setSugestaoProgressao] = useState<SugestaoCarga | null>(null);
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const jaIniciou = useRef(false);

  useEffect(() => {
    if (!carregando && sessao === null && !jaIniciou.current) {
      jaIniciou.current = true;
      void iniciar();
    }
  }, [carregando, sessao, iniciar]);

  // Pré-preenche reps e peso ao trocar de série ou de exercício.
  const exercicioId = exercicio?.exercicioFichaId ?? null;
  const sugerirPesoRef = useRef(sugerirPeso);
  sugerirPesoRef.current = sugerirPeso;
  const sugerirProgressaoRef = useRef(sugerirProgressao);
  sugerirProgressaoRef.current = sugerirProgressao;
  const repeticoesMinRef = useRef(exercicio?.repeticoesMin ?? 8);
  repeticoesMinRef.current = exercicio?.repeticoesMin ?? 8;
  const cargaReferenciaRef = useRef(exercicio?.cargaReferenciaKg ?? null);
  cargaReferenciaRef.current = exercicio?.cargaReferenciaKg ?? null;
  // carregandoProgressao entra nas deps para reaplicar o prefill quando o
  // histórico (Dexie) terminar de carregar.
  useEffect(() => {
    if (exercicioId === null) {
      return;
    }
    setRepeticoes(repeticoesMinRef.current);
    if (seriesFeitas === 0) {
      // Primeira série: sugere a carga com base na última sessão concluída.
      const sugestao = sugerirProgressaoRef.current(exercicioId, cargaReferenciaRef.current);
      setPesoKg(sugestao.pesoKg);
      setSugestaoProgressao(sugestao);
    } else {
      // Séries seguintes: mantém o peso da última série desta sessão.
      setPesoKg(sugerirPesoRef.current(exercicioId));
      setSugestaoProgressao(null);
    }
  }, [exercicioId, seriesFeitas, carregandoProgressao]);

  const aoRegistrar = async (): Promise<void> => {
    if (exercicio === null || progresso === null) {
      return;
    }
    await registrar(repeticoes, pesoKg);
    const foiUltimaSerieGeral = progresso.seriesRealizadas + 1 >= progresso.seriesPlanejadas;
    if (!foiUltimaSerieGeral) {
      timer.iniciar(exercicio.descansoSegundos);
    }
  };

  const aoConcluir = async (): Promise<void> => {
    const sessaoId = sessao?.id;
    await concluir();
    router.replace(sessaoId !== undefined ? `/historico/${sessaoId}` : '/historico');
  };

  const aoEncerrarSemConcluir = async (): Promise<void> => {
    await cancelar();
    router.replace('/treinos');
  };

  if (carregando) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-fundo">
        <p className="text-texto-suave">Carregando treino…</p>
      </div>
    );
  }

  if (erro !== null || sessao === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-fundo p-6 text-center">
        <p className="text-lg text-texto">
          {erro ?? 'Não foi possível abrir esta sessão de treino.'}
        </p>
        <BotaoGrande variante="secundaria" tamanho="medio" onClick={() => router.push('/treinos')}>
          Voltar para as fichas
        </BotaoGrande>
      </div>
    );
  }

  const seriesAtuais =
    exercicio !== null ? seriesDoExercicio(sessao, exercicio.exercicioFichaId) : [];

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-fundo">
      {/* Header fixo, não-interativo (exceto o voltar) */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-borda bg-fundo px-4 pb-3 pt-4">
        <button
          type="button"
          aria-label="Voltar para as fichas"
          onClick={() => router.push('/treinos')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-texto-suave active:bg-superficie"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="truncate font-titulo text-base font-semibold uppercase tracking-wide text-texto">
              {sessao.nomeFicha}
            </h1>
            {progresso !== null && (
              <span className="shrink-0 text-xs font-medium text-texto-suave">
                {!online && '· offline · '}
                Ex. {Math.min(progresso.exerciciosConcluidos + 1, progresso.totalExercicios)} de{' '}
                {progresso.totalExercicios}
              </span>
            )}
          </div>
          {progresso !== null && (
            <ProgressoSessao
              concluidos={progresso.exerciciosConcluidos}
              total={progresso.totalExercicios}
            />
          )}
        </div>
      </header>

      <main aria-live="polite" className="flex flex-1 flex-col justify-center px-5 py-6">
        {completa ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span aria-hidden="true" className="text-5xl">
              🏆
            </span>
            <h2 className="font-titulo text-3xl font-bold uppercase tracking-tight text-texto">
              Treino completo!
            </h2>
            <p className="text-texto-suave">
              Todas as séries foram registradas. Conclua para salvar no histórico.
            </p>
          </div>
        ) : timer.ativo ? (
          <div className="flex flex-col gap-6">
            <TimerDescanso segundosRestantes={timer.segundosRestantes} total={timer.total} />
            {exercicio !== null && (
              <div className="rounded-2xl border border-borda bg-superficie px-4 py-3">
                <p className="font-titulo text-[0.65rem] font-semibold uppercase tracking-widest text-texto-suave">
                  A seguir
                </p>
                <p className="font-titulo text-lg font-semibold uppercase tracking-tight text-texto">
                  {exercicio.nome} · Série {Math.min(seriesFeitas + 1, exercicio.seriesPlanejadas)}
                </p>
                <p className="text-sm text-texto-suave">
                  Meta {exercicio.repeticoesMin}–{exercicio.repeticoesMax} reps
                  {exercicio.cargaReferenciaKg !== null &&
                    ` · ${formatarPesoKg(exercicio.cargaReferenciaKg)}`}
                </p>
              </div>
            )}
          </div>
        ) : (
          exercicio !== null &&
          progresso !== null && (
            <div className="flex flex-col gap-4">
              <CardExercicio
                exercicio={exercicio}
                indice={progresso.exerciciosConcluidos}
                totalExercicios={progresso.totalExercicios}
                seriesFeitas={seriesFeitas}
                seriesRegistradas={seriesAtuais}
              />
              {seriesFeitas === 0 && sugestaoProgressao !== null && (
                <AvisoProgressao
                  motivo={sugestaoProgressao.motivo}
                  pesoKg={sugestaoProgressao.pesoKg}
                  pesoAnteriorKg={sugestaoProgressao.pesoAnteriorKg}
                />
              )}
            </div>
          )
        )}
      </main>

      {/* Ações primárias na metade inferior — acessíveis com o polegar */}
      <section className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {completa ? (
          <BotaoGrande onClick={() => void aoConcluir()}>Concluir Treino</BotaoGrande>
        ) : timer.ativo ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <BotaoGrande variante="secundaria" onClick={() => timer.ajustar(-15)}>
                −15s
              </BotaoGrande>
              <BotaoGrande variante="secundaria" onClick={() => timer.ajustar(15)}>
                +15s
              </BotaoGrande>
            </div>
            <BotaoGrande onClick={timer.pular}>Pular Descanso</BotaoGrande>
          </div>
        ) : (
          exercicio !== null && (
            <LogadorSerie
              repeticoes={repeticoes}
              pesoKg={pesoKg}
              numeroSerie={Math.min(seriesFeitas + 1, exercicio.seriesPlanejadas)}
              aoMudarRepeticoes={setRepeticoes}
              aoMudarPeso={setPesoKg}
              aoRegistrar={() => void aoRegistrar()}
            />
          )
        )}
        {!timer.ativo && (
          <button
            type="button"
            onClick={() => setConfirmandoSaida(true)}
            className="mt-3 min-h-toque w-full text-center text-sm font-medium text-texto-suave"
          >
            Encerrar sem concluir
          </button>
        )}
      </section>

      <ModalConfirmacao
        aberto={confirmandoSaida}
        titulo="Encerrar treino?"
        descricao="As séries já registradas serão mantidas, mas o treino ficará marcado como não concluído."
        rotuloConfirmar="Encerrar treino"
        rotuloCancelar="Continuar treinando"
        perigo
        aoConfirmar={() => void aoEncerrarSemConcluir()}
        aoCancelar={() => setConfirmandoSaida(false)}
      />
    </div>
  );
}
