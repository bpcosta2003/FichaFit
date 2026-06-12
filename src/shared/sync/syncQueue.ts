// Fila de mutations offline — persistente no Dexie (tabela filaSync).
// Sobrevive a refresh e fechamento do app.
import { db, type EntidadeSync, type EntradaFilaSync } from '@/shared/db/db';

export const MAX_TENTATIVAS = 5;

export async function enfileirar(entidade: EntidadeSync, registroId: string): Promise<void> {
  const existente = await db.filaSync.where('registroId').equals(registroId).first();
  if (existente !== undefined) {
    return; // já há uma entrada pendente para este registro
  }
  await db.filaSync.add({
    entidade,
    registroId,
    tentativas: 0,
    criadoEm: new Date().toISOString(),
  });
}

export async function listarPendentes(): Promise<EntradaFilaSync[]> {
  return db.filaSync.orderBy('criadoEm').toArray();
}

export async function removerEntrada(id: number): Promise<void> {
  await db.filaSync.delete(id);
}

export async function registrarFalha(entrada: EntradaFilaSync): Promise<void> {
  if (entrada.id === undefined) {
    return;
  }
  const tentativas = entrada.tentativas + 1;
  if (tentativas >= MAX_TENTATIVAS) {
    console.warn(
      `[sync] Entrada da fila descartada após ${tentativas} tentativas:`,
      entrada.entidade,
      entrada.registroId
    );
    await db.filaSync.delete(entrada.id);
    return;
  }
  await db.filaSync.update(entrada.id, { tentativas });
}

export async function contarPendentes(): Promise<number> {
  return db.filaSync.count();
}
