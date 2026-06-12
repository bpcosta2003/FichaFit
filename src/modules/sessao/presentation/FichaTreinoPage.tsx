'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useSessaoAtiva } from '@/modules/sessao/application/useSessaoAtiva';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { CardExercicio } from '@/shared/components/CardExercicio';
import { LogadorSerie } from '@/shared/components/LogadorSerie';
import { ModalConfirmacao } from '@/shared/components/ModalConfirmacao';
import { ProgressoSessao } from '@/shared/components/ProgressoSessao';
import { useStatusOnline } from '@/shared/hooks/useStatusOnline';
import { useTimer } from '@/shared/hooks/useTimer';
import { formatarTempoTimer } from '@/shared/utils/formatacao';

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
  const [repeticoes, setRepeticoes] = useState(8);
  const [pesoKg, setPesoKg] = useState(0);
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
  const repeticoesMinRef = useRef(exercicio?.repeticoesMin ?? 8);
  repeticoesMinRef.current = exercicio?.repeticoesMin ?? 8;
  useEffect(() => {
    if (exercicioId !== null) {
      setRepeticoes(repeticoesMinRef.current);
      setPesoKg(sugerirPesoRef.current(exercicioId));
    }
  }, [exercicioId, seriesFeitas]);

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
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-gray-500">Carregando treino…</p>
      </div>
    );
  }

  if (erro !== null || sessao === null) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6 text-center">
        <p className="text-lg text-gray-700">
          {erro ?? 'Não foi possível abrir esta sessão de treino.'}
        </p>
        <BotaoGrande variante="secundaria" onClick={() => router.push('/treinos')}>
          Voltar para as fichas
        </BotaoGrande>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      {/* Header fixo, não-interativo */}
      <header className="sticky top-0 z-10 flex flex-col gap-2 border-b border-gray-100 bg-white px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <h1 className="truncate text-lg font-bold text-gray-900">{sessao.nomeFicha}</h1>
          {!online && (
            <span className="rounded-full bg-alerta px-2.5 py-1 text-xs font-semibold text-white">
              offline
            </span>
          )}
        </div>
        {progresso !== null && (
          <ProgressoSessao
            concluidos={progresso.exerciciosConcluidos}
            total={progresso.totalExercicios}
          />
        )}
      </header>

      <main aria-live="polite" className="flex flex-1 flex-col justify-center px-4 py-6">
        {completa ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <span aria-hidden="true" className="text-5xl">
              🎉
            </span>
            <h2 className="text-2xl font-bold text-gray-900">Treino completo!</h2>
            <p className="text-gray-600">
              Todas as séries foram registradas. Conclua para salvar no histórico.
            </p>
          </div>
        ) : (
          exercicio !== null &&
          progresso !== null && (
            <CardExercicio
              exercicio={exercicio}
              indice={progresso.exerciciosConcluidos}
              totalExercicios={progresso.totalExercicios}
              seriesFeitas={seriesFeitas}
            />
          )
        )}
      </main>

      {/* Ações primárias na metade inferior — acessíveis com o polegar */}
      <section className="px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {completa ? (
          <BotaoGrande onClick={() => void aoConcluir()}>Concluir Treino</BotaoGrande>
        ) : timer.ativo ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Descanso</p>
            <p className="text-6xl font-bold tabular-nums text-primaria-600">
              {formatarTempoTimer(timer.segundosRestantes)}
            </p>
            <BotaoGrande variante="secundaria" onClick={timer.pular}>
              Pular descanso
            </BotaoGrande>
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
        <button
          type="button"
          onClick={() => setConfirmandoSaida(true)}
          className="mt-3 min-h-toque w-full text-center text-sm font-medium text-gray-400"
        >
          Encerrar sem concluir
        </button>
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
