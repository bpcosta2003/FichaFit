'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import {
  atualizarPerfil,
  obterPerfil,
  type ObjetivoTreino,
  type SexoUsuario,
} from '@/modules/auth/infrastructure/supabaseAuth';
import { AvatarUsuario } from '@/shared/components/AvatarUsuario';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { SeletorTema } from '@/shared/components/SeletorTema';
import { useInstalarApp } from '@/shared/hooks/useInstalarApp';
import { useSync } from '@/shared/hooks/useSync';
import { AVATARES, AVATAR_PADRAO_ID } from '@/shared/types/avatares';
import { formatarDataRelativa } from '@/shared/utils/formatacao';

const CHAVE_AVATAR_LOCAL = 'fichafit:avatar';

const CLASSE_INPUT =
  'min-h-toque rounded-xl border border-borda bg-superficie-2 px-4 text-base text-texto outline-none placeholder:text-texto-suave focus:border-fogo';

const OPCOES_OBJETIVO: { valor: ObjetivoTreino; rotulo: string }[] = [
  { valor: 'hipertrofia', rotulo: 'Hipertrofia (ganho de massa)' },
  { valor: 'perda_peso', rotulo: 'Perda de peso' },
  { valor: 'manutencao', rotulo: 'Manutenção' },
  { valor: 'resistencia', rotulo: 'Resistência' },
];

const OPCOES_SEXO: { valor: SexoUsuario; rotulo: string }[] = [
  { valor: 'masculino', rotulo: 'Masculino' },
  { valor: 'feminino', rotulo: 'Feminino' },
  { valor: 'outro', rotulo: 'Outro' },
];

