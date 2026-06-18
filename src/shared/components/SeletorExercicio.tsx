'use client';

import { useState } from 'react';

import { useExercicios } from '@/modules/exercicios/application/useExercicios';

export interface ExercicioSelecionado {
  exercicioDefinicaoId: string | null;
  nome: string;
}

interface PropsSeletorExercicio {
  valor: ExercicioSelecionado;
  aoSelecionar: (selecionado: ExercicioSelecionado) => void;
}

const CLASSE_INPUT =
  'min-h-toque rounded-xl border border-borda bg-superficie-2 px-4 text-base text-texto outline-none placeholder:text-texto-suave focus:border-fogo';

const LIMITE_RESULTADOS = 8;

export function SeletorExercicio({ valor, aoSelecionar }: PropsSeletorExercicio) {
  const { buscar, criarCustom } = useExercicios();
  const [termo, setTermo] = useState(valor.nome);
  const [aberto, setAberto] = useState(false);
  const [criando, setCriando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const resultados = termo.trim().length > 0 ? buscar(termo).slice(0, LIMITE_RESULTADOS) : [];
  const existeCorrespondenciaExata = resultados.some(
    (exercicio) => exercicio.nome.toLocaleLowerCase('pt-BR') === termo.trim().toLocaleLowerCase('pt-BR')
  );

  const aoEscolher = (exercicioDefinicaoId: string | null, nome: string): void => {
    setTermo(nome);
    setAberto(false);
    aoSelecionar({ exercicioDefinicaoId, nome });
  };

  const aoCriarNovo = async (): Promise<void> => {
    const nome = termo.trim();
    if (nome.length === 0) {
      return;
    }
    setErro(null);
    setCriando(true);
    try {
      const exercicio = await criarCustom(nome);
      aoEscolher(exercicio.id, exercicio.nome);
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível criar o exercício.');
    } finally {
      setCriando(false);
    }
  };

  return (
    <div className="relative flex flex-col gap-1">
      <input
        required
        placeholder="Nome do exercício (ex: Supino Reto)"
        value={termo}
        onChange={(evento) => {
          setTermo(evento.target.value);
          setAberto(true);
          aoSelecionar({ exercicioDefinicaoId: null, nome: evento.target.value });
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        className={CLASSE_INPUT}
      />
      {erro !== null && (
        <p role="alert" className="text-sm font-medium text-erro">
          {erro}
        </p>
      )}
      {aberto && termo.trim().length > 0 && (
        <ul className="absolute top-full z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-borda bg-superficie-2 shadow-lg">
          {resultados.map((exercicio) => (
            <li key={exercicio.id}>
              <button
                type="button"
                onClick={() => aoEscolher(exercicio.id, exercicio.nome)}
                className="flex min-h-toque w-full flex-col items-start gap-0.5 px-4 py-2 text-left text-texto active:bg-superficie"
              >
                <span className="font-medium">{exercicio.nome}</span>
                <span className="text-xs text-texto-suave">
                  {exercicio.grupoMuscular ?? 'Grupo não informado'}
                  {exercicio.isCustom && ' · criado por você'}
                </span>
              </button>
            </li>
          ))}
          {!existeCorrespondenciaExata && (
            <li>
              <button
                type="button"
                disabled={criando}
                onClick={() => void aoCriarNovo()}
                className="flex min-h-toque w-full items-center gap-2 px-4 py-2 text-left font-medium text-fogo active:bg-superficie disabled:opacity-50"
              >
                {criando ? 'Criando…' : `Criar exercício "${termo.trim()}"`}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
