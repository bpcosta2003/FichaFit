'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useFicha } from '@/modules/fichas/application/useFichas';
import { exerciciosOrdenados, type ExercicioFicha } from '@/modules/fichas/domain/FichaTreino';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { ModalConfirmacao } from '@/shared/components/ModalConfirmacao';
import { SeletorExercicio } from '@/shared/components/SeletorExercicio';
import { formatarPesoKg } from '@/shared/utils/formatacao';

interface PropsFichaDetalhe {
  fichaId: string;
}

interface FormularioExercicio {
  exercicioDefinicaoId: string | null;
  nome: string;
  series: number;
  repeticoesMin: number;
  repeticoesMax: number;
  cargaReferenciaKg: string;
  descansoSegundos: number;
}

const FORMULARIO_VAZIO: FormularioExercicio = {
  exercicioDefinicaoId: null,
  nome: '',
  series: 3,
  repeticoesMin: 8,
  repeticoesMax: 12,
  cargaReferenciaKg: '',
  descansoSegundos: 90,
};

const CLASSE_INPUT =
  'min-h-toque rounded-xl border border-borda bg-superficie-2 px-4 text-base text-texto outline-none placeholder:text-texto-suave focus:border-fogo';

function formularioParaExercicio(exercicio: ExercicioFicha): FormularioExercicio {
  return {
    exercicioDefinicaoId: exercicio.exercicioDefinicaoId,
    nome: exercicio.nome,
    series: exercicio.series,
    repeticoesMin: exercicio.repeticoesMin,
    repeticoesMax: exercicio.repeticoesMax,
    cargaReferenciaKg:
      exercicio.cargaReferenciaKg === null ? '' : String(exercicio.cargaReferenciaKg),
    descansoSegundos: exercicio.descansoSegundos,
  };
}

