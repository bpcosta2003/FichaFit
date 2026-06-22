'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { Logo } from '@/shared/components/Logo';

type Estado = 'inicial' | 'enviando' | 'enviado';

export function TelaLogin() {
  const { entrarComEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [estado, setEstado] = useState<Estado>('inicial');
  const [erro, setErro] = useState<string | null>(null);

  const aoEnviar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    setErro(null);
    setEstado('enviando');
    try {
      await entrarComEmail(email.trim());
      setEstado('enviado');
    } catch (causa) {
      setEstado('inicial');
      setErro(
        causa instanceof Error ? causa.message : 'Não foi possível enviar o link. Tente novamente.'
      );
    }
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 bg-fundo px-6">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Logo tamanho="lg" />
        </div>
        <h1 className="font-titulo text-6xl font-bold uppercase tracking-tight text-fogo">
          FichaFit
        </h1>
        <p className="mt-2 text-texto-suave">
          Entre com seu email para sincronizar seus treinos entre aparelhos.
        </p>
      </div>

      {estado === 'enviado' ? (
        <div className="flex flex-col gap-4 text-center" role="status">
          <span aria-hidden="true" className="text-4xl">
            📬
          </span>
          <p className="font-titulo text-xl font-semibold uppercase tracking-tight text-texto">
            Link enviado!
          </p>
          <p className="text-texto-suave">
            Confira sua caixa de entrada e toque no link para entrar. Pode fechar esta tela.
          </p>
        </div>
      ) : (
        <form onSubmit={(evento) => void aoEnviar(evento)} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="font-titulo text-xs font-semibold uppercase tracking-widest text-texto-suave">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              className="min-h-toque rounded-xl border border-borda bg-superficie-2 px-4 text-base text-texto outline-none placeholder:text-texto-suave focus:border-fogo"
            />
          </label>
          {erro !== null && (
            <p role="alert" className="text-sm font-medium text-erro">
              {erro}
            </p>
          )}
          <BotaoGrande type="submit" tamanho="medio" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Enviando…' : 'Enviar link de acesso'}
          </BotaoGrande>
        </form>
      )}

      <p className="text-center text-sm text-texto-suave">
        Você pode usar o app sem conta — o login só é necessário para sincronizar.{' '}
        <Link href="/treinos" className="font-semibold text-fogo">
          Continuar sem entrar
        </Link>
      </p>
    </div>
  );
}
