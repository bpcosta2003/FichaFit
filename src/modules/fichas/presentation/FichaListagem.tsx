'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { useFichas } from '@/modules/fichas/application/useFichas';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { formatarDataRelativa } from '@/shared/utils/formatacao';

export function FichaListagem() {
  const router = useRouter();
  const { fichas, carregando, criarNovaFicha } = useFichas();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const aoCriar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    setErro(null);
    try {
      const ficha = await criarNovaFicha(nome);
      router.push(`/treinos/${ficha.id}`);
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível criar a ficha.');
    }
  };

  if (carregando) {
    return <p className="px-4 py-8 text-center text-gray-500">Carregando suas fichas…</p>;
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Minhas Fichas</h1>

      {fichas.length === 0 && !criando && (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 px-6 py-10 text-center">
          <span aria-hidden="true" className="text-4xl">
            🏋️
          </span>
          <p className="text-gray-600">
            Você ainda não tem nenhuma ficha de treino. Crie a primeira para começar.
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {fichas.map((ficha) => (
          <li key={ficha.id}>
            <Link
              href={`/treinos/${ficha.id}`}
              className="flex min-h-toque flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50"
            >
              <span className="text-lg font-semibold text-gray-900">{ficha.nome}</span>
              <span className="text-sm text-gray-500">
                {ficha.exercicios.length === 1
                  ? '1 exercício'
                  : `${ficha.exercicios.length} exercícios`}{' '}
                · atualizada {formatarDataRelativa(ficha.atualizadoEm)}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {criando ? (
        <form onSubmit={(evento) => void aoCriar(evento)} className="flex flex-col gap-3">
          <input
            autoFocus
            required
            placeholder="Nome da ficha (ex: Treino A — Peito e Tríceps)"
            value={nome}
            onChange={(evento) => setNome(evento.target.value)}
            className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
          />
          {erro !== null && (
            <p role="alert" className="text-sm font-medium text-erro">
              {erro}
            </p>
          )}
          <BotaoGrande type="submit">Criar ficha</BotaoGrande>
          <BotaoGrande type="button" variante="secundaria" onClick={() => setCriando(false)}>
            Cancelar
          </BotaoGrande>
        </form>
      ) : (
        <BotaoGrande onClick={() => setCriando(true)}>Nova Ficha</BotaoGrande>
      )}
    </div>
  );
}
