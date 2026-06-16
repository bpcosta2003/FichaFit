'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useFichas } from '@/modules/fichas/application/useFichas';
import { exerciciosOrdenados, type FichaTreino } from '@/modules/fichas/domain/FichaTreino';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { formatarDataRelativa } from '@/shared/utils/formatacao';

// Estimativa de duração derivada dos exercícios (~trabalho + descanso).
function estimarMinutos(ficha: FichaTreino): number {
  const segundos = ficha.exercicios.reduce(
    (total, ex) => total + ex.series * (40 + ex.descansoSegundos),
    0
  );
  return Math.max(5, Math.round(segundos / 60 / 5) * 5);
}

const DIA_SEMANA = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });

export function FichaListagem() {
  const router = useRouter();
  const { fichas, carregando, criarNovaFicha } = useFichas();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const aoCriar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    setErro(null);
    try {
      const ficha = await criarNovaFicha(nome);
      router.push(`/treinos/${ficha.id}`);
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível criar a ficha.');
    }
  };

  if (carregando) {
    return <p className="px-5 py-8 text-center text-texto-suave">Carregando suas fichas…</p>;
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-6">
      <header className="flex flex-col gap-1">
        <p className="font-titulo text-xs font-semibold uppercase tracking-[0.2em] text-fogo">
          {DIA_SEMANA.format(new Date())}
        </p>
        <h1 className="font-titulo text-5xl font-bold uppercase leading-[0.9] tracking-tight text-texto">
          Minhas
          <br />
          Fichas
        </h1>
      </header>

      {fichas.length === 0 && !criando && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-borda bg-superficie px-6 py-10 text-center">
          <p className="text-texto-suave">
            Você ainda não tem nenhuma ficha de treino. Crie a primeira para começar.
          </p>
          <BotaoGrande onClick={() => setCriando(true)}>Criar primeira ficha</BotaoGrande>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {fichas.map((ficha, indice) => {
          const exercicios = exerciciosOrdenados(ficha);
          const subtitulo =
            ficha.descricao ??
            exercicios
              .map((ex) => ex.nome)
              .slice(0, 2)
              .join(' · ');
          const podeIniciar = exercicios.length > 0;
          return (
            <li
              key={ficha.id}
              className={`flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-4 ${
                indice === 0 ? 'border-l-4 border-l-fogo' : ''
              }`}
            >
              <Link href={`/treinos/${ficha.id}`} className="flex min-h-toque flex-1 flex-col gap-1">
                <span className="font-titulo text-xl font-bold uppercase tracking-tight text-texto">
                  {ficha.nome}
                </span>
                {subtitulo !== '' && (
                  <span className="text-sm text-texto-suave">{subtitulo}</span>
                )}
                <span className="text-xs text-texto-suave">
                  {exercicios.length === 1 ? '1 exercício' : `${exercicios.length} exercícios`}
                  {podeIniciar && ` · ~${estimarMinutos(ficha)} min`}
                  {` · atualizada ${formatarDataRelativa(ficha.atualizadoEm)}`}
                </span>
              </Link>
              {podeIniciar ? (
                <Link
                  href={`/treinos/${ficha.id}/sessao`}
                  aria-label={`Iniciar ${ficha.nome}`}
                  className="gradiente-fogo flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-black shadow-fogo active:scale-95"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </Link>
              ) : (
                <Link
                  href={`/treinos/${ficha.id}`}
                  aria-label={`Editar ${ficha.nome}`}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-borda text-texto-suave active:bg-superficie-2"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {criando && (
        <form
          onSubmit={(evento) => void aoCriar(evento)}
          className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4"
        >
          <input
            autoFocus
            required
            placeholder="Nome da ficha (ex: Treino A — Peito e Tríceps)"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            className="min-h-toque rounded-xl border border-borda bg-superficie-2 px-4 text-base text-texto outline-none placeholder:text-texto-suave focus:border-fogo"
          />
          {erro !== null && (
            <p role="alert" className="text-sm font-medium text-erro">
              {erro}
            </p>
          )}
          <BotaoGrande type="submit">Criar ficha</BotaoGrande>
          <BotaoGrande type="button" variante="secundaria" onClick={() => setCriando(false)}>
            Cancelar
          </BotaoGrande>
        </form>
      )}

      {!criando && fichas.length > 0 && (
        <button
          type="button"
          aria-label="Nova ficha"
          onClick={() => setCriando(true)}
          className="gradiente-fogo fixed bottom-24 right-5 z-30 flex h-16 w-16 items-center justify-center rounded-full text-3xl font-bold text-black shadow-fogo active:scale-95"
        >
          +
        </button>
      )}
    </div>
  );
}
