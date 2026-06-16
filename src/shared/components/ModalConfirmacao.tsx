'use client';

import { BotaoGrande } from './BotaoGrande';

interface PropsModalConfirmacao {
  aberto: boolean;
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  rotuloCancelar?: string;
  perigo?: boolean;
  aoConfirmar: () => void;
  aoCancelar: () => void;
}

// Modal genérico para ações destrutivas (excluir ficha, cancelar treino).
export function ModalConfirmacao({
  aberto,
  titulo,
  descricao,
  rotuloConfirmar,
  rotuloCancelar = 'Voltar',
  perigo = false,
  aoConfirmar,
  aoCancelar,
}: PropsModalConfirmacao) {
  if (!aberto) {
    return null;
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-modal-confirmacao"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-2xl border border-borda bg-superficie p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <h2
          id="titulo-modal-confirmacao"
          className="font-titulo text-2xl font-bold uppercase tracking-tight text-texto"
        >
          {titulo}
        </h2>
        <p className="mt-2 text-texto-suave">{descricao}</p>
        <div className="mt-6 flex flex-col gap-3">
          <BotaoGrande variante={perigo ? 'perigo' : 'primaria'} onClick={aoConfirmar}>
            {rotuloConfirmar}
          </BotaoGrande>
          <BotaoGrande variante="secundaria" onClick={aoCancelar}>
            {rotuloCancelar}
          </BotaoGrande>
        </div>
      </div>
    </div>
  );
}
