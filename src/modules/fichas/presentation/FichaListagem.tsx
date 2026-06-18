'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

import { useFichas, useGruposFicha } from '@/modules/fichas/application/useFichas';
import { exerciciosOrdenados, type FichaTreino } from '@/modules/fichas/domain/FichaTreino';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { ModalConfirmacao } from '@/shared/components/ModalConfirmacao';
import { formatarDataRelativa } from '@/shared/utils/formatacao';

const SEM_GRUPO = 'sem-grupo';

// Estimativa de duração derivada dos exercícios (~trabalho + descanso).
function estimarMinutos(ficha: FichaTreino): number {
  const segundos = ficha.exercicios.reduce(
    (total, ex) => total + ex.series * (40 + ex.descansoSegundos),
    0
  );
  return Math.max(5, Math.round(segundos / 60 / 5) * 5);
}

const DIA_SEMANA = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });

interface CartaoFichaProps {
  ficha: FichaTreino;
  destaque: boolean;
  grupos: { id: string; nome: string }[];
  aoMoverParaGrupo: (grupoId: string | null) => void;
}

function CartaoFicha({ ficha, destaque, grupos, aoMoverParaGrupo }: CartaoFichaProps) {
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
      className={`flex flex-col gap-2 rounded-2xl border border-borda bg-superficie p-4 ${
        destaque ? 'border-l-4 border-l-fogo' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <Link href={`/treinos/${ficha.id}`} className="flex min-h-toque flex-1 flex-col gap-1">
          <span className="font-titulo text-xl font-bold uppercase tracking-tight text-texto">
            {ficha.nome}
          </span>
          {subtitulo !== '' && <span className="text-sm text-texto-suave">{subtitulo}</span>}
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
      </div>
      {grupos.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-texto-suave">
          Grupo
          <select
            aria-label={`Grupo da ficha ${ficha.nome}`}
            value={ficha.grupoId ?? SEM_GRUPO}
            onChange={(evento) =>
              aoMoverParaGrupo(evento.target.value === SEM_GRUPO ? null : evento.target.value)
            }
            className="min-h-toque flex-1 rounded-lg border border-borda bg-superficie-2 px-2 text-sm text-texto outline-none focus:border-fogo"
          >
            <option value={SEM_GRUPO}>Sem grupo</option>
            {grupos.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
              </option>
            ))}
          </select>
        </label>
      )}
    </li>
  );
}

export function FichaListagem() {
  const router = useRouter();
  const { fichas, carregando, criarNovaFicha, moverFichaParaGrupo } = useFichas();
  const { grupos, carregando: carregandoGrupos, criarGrupo, excluirGrupo } = useGruposFicha();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [criandoGrupo, setCriandoGrupo] = useState(false);
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [erroGrupo, setErroGrupo] = useState<string | null>(null);
  const [grupoExcluindo, setGrupoExcluindo] = useState<{ id: string; nome: string } | null>(null);

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

  const aoCriarGrupo = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    setErroGrupo(null);
    try {
      await criarGrupo(nomeGrupo);
      setNomeGrupo('');
      setCriandoGrupo(false);
    } catch (causa) {
      setErroGrupo(causa instanceof Error ? causa.message : 'Não foi possível criar o grupo.');
    }
  };

  const idsGruposValidos = useMemo(() => new Set(grupos.map((grupo) => grupo.id)), [grupos]);

  const secoes = useMemo(() => {
    const porGrupo = new Map<string, FichaTreino[]>();
    const semGrupo: FichaTreino[] = [];
    for (const ficha of fichas) {
      if (ficha.grupoId !== null && idsGruposValidos.has(ficha.grupoId)) {
        const lista = porGrupo.get(ficha.grupoId) ?? [];
        lista.push(ficha);
        porGrupo.set(ficha.grupoId, lista);
      } else {
        semGrupo.push(ficha);
      }
    }
    const comGrupo = grupos
      .map((grupo) => ({ grupo, fichas: porGrupo.get(grupo.id) ?? [] }))
      .filter((secao) => secao.fichas.length > 0);
    return { comGrupo, semGrupo };
  }, [fichas, grupos, idsGruposValidos]);

  if (carregando || carregandoGrupos) {
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

      {secoes.comGrupo.map(({ grupo, fichas: fichasDoGrupo }) => (
        <section key={grupo.id} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-titulo text-sm font-semibold uppercase tracking-[0.15em] text-texto-suave">
              {grupo.nome}
            </h2>
            <button
              type="button"
              aria-label={`Excluir grupo ${grupo.nome}`}
              onClick={() => setGrupoExcluindo({ id: grupo.id, nome: grupo.nome })}
              className="min-h-toque min-w-toque text-sm text-texto-suave"
            >
              ✕
            </button>
          </div>
          <ul className="flex flex-col gap-3">
            {fichasDoGrupo.map((ficha) => (
              <CartaoFicha
                key={ficha.id}
                ficha={ficha}
                destaque={false}
                grupos={grupos}
                aoMoverParaGrupo={(grupoId) => void moverFichaParaGrupo(ficha.id, grupoId)}
              />
            ))}
          </ul>
        </section>
      ))}

      {secoes.semGrupo.length > 0 && (
        <section className="flex flex-col gap-3">
          {secoes.comGrupo.length > 0 && (
            <h2 className="font-titulo text-sm font-semibold uppercase tracking-[0.15em] text-texto-suave">
              Sem grupo
            </h2>
          )}
          <ul className="flex flex-col gap-3">
            {secoes.semGrupo.map((ficha, indice) => (
              <CartaoFicha
                key={ficha.id}
                ficha={ficha}
                destaque={secoes.comGrupo.length === 0 && indice === 0}
                grupos={grupos}
                aoMoverParaGrupo={(grupoId) => void moverFichaParaGrupo(ficha.id, grupoId)}
              />
            ))}
          </ul>
        </section>
      )}

      {criandoGrupo ? (
        <form
          onSubmit={(evento) => void aoCriarGrupo(evento)}
          className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4"
        >
          <input
            autoFocus
            required
            placeholder="Nome do grupo (ex: PPL)"
            value={nomeGrupo}
            onChange={(evento) => setNomeGrupo(evento.target.value)}
            className="min-h-toque rounded-xl border border-borda bg-superficie-2 px-4 text-base text-texto outline-none placeholder:text-texto-suave focus:border-fogo"
          />
          {erroGrupo !== null && (
            <p role="alert" className="text-sm font-medium text-erro">
              {erroGrupo}
            </p>
          )}
          <BotaoGrande type="submit">Criar grupo</BotaoGrande>
          <BotaoGrande type="button" variante="secundaria" onClick={() => setCriandoGrupo(false)}>
            Cancelar
          </BotaoGrande>
        </form>
      ) : (
        fichas.length > 0 && (
          <button
            type="button"
            onClick={() => setCriandoGrupo(true)}
            className="min-h-toque text-sm font-medium text-fogo"
          >
            + Criar grupo de fichas
          </button>
        )
      )}

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

      <ModalConfirmacao
        aberto={grupoExcluindo !== null}
        titulo="Excluir grupo?"
        descricao={`O grupo "${grupoExcluindo?.nome ?? ''}" será removido. As fichas vinculadas continuam existindo e passam a ficar sem grupo.`}
        rotuloConfirmar="Excluir grupo"
        perigo
        aoConfirmar={() => {
          if (grupoExcluindo !== null) {
            void excluirGrupo(grupoExcluindo.id);
          }
          setGrupoExcluindo(null);
        }}
        aoCancelar={() => setGrupoExcluindo(null)}
      />
    </div>
  );
}
