'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAssistenteIA } from '@/modules/fichas/application/useAssistenteIA';
import { formatarPesoKg } from '@/shared/utils/formatacao';
import { BotaoGrande } from '@/shared/components/BotaoGrande';

interface PropsModalAssistenteIA {
  aberto: boolean;
  aoFechar: () => void;
}

export function ModalAssistenteIA({ aberto, aoFechar }: PropsModalAssistenteIA) {
  const router = useRouter();
  const { gerando, erro, codigoErro, fichaGerada, gerar, limpar, usarFichaGerada } =
    useAssistenteIA();

  if (!aberto) {
    return null;
  }

  const fechar = (): void => {
    limpar();
    aoFechar();
  };

  const aoUsarFicha = async (): Promise<void> => {
    const ficha = await usarFichaGerada();
    limpar();
    aoFechar();
    router.push(`/treinos/${ficha.id}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-ia"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4"
    >
      <div className="flex max-h-[85vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-2xl border border-borda bg-superficie p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <h2
          id="titulo-modal-ia"
          className="font-titulo text-2xl font-bold uppercase tracking-tight text-texto"
        >
          Assistente de IA
        </h2>

        {codigoErro === 'PERFIL_INCOMPLETO' ? (
          <div className="flex flex-col gap-3">
            <p className="text-texto-suave">
              Complete seu perfil de treino (objetivo, idade, peso, sexo e dias por semana) para
              a assistente conseguir gerar uma ficha personalizada para você.
            </p>
            <Link href="/perfil" onClick={fechar}>
              <BotaoGrande>Completar perfil</BotaoGrande>
            </Link>
            <BotaoGrande variante="secundaria" onClick={fechar}>
              Cancelar
            </BotaoGrande>
          </div>
        ) : fichaGerada !== null ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-titulo text-xl font-bold uppercase tracking-tight text-texto">
                {fichaGerada.nome}
              </span>
              {fichaGerada.descricao !== null && (
                <span className="text-sm text-texto-suave">{fichaGerada.descricao}</span>
              )}
            </div>
            <ul className="flex flex-col gap-2">
              {fichaGerada.exercicios.map((exercicio, indice) => (
                <li
                  key={`${exercicio.nome}-${indice}`}
                  className="rounded-xl border border-borda bg-superficie-2 p-3"
                >
                  <span className="font-semibold text-texto">{exercicio.nome}</span>
                  <p className="text-sm text-texto-suave">
                    {exercicio.series} séries · {exercicio.repeticoesMin}–{exercicio.repeticoesMax}{' '}
                    reps
                    {exercicio.cargaReferenciaKg !== null &&
                      ` · ${formatarPesoKg(exercicio.cargaReferenciaKg)}`}{' '}
                    · {exercicio.descansoSegundos}s descanso
                  </p>
                </li>
              ))}
            </ul>
            <BotaoGrande onClick={() => void aoUsarFicha()}>Usar esta ficha</BotaoGrande>
            <BotaoGrande variante="secundaria" onClick={fechar}>
              Cancelar
            </BotaoGrande>
          </div>
        ) : gerando ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-texto-suave">
              Gerando sua ficha personalizada, isso pode levar alguns segundos…
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-texto-suave">
              A assistente de IA cria uma ficha de treino completa baseada no seu perfil:
              objetivo, idade, peso, sexo e frequência semanal.
            </p>
            {erro !== null && (
              <p role="alert" className="text-sm font-medium text-erro">
                {erro}
              </p>
            )}
            <BotaoGrande onClick={() => void gerar()}>
              {erro !== null ? 'Tentar novamente' : 'Gerar ficha com IA'}
            </BotaoGrande>
            <BotaoGrande variante="secundaria" onClick={fechar}>
              Cancelar
            </BotaoGrande>
          </div>
        )}
      </div>
    </div>
  );
}
