'use client';

import Image from 'next/image';
import { useMemo, useState, type FormEvent } from 'react';

import { useExercicios } from '@/modules/exercicios/application/useExercicios';
import type { ExercicioDefinicao } from '@/modules/exercicios/domain/Exercicio';
import { BotaoGrande } from '@/shared/components/BotaoGrande';

const TODOS = 'Todos';

const CLASSE_INPUT =
  'min-h-toque rounded-xl border border-borda bg-superficie-2 px-4 text-base text-texto outline-none placeholder:text-texto-suave focus:border-fogo';

export function BibliotecaExercicios() {
  const { exercicios, carregando, erro, importando, buscar, criarCustom, importarCatalogoWger } =
    useExercicios();
  const [termo, setTermo] = useState('');
  const [grupo, setGrupo] = useState(TODOS);
  const [adicionando, setAdicionando] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [grupoNovo, setGrupoNovo] = useState('');
  const [detalhe, setDetalhe] = useState<ExercicioDefinicao | null>(null);

  // Grupos musculares distintos presentes no catálogo — viram chips de filtro.
  const grupos = useMemo(() => {
    const distintos = new Set<string>();
    for (const ex of exercicios) {
      if (ex.grupoMuscular) {
        distintos.add(ex.grupoMuscular);
      }
    }
    return [TODOS, ...Array.from(distintos).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [exercicios]);

  const aoCriar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    try {
      await criarCustom(nomeNovo, grupoNovo || undefined);
      setNomeNovo('');
      setGrupoNovo('');
      setAdicionando(false);
    } catch {
      // mensagem de erro já exposta pelo hook
    }
  };

  if (carregando) {
    return <p className="px-5 py-8 text-center text-texto-suave">Carregando exercícios…</p>;
  }

  const filtrados = buscar(termo).filter(
    (ex) => grupo === TODOS || ex.grupoMuscular === grupo
  );

  return (
    <div className="flex flex-col gap-4 px-5 py-6">
      <h1 className="font-titulo text-5xl font-bold uppercase leading-tight tracking-tight text-texto">
        Exercícios
      </h1>

      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-texto-suave"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4-4" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          placeholder="Buscar exercício…"
          value={termo}
          onChange={(evento) => setTermo(evento.target.value)}
          className={`${CLASSE_INPUT} w-full pl-11`}
        />
      </div>

      {grupos.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {grupos.map((g) => {
            const ativo = g === grupo;
            return (
              <button
                key={g}
                type="button"
                aria-pressed={ativo}
                onClick={() => setGrupo(g)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  ativo
                    ? 'gradiente-fogo text-sobre-fogo'
                    : 'border border-borda bg-superficie text-texto-suave active:bg-superficie-2'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      )}

      {erro !== null && (
        <p role="alert" className="text-sm font-medium text-erro">
          {erro}
        </p>
      )}

      {exercicios.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-borda bg-superficie px-6 py-10 text-center">
          <p className="text-texto-suave">
            A biblioteca está vazia. Baixe o catálogo de exercícios ou crie o seu próprio.
          </p>
          <BotaoGrande onClick={() => void importarCatalogoWger()} disabled={importando}>
            {importando ? 'Baixando catálogo…' : 'Baixar catálogo'}
          </BotaoGrande>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => void importarCatalogoWger(true)}
            disabled={importando}
            className="min-h-toque self-start text-sm font-medium text-fogo disabled:opacity-50"
          >
            {importando ? 'Atualizando catálogo…' : 'Atualizar catálogo'}
          </button>
          {filtrados.length === 0 ? (
            <p className="rounded-2xl border border-borda bg-superficie px-6 py-8 text-center text-texto-suave">
              Nenhum exercício encontrado. Tente outro nome ou crie um exercício novo.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {filtrados.map((exercicio) => (
                <li key={exercicio.id}>
                  <button
                    type="button"
                    onClick={() => setDetalhe(exercicio)}
                    className="flex min-h-toque w-full items-center gap-3 rounded-xl border border-borda bg-superficie px-4 py-3 text-left active:bg-superficie-2"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-superficie-2 text-fogo">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        className="h-5 w-5"
                        aria-hidden="true"
                      >
                        <path d="M6.5 8v8M17.5 8v8M4 10h2.5M17.5 10H20M4 14h2.5M17.5 14H20M6.5 12h11" />
                      </svg>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="break-words font-titulo font-semibold uppercase tracking-tight text-texto">
                        {exercicio.nome}
                      </span>
                      <span className="text-sm text-texto-suave">
                        {exercicio.grupoMuscular ?? 'Grupo não informado'}
                        {exercicio.isCustom && ' · criado por você'}
                      </span>
                    </div>
                    <span aria-hidden="true" className="text-texto-suave">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {adicionando ? (
        <form
          onSubmit={(evento) => void aoCriar(evento)}
          className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4"
        >
          <input
            autoFocus
            required
            placeholder="Nome do exercício"
            value={nomeNovo}
            onChange={(evento) => setNomeNovo(evento.target.value)}
            className={CLASSE_INPUT}
          />
          <input
            placeholder="Grupo muscular (opcional)"
            value={grupoNovo}
            onChange={(evento) => setGrupoNovo(evento.target.value)}
            className={CLASSE_INPUT}
          />
          <BotaoGrande type="submit" tamanho="medio">
            Salvar exercício
          </BotaoGrande>
          <BotaoGrande
            type="button"
            variante="secundaria"
            tamanho="medio"
            onClick={() => setAdicionando(false)}
          >
            Cancelar
          </BotaoGrande>
        </form>
      ) : (
        <button
          type="button"
          aria-label="Criar exercício próprio"
          onClick={() => setAdicionando(true)}
          className="gradiente-fogo fixed bottom-24 right-5 z-30 flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold text-sobre-fogo shadow-fogo active:scale-95"
        >
          +
        </button>
      )}

      {detalhe !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-detalhe-exercicio"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-borda bg-superficie p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <h2
              id="titulo-detalhe-exercicio"
              className="break-words font-titulo text-2xl font-bold uppercase tracking-tight text-texto"
            >
              {detalhe.nome}
            </h2>
            <p className="mt-1 text-sm font-medium uppercase tracking-wide text-fogo">
              {detalhe.grupoMuscular ?? 'Grupo não informado'}
            </p>
            {detalhe.imagemUrl !== null && (
              <div className="relative mt-4 h-48 w-full overflow-hidden rounded-xl bg-superficie-2">
                <Image
                  src={detalhe.imagemUrl}
                  alt={`Demonstração do exercício ${detalhe.nome}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 448px) 100vw, 448px"
                />
              </div>
            )}
            <p className="mt-4 text-texto-suave">
              {detalhe.descricao ?? 'Sem descrição disponível para este exercício.'}
            </p>
            <div className="mt-6">
              <BotaoGrande variante="secundaria" onClick={() => setDetalhe(null)}>
                Fechar
              </BotaoGrande>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
