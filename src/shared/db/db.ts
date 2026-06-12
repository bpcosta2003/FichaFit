import Dexie, { type Table } from 'dexie';

import type { ExercicioDefinicao } from '@/modules/exercicios/domain/Exercicio';
import type { FichaTreino } from '@/modules/fichas/domain/FichaTreino';
import type { SessaoTreino } from '@/modules/sessao/domain/SessaoTreino';
import { aplicarMigrations } from './migrations';

// usuarioId usado antes do login. Ao autenticar, os registros locais
// são adotados pelo usuário real (ver syncEngine.adotarRegistrosLocais).
export const USUARIO_LOCAL = 'local';

export type EntidadeSync = 'ficha' | 'sessao' | 'exercicio';

export interface EntradaFilaSync {
  id?: number;
  entidade: EntidadeSync;
  registroId: string;
  tentativas: number;
  criadoEm: string;
}

export class FichaFitDB extends Dexie {
  fichasTreino!: Table<FichaTreino, string>;
  sessoesTreino!: Table<SessaoTreino, string>;
  exercicioDefinicoes!: Table<ExercicioDefinicao, string>;
  filaSync!: Table<EntradaFilaSync, number>;

  constructor() {
    super('fichafit');
    aplicarMigrations(this);
  }
}

export const db = new FichaFitDB();
