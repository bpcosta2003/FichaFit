export interface Avatar {
  id: string;
  nome: string;
  seed: string;
  corFundo: string; // hex sem '#' — formato esperado pela DiceBear
}

export const AVATAR_PADRAO_ID = 'avatar_01';

// Conjunto pré-definido estilo Duolingo — sem foto de perfil.
export const AVATARES: readonly Avatar[] = [
  { id: 'avatar_01', nome: 'Urso', seed: 'urso', corFundo: '8B5CF6' },
  { id: 'avatar_02', nome: 'Leão', seed: 'leao', corFundo: 'F59E0B' },
  { id: 'avatar_03', nome: 'Tigre', seed: 'tigre', corFundo: 'EF4444' },
  { id: 'avatar_04', nome: 'Águia', seed: 'aguia', corFundo: '3B82F6' },
  { id: 'avatar_05', nome: 'Lobo', seed: 'lobo', corFundo: '6B7280' },
  { id: 'avatar_06', nome: 'Gorila', seed: 'gorila', corFundo: '22C55E' },
  { id: 'avatar_07', nome: 'Touro', seed: 'touro', corFundo: 'DC2626' },
  { id: 'avatar_08', nome: 'Pantera', seed: 'pantera', corFundo: '1F2937' },
  { id: 'avatar_09', nome: 'Raposa', seed: 'raposa', corFundo: 'F97316' },
  { id: 'avatar_10', nome: 'Tubarão', seed: 'tubarao', corFundo: '38BDF8' },
  { id: 'avatar_11', nome: 'Dragão', seed: 'dragao', corFundo: '7C3AED' },
  { id: 'avatar_12', nome: 'Robô', seed: 'robo', corFundo: '14B8A6' },
];

export function obterAvatar(avatarId: string): Avatar {
  const encontrado = AVATARES.find((avatar) => avatar.id === avatarId);
  const padrao = AVATARES[0];
  if (padrao === undefined) {
    throw new Error('Catálogo de avatares vazio.');
  }
  return encontrado ?? padrao;
}

// Gera URL determinística na DiceBear — elimina SVGs locais.
export function urlAvatar(avatar: Avatar): string {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(
    avatar.seed
  )}&backgroundColor=${avatar.corFundo}`;
}
