import type Dexie from 'dexie';

// Versionamento do schema Dexie. Nunca edite uma versão publicada —
// adicione uma nova versão com .upgrade() para migrar dados existentes.
export function aplicarMigrations(db: Dexie): void {
  db.version(1).stores({
    fichasTreino: 'id, usuarioId, atualizadoEm',
    sessoesTreino: 'id, clientId, usuarioId, fichaId, status, iniciadaEm',
    exercicioDefinicoes: 'id, wgerId, usuarioId, nome',
    filaSync: '++id, registroId, entidade, criadoEm',
  });
}
