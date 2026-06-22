'use client';

import { obterAvatar, urlAvatar } from '@/shared/types/avatares';

type Tamanho = 'sm' | 'md' | 'lg';

interface PropsAvatarUsuario {
  avatarId: string;
  tamanho?: Tamanho;
}

const dimensoes: Record<Tamanho, string> = {
  sm: 'h-10 w-10',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

// Avatar pré-definido estilo Duolingo — gerado via DiceBear (determinístico).
export function AvatarUsuario({ avatarId, tamanho = 'md' }: PropsAvatarUsuario) {
  const avatar = obterAvatar(avatarId);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG externo da DiceBear; next/image exigiria dangerouslyAllowSVG
    <img
      src={urlAvatar(avatar)}
      alt={`Avatar ${avatar.nome}`}
      className={`${dimensoes[tamanho]} shrink-0 rounded-full bg-superficie-2 object-cover`}
    />
  );
}