export function PerfilPage() {
  const { usuario, autenticado, carregando, sair } = useAuth();
  const { executarSync, sincronizando, erro: erroSync, ultimaSync, pendentes } = useSync();
  const { podeInstalar, jaInstalado, precisaInstrucaoIOS, instalar } = useInstalarApp();
  const [avatarId, setAvatarId] = useState(AVATAR_PADRAO_ID);
  const [objetivo, setObjetivo] = useState<ObjetivoTreino | ''>('');
  const [idade, setIdade] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [sexo, setSexo] = useState<SexoUsuario | ''>('');
  const [diasPorSemana, setDiasPorSemana] = useState('');
  const [salvandoTreino, setSalvandoTreino] = useState(false);
  const [erroTreino, setErroTreino] = useState<string | null>(null);
  const [salvoTreino, setSalvoTreino] = useState(false);

  // Avatar vive no aparelho (offline-first) e no perfil quando autenticado.
  useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE_AVATAR_LOCAL);
    if (salvo !== null) {
      setAvatarId(salvo);
    }
  }, []);

  useEffect(() => {
    if (usuario === null) {
      return;
    }
    obterPerfil(usuario.id)
      .then((perfil) => {
        if (perfil !== null) {
          setAvatarId(perfil.avatarId);
          window.localStorage.setItem(CHAVE_AVATAR_LOCAL, perfil.avatarId);
          setObjetivo(perfil.objetivo ?? '');
          setIdade(perfil.idade !== null ? String(perfil.idade) : '');
          setPesoKg(perfil.pesoKg !== null ? String(perfil.pesoKg) : '');
          setSexo(perfil.sexo ?? '');
          setDiasPorSemana(perfil.diasPorSemana !== null ? String(perfil.diasPorSemana) : '');
        }
      })
      .catch(() => undefined);
  }, [usuario]);

  const perfilTreinoCompleto =
    objetivo !== '' && idade !== '' && pesoKg !== '' && sexo !== '' && diasPorSemana !== '';

  const aoSalvarPerfilTreino = async (): Promise<void> => {
    if (usuario === null || !perfilTreinoCompleto) {
      return;
    }
    setErroTreino(null);
    setSalvandoTreino(true);
    setSalvoTreino(false);
    try {
      await atualizarPerfil(usuario.id, {
        objetivo: objetivo as ObjetivoTreino,
        idade: Number(idade),
        pesoKg: Number(pesoKg.replace(',', '.')),
        sexo: sexo as SexoUsuario,
        diasPorSemana: Number(diasPorSemana),
      });
      setSalvoTreino(true);
    } catch (causa) {
      setErroTreino(
        causa instanceof Error ? causa.message : 'Não foi possível salvar o perfil de treino.'
      );
    } finally {
      setSalvandoTreino(false);
    }
  };

  const aoEscolherAvatar = (novoId: string): void => {
    setAvatarId(novoId);
    window.localStorage.setItem(CHAVE_AVATAR_LOCAL, novoId);
    if (usuario !== null) {
      atualizarPerfil(usuario.id, { avatarId: novoId }).catch((causa) => {
        console.warn('[perfil] Falha ao salvar avatar no servidor:', causa);
      });
    }
  };

  if (carregando) {
    return <p className="px-5 py-8 text-center text-texto-suave">Carregando perfil…</p>;
  }

  return (
    <div className="flex flex-col gap-6 px-5 py-6">
      <h1 className="font-titulo text-5xl font-bold uppercase leading-tight tracking-tight text-texto">
        Perfil
      </h1>

      <div className="flex items-center gap-4 rounded-2xl border border-borda bg-superficie p-4">
        <AvatarUsuario avatarId={avatarId} tamanho="md" />
        <div className="flex min-w-0 flex-col">
          <span className="break-all font-titulo text-lg font-bold uppercase tracking-tight text-texto">
            {autenticado ? (usuario?.email ?? 'Atleta') : 'Atleta local'}
          </span>
          <span className="text-sm text-texto-suave">
            {autenticado
              ? 'Conta sincronizada'
              : 'Usando sem conta — dados só neste aparelho'}
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-titulo text-xs font-semibold uppercase tracking-widest text-texto-suave">
          Tema
        </h2>
        <SeletorTema />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-titulo text-xs font-semibold uppercase tracking-widest text-texto-suave">
          Escolha seu avatar
        </h2>
        <div className="grid grid-cols-5 gap-3">
          {AVATARES.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              aria-label={`Avatar ${avatar.nome}`}
              aria-pressed={avatar.id === avatarId}
              onClick={() => aoEscolherAvatar(avatar.id)}
              className={`flex min-h-toque min-w-toque items-center justify-center rounded-2xl border-2 p-0.5 ${
                avatar.id === avatarId ? 'border-fogo' : 'border-transparent'
              }`}
            >
              <AvatarUsuario avatarId={avatar.id} tamanho="sm" />
            </button>
          ))}
        </div>
      </section>

      {autenticado && (
        <section className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4">
          <h2 className="font-titulo text-sm font-semibold uppercase tracking-wide text-texto">
            Perfil de treino
          </h2>
          <p className="text-sm text-texto-suave">
            Usado pela assistente de IA para gerar fichas personalizadas para você.
          </p>
          <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
            Objetivo
            <select
              value={objetivo}
              onChange={(evento) => setObjetivo(evento.target.value as ObjetivoTreino | '')}
              className={CLASSE_INPUT}
            >
              <option value="">Selecione</option>
              {OPCOES_OBJETIVO.map((opcao) => (
                <option key={opcao.valor} value={opcao.valor}>
                  {opcao.rotulo}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
              Idade
              <input
                type="number"
                inputMode="numeric"
                min={10}
                max={100}
                value={idade}
                onChange={(evento) => setIdade(evento.target.value)}
                className={CLASSE_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
              Peso (kg)
              <input
                type="text"
                inputMode="decimal"
                placeholder="ex: 75"
                value={pesoKg}
                onChange={(evento) => setPesoKg(evento.target.value)}
                className={CLASSE_INPUT}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
              Sexo
              <select
                value={sexo}
                onChange={(evento) => setSexo(evento.target.value as SexoUsuario | '')}
                className={CLASSE_INPUT}
              >
                <option value="">Selecione</option>
                {OPCOES_SEXO.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-texto-suave">
              Dias por semana
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={7}
                value={diasPorSemana}
                onChange={(evento) => setDiasPorSemana(evento.target.value)}
                className={CLASSE_INPUT}
              />
            </label>
          </div>
          {erroTreino !== null && (
            <p role="alert" className="text-sm font-medium text-erro">
              {erroTreino}
            </p>
          )}
          {salvoTreino && erroTreino === null && (
            <p className="text-sm font-medium text-texto-suave">Perfil de treino salvo.</p>
          )}
          <BotaoGrande
            tamanho="medio"
            onClick={() => void aoSalvarPerfilTreino()}
            disabled={!perfilTreinoCompleto || salvandoTreino}
          >
            {salvandoTreino ? 'Salvando…' : 'Salvar perfil de treino'}
          </BotaoGrande>
        </section>
      )}

      {!jaInstalado && (
        <section className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4">
          <h2 className="font-titulo text-sm font-semibold uppercase tracking-wide text-texto">
            Instalar o app
          </h2>
          <p className="text-sm text-texto-suave">
            Instale o FichaFit no seu aparelho para abrir direto da tela inicial, em tela cheia e
            funcionando offline.
          </p>
          {precisaInstrucaoIOS ? (
            <p className="text-sm text-texto-suave">
              No iPhone/iPad: toque em{' '}
              <span className="font-semibold text-texto">Compartilhar</span> e depois em{' '}
              <span className="font-semibold text-texto">Adicionar à Tela de Início</span>.
            </p>
          ) : (
            <BotaoGrande tamanho="medio" onClick={() => void instalar()} disabled={!podeInstalar}>
              {podeInstalar ? 'Baixar o app' : 'Instalação indisponível neste navegador'}
            </BotaoGrande>
          )}
        </section>
      )}

      {jaInstalado && (
        <section className="flex flex-col gap-2 rounded-2xl border border-borda bg-superficie p-4">
          <h2 className="font-titulo text-sm font-semibold uppercase tracking-wide text-texto">
            Instalar o app
          </h2>
          <p className="text-sm text-texto-suave">O FichaFit já está instalado neste aparelho. ✅</p>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4">
        <h2 className="font-titulo text-sm font-semibold uppercase tracking-wide text-texto">
          Sincronização
        </h2>
        <p className="text-sm text-texto-suave">
          {pendentes === 0
            ? 'Tudo sincronizado.'
            : pendentes === 1
              ? '1 alteração aguardando envio.'
              : `${pendentes} alterações aguardando envio.`}
          {ultimaSync !== null && ` Última sincronização ${formatarDataRelativa(ultimaSync)}.`}
        </p>
        {erroSync !== null && (
          <p role="alert" className="text-sm font-medium text-erro">
            {erroSync}
          </p>
        )}
        {autenticado ? (
          <>
            <BotaoGrande tamanho="medio" onClick={() => void executarSync()} disabled={sincronizando}>
              {sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
            </BotaoGrande>
            <BotaoGrande variante="secundaria" tamanho="medio" onClick={() => void sair()}>
              Sair da conta
            </BotaoGrande>
          </>
        ) : (
          <Link href="/login" className="block">
            <BotaoGrande tamanho="medio">Entrar para sincronizar</BotaoGrande>
          </Link>
        )}
      </section>
    </div>
  );
}