export function FichaDetalhe({ fichaId }: PropsFichaDetalhe) {
  const router = useRouter();
  const {
    ficha,
    carregando,
    editar,
    incluirExercicio,
    editarExercicio,
    excluirExercicio,
    mover,
    deletarFicha,
  } = useFicha(fichaId);
  const [adicionando, setAdicionando] = useState(false);
  const [exercicioEditandoId, setExercicioEditandoId] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioExercicio>(FORMULARIO_VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [mostrandoJustificativa, setMostrandoJustificativa] = useState(false);
  const [editandoFicha, setEditandoFicha] = useState(false);
  const [nomeFicha, setNomeFicha] = useState('');
  const [descricaoFicha, setDescricaoFicha] = useState('');
  const [erroFicha, setErroFicha] = useState<string | null>(null);

  if (carregando) {
    return <p className="px-5 py-8 text-center text-texto-suave">Carregando ficha…</p>;
  }

  if (ficha === null) {
    return (
      <div className="flex flex-col gap-4 px-5 py-8 text-center">
        <p className="text-texto-suave">Ficha não encontrada.</p>
        <BotaoGrande variante="secundaria" tamanho="medio" onClick={() => router.push('/treinos')}>
          Voltar para as fichas
        </BotaoGrande>
      </div>
    );
  }

  const exercicios = exerciciosOrdenados(ficha);

  const abrirEdicaoFicha = (): void => {
    setNomeFicha(ficha.nome);
    setDescricaoFicha(ficha.descricao ?? '');
    setErroFicha(null);
    setEditandoFicha(true);
  };

  const aoSalvarFicha = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    setErroFicha(null);
    try {
      await editar({ nome: nomeFicha, descricao: descricaoFicha });
      setEditandoFicha(false);
    } catch (causa) {
      setErroFicha(causa instanceof Error ? causa.message : 'Não foi possível editar a ficha.');
    }
  };

  const abrirEdicaoExercicio = (exercicio: ExercicioFicha): void => {
    setFormulario(formularioParaExercicio(exercicio));
    setExercicioEditandoId(exercicio.id);
    setAdicionando(true);
    setErro(null);
  };

  const aoAdicionar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    setErro(null);
    try {
      const carga = formulario.cargaReferenciaKg.trim();
      const dados = {
        exercicioDefinicaoId: formulario.exercicioDefinicaoId,
        nome: formulario.nome,
        series: formulario.series,
        repeticoesMin: formulario.repeticoesMin,
        repeticoesMax: formulario.repeticoesMax,
        cargaReferenciaKg: carga === '' ? null : Number(carga.replace(',', '.')),
        descansoSegundos: formulario.descansoSegundos,
      };
      if (exercicioEditandoId !== null) {
        await editarExercicio(exercicioEditandoId, dados);
      } else {
        await incluirExercicio(dados);
      }
      setFormulario(FORMULARIO_VAZIO);
      setExercicioEditandoId(null);
      setAdicionando(false);
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível salvar o exercício.');
    }
  };

  const aoCancelarExercicio = (): void => {
    setAdicionando(false);
    setExercicioEditandoId(null);
    setFormulario(FORMULARIO_VAZIO);
    setErro(null);
  };

  const aoDeletar = async (): Promise<void> => {
    await deletarFicha();
    router.replace('/treinos');
  };

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <header className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => router.push('/treinos')}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-texto-suave active:bg-superficie"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6" aria-hidden="true">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="min-w-0 flex-1 break-words font-titulo text-3xl font-bold uppercase leading-tight tracking-tight text-texto">
          {ficha.nome}
        </h1>
        <button
          type="button"
          aria-label="Editar ficha"
          onClick={abrirEdicaoFicha}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-texto-suave active:bg-superficie"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
          </svg>
        </button>
      </header>

      {editandoFicha && (
        <form
          onSubmit={(evento) => void aoSalvarFicha(evento)}
          className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4"
        >
          <input
            autoFocus
            required
            placeholder="Nome da ficha"
            value={nomeFicha}
            onChange={(evento) => setNomeFicha(evento.target.value)}
            className={CLASSE_INPUT}
          />
          <input
            placeholder="Descrição (opcional)"
            value={descricaoFicha}
            onChange={(evento) => setDescricaoFicha(evento.target.value)}
            className={CLASSE_INPUT}
          />
          {erroFicha !== null && (
            <p role="alert" className="text-sm font-medium text-erro">
              {erroFicha}
            </p>
          )}
          <BotaoGrande type="submit" tamanho="medio">
            Salvar ficha
          </BotaoGrande>
          <BotaoGrande
            type="button"
            variante="secundaria"
            tamanho="medio"
            onClick={() => setEditandoFicha(false)}
          >
            Cancelar
          </BotaoGrande>
        </form>
      )}

      {ficha.justificativaIA !== null && (
        <button
          type="button"
          onClick={() => setMostrandoJustificativa(true)}
          className="flex min-h-toque items-center gap-3 rounded-2xl border border-fogo/40 bg-superficie p-4 text-left active:scale-[0.99]"
        >
          <span className="gradiente-fogo flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl">
            ✨
          </span>
          <span className="flex flex-col">
            <span className="font-titulo text-sm font-bold uppercase tracking-tight text-texto">
              Por que este treino
            </span>
            <span className="text-xs text-texto-suave">
              Relembre a explicação da IA sobre este treino
            </span>
          </span>
        </button>
      )}

      {exercicios.length === 0 && !adicionando && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-borda bg-superficie px-6 py-8 text-center">
          <p className="text-texto-suave">
            Esta ficha ainda não tem exercícios. Adicione o primeiro para poder treinar.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {exercicios.map((exercicio, indice) => (
          <li
            key={exercicio.id}
            className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-4"
          >
            <button
              type="button"
              aria-label={`Editar ${exercicio.nome}`}
              onClick={() => abrirEdicaoExercicio(exercicio)}
              className="flex min-w-0 flex-1 flex-col gap-0.5 text-left"
            >
              <span className="break-words font-titulo text-lg font-semibold uppercase tracking-tight text-texto">
                {exercicio.nome}
              </span>
              <span className="text-sm text-texto-suave">
                {exercicio.series} séries · {exercicio.repeticoesMin}–{exercicio.repeticoesMax} reps
                {exercicio.cargaReferenciaKg !== null &&
                  ` · ${formatarPesoKg(exercicio.cargaReferenciaKg)}`}{' '}
                · {exercicio.descansoSegundos}s descanso
              </span>
            </button>
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                aria-label={`Mover ${exercicio.nome} para cima`}
                disabled={indice === 0}
                onClick={() => void mover(exercicio.id, 'cima')}
                className="min-h-toque min-w-toque text-texto-suave disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Mover ${exercicio.nome} para baixo`}
                disabled={indice === exercicios.length - 1}
                onClick={() => void mover(exercicio.id, 'baixo')}
                className="min-h-toque min-w-toque text-texto-suave disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              aria-label={`Remover ${exercicio.nome}`}
              onClick={() => void excluirExercicio(exercicio.id)}
              className="min-h-toque min-w-toque shrink-0 text-erro"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {adicionando ? (
        <form
          onSubmit={(evento) => void aoAdicionar(evento)}
          className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4"
        >
          <SeletorExercicio
            valor={{ exercicioDefinicaoId: formulario.exercicioDefinicaoId, nome: formulario.nome }}
            aoSelecionar={({ exercicioDefinicaoId, nome }) =>
              setFormulario({ ...formulario, exercicioDefinicaoId, nome })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
              Séries
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={formulario.series}
                onChange={(evento) =>
                  setFormulario({ ...formulario, series: Number(evento.target.value) })
                }
                className={CLASSE_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
              Descanso (s)
              <input
                type="number"
                inputMode="numeric"
                min={0}
                step={15}
                value={formulario.descansoSegundos}
                onChange={(evento) =>
                  setFormulario({ ...formulario, descansoSegundos: Number(evento.target.value) })
                }
                className={CLASSE_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
              Reps mín.
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={formulario.repeticoesMin}
                onChange={(evento) =>
                  setFormulario({ ...formulario, repeticoesMin: Number(evento.target.value) })
                }
                className={CLASSE_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
              Reps máx.
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={formulario.repeticoesMax}
                onChange={(evento) =>
                  setFormulario({ ...formulario, repeticoesMax: Number(evento.target.value) })
                }
                className={CLASSE_INPUT}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
            Carga de referência (kg) — opcional
            <input
              type="text"
              inputMode="decimal"
              placeholder="ex: 80"
              value={formulario.cargaReferenciaKg}
              onChange={(evento) =>
                setFormulario({ ...formulario, cargaReferenciaKg: evento.target.value })
              }
              className={CLASSE_INPUT}
            />
          </label>
          {erro !== null && (
            <p role="alert" className="text-sm font-medium text-erro">
              {erro}
            </p>
          )}
          <BotaoGrande type="submit" tamanho="medio">
            {exercicioEditandoId !== null ? 'Salvar exercício' : 'Adicionar exercício'}
          </BotaoGrande>
          <BotaoGrande
            type="button"
            variante="secundaria"
            tamanho="medio"
            onClick={aoCancelarExercicio}
          >
            Cancelar
          </BotaoGrande>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <BotaoGrande variante="secundaria" tamanho="medio" onClick={() => setAdicionando(true)}>
            Adicionar exercício
          </BotaoGrande>
          <BotaoGrande
            disabled={exercicios.length === 0}
            onClick={() => router.push(`/treinos/${ficha.id}/sessao`)}
          >
            Iniciar Treino
          </BotaoGrande>
          <button
            type="button"
            onClick={() => setConfirmandoExclusao(true)}
            className="min-h-toque text-sm font-medium text-erro"
          >
            Excluir ficha
          </button>
        </div>
      )}

      {mostrandoJustificativa && ficha.justificativaIA !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-justificativa-ia"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4"
        >
          <div className="flex max-h-[85vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-borda bg-superficie p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <h2
              id="titulo-justificativa-ia"
              className="font-titulo text-2xl font-bold uppercase tracking-tight text-texto"
            >
              Por que este treino
            </h2>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                Escolha do treino
              </span>
              <p className="text-sm text-texto">{ficha.justificativaIA.porqueDoTreino}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                Como evoluir
              </span>
              <p className="text-sm text-texto">{ficha.justificativaIA.comoEvoluir}</p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                Nível de assertividade
              </span>
              <p className="text-sm text-texto">{ficha.justificativaIA.nivelAssertividade}</p>
            </div>
            <BotaoGrande
              variante="secundaria"
              tamanho="medio"
              onClick={() => setMostrandoJustificativa(false)}
            >
              Fechar
            </BotaoGrande>
          </div>
        </div>
      )}

      <ModalConfirmacao
        aberto={confirmandoExclusao}
        titulo="Excluir ficha?"
        descricao={`A ficha "${ficha.nome}" será removida da sua lista. O histórico de treinos já realizados será mantido.`}
        rotuloConfirmar="Excluir ficha"
        perigo
        aoConfirmar={() => void aoDeletar()}
        aoCancelar={() => setConfirmandoExclusao(false)}
      />
    </div>
  );
}
