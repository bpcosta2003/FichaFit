'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useFicha } from '@/modules/fichas/application/useFichas';
import { exerciciosOrdenados } from '@/modules/fichas/domain/FichaTreino';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { ModalConfirmacao } from '@/shared/components/ModalConfirmacao';
import { formatarPesoKg } from '@/shared/utils/formatacao';

interface PropsFichaDetalhe {
  fichaId: string;
}

interface FormularioExercicio {
  nome: string;
  series: number;
  repeticoesMin: number;
  repeticoesMax: number;
  cargaReferenciaKg: string;
  descansoSegundos: number;
}

const FORMULARIO_VAZIO: FormularioExercicio = {
  nome: '',
  series: 3,
  repeticoesMin: 8,
  repeticoesMax: 12,
  cargaReferenciaKg: '',
  descansoSegundos: 90,
};

export function FichaDetalhe({ fichaId }: PropsFichaDetalhe) {
  const router = useRouter();
  const { ficha, carregando, incluirExercicio, excluirExercicio, mover, deletarFicha } =
    useFicha(fichaId);
  const [adicionando, setAdicionando] = useState(false);
  const [formulario, setFormulario] = useState<FormularioExercicio>(FORMULARIO_VAZIO);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  if (carregando) {
    return <p className="px-4 py-8 text-center text-gray-500">Carregando ficha…</p>;
  }

  if (ficha === null) {
    return (
      <div className="flex flex-col gap-4 px-4 py-8 text-center">
        <p className="text-gray-600">Ficha não encontrada.</p>
        <BotaoGrande variante="secundaria" onClick={() => router.push('/treinos')}>
          Voltar para as fichas
        </BotaoGrande>
      </div>
    );
  }

  const exercicios = exerciciosOrdenados(ficha);

  const aoAdicionar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    setErro(null);
    try {
      const carga = formulario.cargaReferenciaKg.trim();
      await incluirExercicio({
        nome: formulario.nome,
        series: formulario.series,
        repeticoesMin: formulario.repeticoesMin,
        repeticoesMax: formulario.repeticoesMax,
        cargaReferenciaKg: carga === '' ? null : Number(carga.replace(',', '.')),
        descansoSegundos: formulario.descansoSegundos,
      });
      setFormulario(FORMULARIO_VAZIO);
      setAdicionando(false);
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível adicionar o exercício.');
    }
  };

  const aoDeletar = async (): Promise<void> => {
    await deletarFicha();
    router.replace('/treinos');
  };

  return (
    <div className="flex flex-col gap-5 px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">{ficha.nome}</h1>

      {exercicios.length === 0 && !adicionando && (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-gray-50 px-6 py-8 text-center">
          <p className="text-gray-600">
            Esta ficha ainda não tem exercícios. Adicione o primeiro para poder treinar.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {exercicios.map((exercicio, indice) => (
          <li
            key={exercicio.id}
            className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4"
          >
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-semibold text-gray-900">{exercicio.nome}</span>
              <span className="text-sm text-gray-500">
                {exercicio.series} séries · {exercicio.repeticoesMin}–{exercicio.repeticoesMax}{' '}
                reps
                {exercicio.cargaReferenciaKg !== null &&
                  ` · ${formatarPesoKg(exercicio.cargaReferenciaKg)}`}{' '}
                · {exercicio.descansoSegundos}s descanso
              </span>
            </div>
            <div className="flex flex-col">
              <button
                type="button"
                aria-label={`Mover ${exercicio.nome} para cima`}
                disabled={indice === 0}
                onClick={() => void mover(exercicio.id, 'cima')}
                className="min-h-toque min-w-toque text-gray-400 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Mover ${exercicio.nome} para baixo`}
                disabled={indice === exercicios.length - 1}
                onClick={() => void mover(exercicio.id, 'baixo')}
                className="min-h-toque min-w-toque text-gray-400 disabled:opacity-30"
              >
                ↓
              </button>
            </div>
            <button
              type="button"
              aria-label={`Remover ${exercicio.nome}`}
              onClick={() => void excluirExercicio(exercicio.id)}
              className="min-h-toque min-w-toque text-erro"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {adicionando ? (
        <form onSubmit={(evento) => void aoAdicionar(evento)} className="flex flex-col gap-3">
          <input
            autoFocus
            required
            placeholder="Nome do exercício (ex: Supino Reto)"
            value={formulario.nome}
            onChange={(evento) => setFormulario({ ...formulario, nome: evento.target.value })}
            className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
              Séries
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={formulario.series}
                onChange={(evento) =>
                  setFormulario({ ...formulario, series: Number(evento.target.value) })
                }
                className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
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
                className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
              Reps mín.
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={formulario.repeticoesMin}
                onChange={(evento) =>
                  setFormulario({ ...formulario, repeticoesMin: Number(evento.target.value) })
                }
                className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
              Reps máx.
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={formulario.repeticoesMax}
                onChange={(evento) =>
                  setFormulario({ ...formulario, repeticoesMax: Number(evento.target.value) })
                }
                className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-600">
            Carga de referência (kg) — opcional
            <input
              type="text"
              inputMode="decimal"
              placeholder="ex: 80"
              value={formulario.cargaReferenciaKg}
              onChange={(evento) =>
                setFormulario({ ...formulario, cargaReferenciaKg: evento.target.value })
              }
              className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
            />
          </label>
          {erro !== null && (
            <p role="alert" className="text-sm font-medium text-erro">
              {erro}
            </p>
          )}
          <BotaoGrande type="submit">Adicionar exercício</BotaoGrande>
          <BotaoGrande type="button" variante="secundaria" onClick={() => setAdicionando(false)}>
            Cancelar
          </BotaoGrande>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <BotaoGrande variante="secundaria" onClick={() => setAdicionando(true)}>
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
