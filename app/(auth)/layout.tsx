'use client';

import { usePathname } from 'next/navigation';

import { BannerOffline } from '@/shared/components/BannerOffline';
import { NavInferior } from '@/shared/components/NavInferior';

export default function LayoutComNavegacao({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const emSessao = pathname.includes('/sessao');
  return (
    <div className={`mx-auto min-h-dvh max-w-md ${emSessao ? '' : 'pb-24'}`}>
      <BannerOffline />
      {children}
      <NavInferior />
    </div>
  );
}
