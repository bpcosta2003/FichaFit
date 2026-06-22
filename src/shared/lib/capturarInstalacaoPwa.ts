// Captura o evento beforeinstallprompt em module scope, o mais cedo possível.
// O navegador dispara esse evento logo no carregamento da página — se o
// listener só for registrado dentro de um useEffect de um componente
// carregado via dynamic(..., { ssr: false }), o evento já passou e se perde
// para sempre. Importar este módulo a partir do layout raiz garante que o
// listener exista antes de qualquer página lazy montar.

export interface EventoInstalacaoPwa extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Ouvinte = (evento: EventoInstalacaoPwa | null) => void;

let eventoCapturado: EventoInstalacaoPwa | null = null;
// O evento appinstalled chegou nesta sessão. Guardado à parte porque, logo após
// instalar, a página ainda roda na ABA do navegador (não na janela do PWA), então
// display-mode: standalone continua falso — não dá para inferir "instalado" só por ele.
let appFoiInstalado = false;
const ouvintes = new Set<Ouvinte>();

function notificar(evento: EventoInstalacaoPwa | null): void {
  for (const ouvinte of ouvintes) {
    ouvinte(evento);
  }
}

function aoDisponibilizar(evento: Event): void {
  evento.preventDefault();
  eventoCapturado = evento as EventoInstalacaoPwa;
  notificar(eventoCapturado);
}

function aoInstalar(): void {
  appFoiInstalado = true;
  eventoCapturado = null;
  notificar(null);
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', aoDisponibilizar);
  window.addEventListener('appinstalled', aoInstalar);
}

export function obterEventoInstalacaoCapturado(): EventoInstalacaoPwa | null {
  return eventoCapturado;
}

// O app foi instalado nesta sessão (evento appinstalled já disparou).
export function obterAppFoiInstalado(): boolean {
  return appFoiInstalado;
}

export function inscreverEventoInstalacao(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

// O prompt nativo só pode ser usado uma vez — chamar após consumi-lo.
export function consumirEventoInstalacao(): void {
  eventoCapturado = null;
}
