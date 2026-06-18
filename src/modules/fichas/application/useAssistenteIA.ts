'use client';

import { useCallback, useState } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import { adicionarExercicio, atribuirGrupo, criarFicha, type FichaTreino } from '../domain/FichaTreino';
import { criarGrupoFicha } from '../domain/GrupoFicha';
import { salvarFicha } from '../infrastructure/fichaRepository';
import { salvarGrupoFicha } from '../infrastructure/grupoFichaRepository';

export interface ExercicioGeradoIA {
  nome: string;
  series: number;
  repeticoesMin: number;
  repeticoesMax: number;
  descansoSegundos: number;
  cargaReferenciaKg: number | null;
}

export interface FichaGeradaIA {
  nome: string;
  descricao: string | null;
  exercicios: ExercicioGeradoIA[];
}

export interface JustificativaIA {
  porqueDoTreino: string;
  comoEvoluir: string;
  nivelAssertividade: string;
}

const MENSAGENS_ERRO: Record<string, string> = {
  NAO_AUTENTICADO: 'Entre com seu email para usar a assistente de IA.',
  PERFIL_INCOMPLETO: 'Complete seu perfil de treino para gerar uma ficha com a IA.',
  RATE_LIMIT: 'Aguarde um minuto antes de gerar outra ficha com a IA.',
  IA_INDISPONIVEL: 'A assistente de IA está indisponível agora. Tente novamente em breve.',
  IA_RESPOSTA_INVALIDA: 'A IA não conseguiu gerar um treino válido. Tente novamente.',
  ERRO_CONSULTA: 'Não foi possível consultar seus dados agora. Tente novamente.',
  ERRO_INTERNO: 'Erro inesperado ao gerar o treino. Tente novamente.',
};

export interface EstadoAssistenteIA {
  gerando: boolean;
  erro: string | null;
  codigoErro: string | null;
  fichasGeradas: FichaGeradaIA[] | null;
  justificativa: JustificativaIA | null;
  gerar: () => Promise<void>;
  limpar: () => void;
  usarFichasGeradas: () => Promise<FichaTreino[]>;
}

export function useAssistenteIA(): EstadoAssistenteIA {
  const { usuarioId } = useAuth();
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [codigoErro, setCodigoErro] = useState<string | null>(null);
  const [fichasGeradas, setFichasGeradas] = useState<FichaGeradaIA[] | null>(null);
  const [justificativa, setJustificativa] = useState<JustificativaIA | null>(null);

  const gerar = useCallback(async () => {
    setGerando(true);
    setErro(null);
    setCodigoErro(null);
    setFichasGeradas(null);
    setJustificativa(null);
    try {
      const resposta = await fetch('/api/ia/gerar-treino', { method: 'POST' });
      const corpo = await resposta.json();
      if (!resposta.ok) {
        const codigo = typeof corpo.codigo === 'string' ? corpo.codigo : 'ERRO_INTERNO';
        setCodigoErro(codigo);
        setErro(MENSAGENS_ERRO[codigo] ?? 'Não foi possível gerar o treino. Tente novamente.');
        return;
      }
      setFichasGeradas(corpo.fichas as FichaGeradaIA[]);
      setJustificativa((corpo.justificativa as JustificativaIA | undefined) ?? null);
    } catch (causa) {
      console.warn('[ia] Falha ao chamar o endpoint de geração:', causa);
      setCodigoErro('ERRO_INTERNO');
      setErro('Não foi possível conectar à assistente de IA. Verifique sua conexão.');
    } finally {
      setGerando(false);
    }
  }, []);

  const limpar = useCallback(() => {
    setErro(null);
    setCodigoErro(null);
    setFichasGeradas(null);
    setJustificativa(null);
  }, []);

  const usarFichasGeradas = useCallback(async (): Promise<FichaTreino[]> => {
    if (fichasGeradas === null || fichasGeradas.length === 0) {
      throw new Error('Nenhum treino gerado para usar.');
    }

    let grupoId: string | null = null;
    if (fichasGeradas.length > 1) {
      const grupo = criarGrupoFicha({
        nome: `Treino da semana — ${new Date().toLocaleDateString('pt-BR')}`,
        usuarioId,
      });
      await salvarGrupoFicha(grupo);
      grupoId = grupo.id;
    }

    const fichasCriadas: FichaTreino[] = [];
    for (const fichaGerada of fichasGeradas) {
      let ficha = criarFicha({
        nome: fichaGerada.nome,
        usuarioId,
        descricao: fichaGerada.descricao ?? undefined,
      });
      if (grupoId !== null) {
        ficha = atribuirGrupo(ficha, grupoId);
      }
      for (const exercicio of fichaGerada.exercicios) {
        ficha = adicionarExercicio(ficha, exercicio);
      }
      await salvarFicha(ficha);
      fichasCriadas.push(ficha);
    }
    return fichasCriadas;
  }, [fichasGeradas, usuarioId]);

  return {
    gerando,
    erro,
    codigoErro,
    fichasGeradas,
    justificativa,
    gerar,
    limpar,
    usarFichasGeradas,
  };
}
