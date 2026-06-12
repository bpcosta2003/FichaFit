'use client';

import { useState, type FormEvent } from 'react';

import { useExercicios } from '@/modules/exercicios/application/useExercicios';
import { BotaoGrande } from '@/shared/components/BotaoGrande';

export function BibliotecaExercicios() {
  const { exercicios, carregando, erro, importando, buscar, criarCustom, importarCatalogoWger } =
    useExercicios();
  const [termo, setTermo] = useState('');
  const [adicionando, setAdicionando] = useState(false);
  const [nomeNovo, setNomeNovo] = useState('');
  const [grupoNovo, setGrupoNovo] = useState('');

  const aoCriar = async (evento: FormEvent): Promise<void> => {
    evento.preventDefault();
    try {
      await criarCustom(nomeNovo, grupoNovo || undefined);
      setNomeNovo('');
      setGrupoNovo('');
      setAdicionando(false);
    } catch {
      // mensagem de erro já exposta pelo hook
    }
  };

  if (carregando) {
    return <p className="px-4 py-8 text-center text-gray-500">Carregando exercícios…</p>;
  }

  const filtrados = buscar(termo);

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Exercícios</h1>

      <input
        type="search"
        placeholder="Buscar exercício…"
        value={termo}
        onChange={(evento) => setTermo(evento.target.value)}
        className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
      />

      {erro !== null && (
        <p role="alert" className="text-sm font-medium text-erro">
          {erro}
        </p>
      )}

      {exercicios.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 px-6 py-10 text-center">
          <span aria-hidden="true" className="text-4xl">
            📚
          </span>
          <p className="text-gray-600">
            A biblioteca está vazia. Baixe o catálogo de exercícios ou crie o seu próprio.
          </p>
          <BotaoGrande onClick={() => void importarCatalogoWger()} disabled={importando}>
            {importando ? 'Baixando catálogo…' : 'Baixar catálogo de exercícios'}
          </BotaoGrande>
        </div>
      ) : filtrados.length === 0 ? (
        <p className="rounded-2xl bg-gray-50 px-6 py-8 text-center text-gray-600">
          Nenhum exercício encontrado para “{termo}”. Tente outro nome ou crie um exercício novo.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtrados.map((exercicio) => (
            <li
              key={exercicio.id}
              className="flex min-h-toque flex-col justify-center rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <span className="font-medium text-gray-900">{exercicio.nome}</span>
              <span className="text-sm text-gray-500">
                {exercicio.grupoMuscular ?? 'Grupo não informado'}
                {exercicio.isCustom && ' · criado por você'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {adicionando ? (
        <form onSubmit={(evento) => void aoCriar(evento)} className="flex flex-col gap-3">
          <input
            autoFocus
            required
            placeholder="Nome do exercício"
            value={nomeNovo}
            onChange={(evento) => setNomeNovo(evento.target.value)}
            className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
          />
          <input
            placeholder="Grupo muscular (opcional)"
            value={grupoNovo}
            onChange={(evento) => setGrupoNovo(evento.target.value)}
            className="min-h-toque rounded-xl border border-gray-300 px-4 text-base outline-none focus:border-primaria-500"
          />
          <BotaoGrande type="submit">Salvar exercício</BotaoGrande>
          <BotaoGrande type="button" variante="secundaria" onClick={() => setAdicionando(false)}>
            Cancelar
          </BotaoGrande>
        </form>
      ) : (
        <BotaoGrande variante="secundaria" onClick={() => setAdicionando(true)}>
          Criar exercício próprio
        </BotaoGrande>
      )}
    </div>
  );
}
