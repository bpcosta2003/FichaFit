// Camada de domínio — pura. Sem React, Dexie ou Supabase.
import { v4 as uuidv4 } from 'uuid';

export interface GrupoFicha {
  id: string;
  usuarioId: string;
  nome: string;
  criadoEm: string;
  atualizadoEm: string;
  deletadoEm: string | null;
}

export interface NovoGrupoFicha {
  nome: string;
  usuarioId: string;
}

function tocar(grupo: GrupoFicha, mudancas: Partial<GrupoFicha>): GrupoFicha {
  return { ...grupo, ...mudancas, atualizadoEm: new Date().toISOString() };
}

export function criarGrupoFicha(dados: NovoGrupoFicha): GrupoFicha {
  const nome = dados.nome.trim();
  if (nome.length === 0) {
    throw new Error('O nome do grupo é obrigatório.');
  }
  const agora = new Date().toISOString();
  return {
    id: uuidv4(),
    usuarioId: dados.usuarioId,
    nome,
    criadoEm: agora,
    atualizadoEm: agora,
    deletadoEm: null,
  };
}

export function renomearGrupoFicha(grupo: GrupoFicha, nome: string): GrupoFicha {
  const nomeLimpo = nome.trim();
  if (nomeLimpo.length === 0) {
    throw new Error('O nome do grupo é obrigatório.');
  }
  return tocar(grupo, { nome: nomeLimpo });
}

export function marcarGrupoFichaDeletado(grupo: GrupoFicha): GrupoFicha {
  return tocar(grupo, { deletadoEm: new Date().toISOString() });
}
