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
  const { gerando, erro, codigoErro, fichasGeradas, justificativa, gerar, limpar, usarFichasGeradas } =
    useAssistenteIA();

  if (!aberto) {
    return null;
  }

  const fechar = (): void => {
    limpar();
    aoFechar();
  };

  const aoUsarFichas = async (): Promise<void> => {
    const fichas = await usarFichasGeradas();
    limpar();
    aoFechar();
    const [unica] = fichas;
    if (fichas.length === 1 && unica !== undefined) {
      router.push(`/treinos/${unica.id}`);
    } else {
      router.push('/treinos');
    }
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
        ) : fichasGeradas !== null ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-texto-suave">
              {fichasGeradas.length === 1
                ? 'Sua ficha personalizada:'
                : `Seu treino da semana, em ${fichasGeradas.length} fichas:`}
            </p>
            {fichasGeradas.map((ficha, indiceFicha) => (
              <div
                key={`${ficha.nome}-${indiceFicha}`}
                className="flex flex-col gap-2 rounded-xl border border-borda bg-superficie-2 p-3"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-titulo text-lg font-bold uppercase tracking-tight text-texto">
                    {ficha.nome}
                  </span>
                  {ficha.descricao !== null && (
                    <span className="text-sm text-texto-suave">{ficha.descricao}</span>
                  )}
                </div>
                <ul className="flex flex-col gap-2">
                  {ficha.exercicios.map((exercicio, indice) => (
                    <li key={`${exercicio.nome}-${indice}`} className="rounded-lg bg-superficie p-2">
                      <span className="font-semibold text-texto">{exercicio.nome}</span>
                      <p className="text-sm text-texto-suave">
                        {exercicio.series} séries · {exercicio.repeticoesMin}–
                        {exercicio.repeticoesMax} reps
                        {exercicio.cargaReferenciaKg !== null &&
                          ` · ${formatarPesoKg(exercicio.cargaReferenciaKg)}`}{' '}
                        · {exercicio.descansoSegundos}s descanso
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {justificativa !== null && (
              <div className="flex flex-col gap-3 rounded-xl border border-fogo/30 bg-superficie-2 p-4">
                <h3 className="font-titulo text-sm font-bold uppercase tracking-[0.15em] text-fogo">
                  Por que este treino
                </h3>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                    Escolha do treino
                  </span>
                  <p className="text-sm text-texto">{justificativa.porqueDoTreino}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                    Como evoluir
                  </span>
                  <p className="text-sm text-texto">{justificativa.comoEvoluir}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-texto-suave">
                    Nível de assertividade
                  </span>
                  <p className="text-sm text-texto">{justificativa.nivelAssertividade}</p>
                </div>
              </div>
            )}
            <BotaoGrande onClick={() => void aoUsarFichas()}>
              {fichasGeradas.length === 1 ? 'Usar esta ficha' : 'Usar este treino'}
            </BotaoGrande>
            <BotaoGrande variante="secundaria" onClick={fechar}>
              Cancelar
            </BotaoGrande>
          </div>
        ) : gerando ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-texto-suave">
              Gerando seu treino personalizado, isso pode levar alguns segundos…
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-texto-suave">
              A assistente de IA cria um treino semanal completo — uma ficha para cada dia de
              treino — baseado no seu perfil: objetivo, idade, peso, sexo e frequência semanal.
            </p>
            {erro !== null && (
              <p role="alert" className="text-sm font-medium text-erro">
                {erro}
              </p>
            )}
            <BotaoGrande onClick={() => void gerar()}>
              {erro !== null ? 'Tentar novamente' : 'Gerar treino com IA'}
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
