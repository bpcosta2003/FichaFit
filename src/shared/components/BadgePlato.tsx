interface PropsBadgePlato {
  emPlato: boolean;
}

// Indicador de que o exercício não evolui há alguns treinos. Não renderiza nada
// quando não está em platô.
export function BadgePlato({ emPlato }: PropsBadgePlato) {
  if (!emPlato) {
    return null;
  }
  return (
    <span
      title="Sem evolução há 3 treinos — varie as reps, a carga ou o exercício."
      className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg bg-fogo/10 px-2 py-1 text-xs font-semibold text-fogo"
    >
      <span aria-hidden="true">⚠️</span> Sem evolução
    </span>
  );
}
