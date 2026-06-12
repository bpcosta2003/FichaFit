'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import { BotaoGrande } from '@/shared/components/BotaoGrande';

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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-primaria-600">FichaFit</h1>
        <p className="mt-2 text-gray-600">
          Entre com seu email para sincronizar seus treinos entre aparelhos.
        </p>
      </div>

      {estado === 'enviado' ? (
        <div className="flex flex-col gap-4 text-center" role="status">
          <span aria-hidden="true" className="text-4xl">
            📬
          </span>
          <p className="text-lg font-semibold text-gray-900">Link enviado!</p>
          <p className="text-gray-600">
            Confira sua caixa de entrada e toque no link para entrar. Pode fechar esta tela.
          </p>
        </div>
      ) : (
        <form onSubmit={(evento) => void aoEnviar(evento)} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
              className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
            />
          </label>
          {erro !== null && (
            <p role="alert" className="text-sm font-medium text-erro">
              {erro}
            </p>
          )}
          <BotaoGrande type="submit" disabled={estado === 'enviando'}>
            {estado === 'enviando' ? 'Enviando…' : 'Enviar link de acesso'}
          </BotaoGrande>
        </form>
      )}

      <p className="text-center text-sm text-gray-500">
        Você pode usar o app sem conta — o login só é necessário para sincronizar.{' '}
        <Link href="/treinos" className="font-semibold text-primaria-600">
          Continuar sem entrar
        </Link>
      </p>
    </div>
  );
}
