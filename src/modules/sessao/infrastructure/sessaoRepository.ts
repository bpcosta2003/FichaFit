// Persistência local (Dexie). Escrita imediata — nunca bloqueia a UI.
import { z } from 'zod';

import { db } from '@/shared/db/db';
import { enfileirar } from '@/shared/sync/syncQueue';
import type { SessaoTreino } from '../domain/SessaoTreino';

const esquemaExercicioSessao = z.object({
  exercicioFichaId: z.string(),
  nome: z.string(),
  ordem: z.number().int(),
  seriesPlanejadas: z.number().int().min(1),
  repeticoesMin: z.number().int().min(1),
  repeticoesMax: z.number().int().min(1),
  cargaReferenciaKg: z.number().nullable(),
  descansoSegundos: z.number().int().min(0),
});

const esquemaSerie = z.object({
  id: z.string(),
  exercicioFichaId: z.string(),
  nomeExercicio: z.string(),
  numeroSerie: z.number().int().min(1),
  repeticoes: z.number().int().min(1),
  pesoKg: z.number().min(0),
  realizadaEm: z.string(),
});

const esquemaSessao = z.object({
  id: z.string(),
  clientId: z.string(),
  usuarioId: z.string(),
  fichaId: z.string(),
  nomeFicha: z.string(),
  exercicios: z.array(esquemaExercicioSessao),
  series: z.array(esquemaSerie),
  status: z.enum(['em_andamento', 'concluida', 'cancelada']),
  iniciadaEm: z.string(),
  concluidaEm: z.string().nullable(),
  atualizadoEm: z.string(),
  deletadoEm: z.string().nullable(),
});

function validarSessao(bruto: unknown): SessaoTreino | null {
  const resultado = esquemaSessao.safeParse(bruto);
  if (!resultado.success) {
    console.warn('[sessao] Registro local inválido ignorado:', resultado.error.message);
    return null;
  }
  return resultado.data;
}

export async function salvarSessao(sessao: SessaoTreino): Promise<void> {
  await db.sessoesTreino.put(sessao);
  // Push acontece ao concluir a sessão — sessões em andamento ficam só locais.
  if (sessao.status !== 'em_andamento') {
    await enfileirar('sessao', sessao.id);
  }
}

export async function obterSessao(id: string, usuarioId: string): Promise<SessaoTreino | null> {
  const bruto = await db.sessoesTreino.get(id);
  if (bruto === undefined) {
    return null;
  }
  const sessao = validarSessao(bruto);
  if (sessao === null || sessao.usuarioId !== usuarioId || sessao.deletadoEm !== null) {
    return null;
  }
  return sessao;
}

export async function obterSessaoEmAndamento(
  fichaId: string,
  usuarioId: string
): Promise<SessaoTreino | null> {
  const brutos = await db.sessoesTreino
    .where('fichaId')
    .equals(fichaId)
    .and((sessao) => sessao.usuarioId === usuarioId && sessao.status === 'em_andamento')
    .toArray();
  const validas = brutos
    .map(validarSessao)
    .filter((sessao): sessao is SessaoTreino => sessao !== null && sessao.deletadoEm === null);
  return validas[validas.length - 1] ?? null;
}

export async function listarSessoesConcluidas(usuarioId: string): Promise<SessaoTreino[]> {
  const brutos = await db.sessoesTreino.where('usuarioId').equals(usuarioId).toArray();
  return brutos
    .map(validarSessao)
    .filter(
      (sessao): sessao is SessaoTreino =>
        sessao !== null && sessao.deletadoEm === null && sessao.status === 'concluida'
    )
    .sort((a, b) => b.iniciadaEm.localeCompare(a.iniciadaEm));
}
