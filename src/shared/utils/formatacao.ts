const UM_MINUTO = 60;
const UMA_HORA = 3600;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

// "45s", "12min", "1h 05min"
export function formatarDuracao(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  if (total < UM_MINUTO) {
    return `${total}s`;
  }
  if (total < UMA_HORA) {
    return `${Math.floor(total / UM_MINUTO)}min`;
  }
  const horas = Math.floor(total / UMA_HORA);
  const minutos = Math.floor((total % UMA_HORA) / UM_MINUTO);
  return `${horas}h ${String(minutos).padStart(2, '0')}min`;
}

// "1:05" — usado no timer de descanso
export function formatarTempoTimer(segundos: number): string {
  const total = Math.max(0, Math.round(segundos));
  const minutos = Math.floor(total / UM_MINUTO);
  const resto = total % UM_MINUTO;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

// "hoje", "ontem", "há 3 dias", "12/03/2026"
export function formatarDataRelativa(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const inicioData = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diferencaDias = Math.round((inicioHoje.getTime() - inicioData.getTime()) / UM_DIA_MS);

  if (diferencaDias <= 0) {
    return 'hoje';
  }
  if (diferencaDias === 1) {
    return 'ontem';
  }
  if (diferencaDias < 7) {
    return `há ${diferencaDias} dias`;
  }
  return data.toLocaleDateString('pt-BR');
}

// "80 kg", "12,5 kg" — somente kg, sem lbs
export function formatarPesoKg(pesoKg: number): string {
  const formatado = pesoKg.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatado} kg`;
}
