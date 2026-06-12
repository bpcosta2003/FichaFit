'use client';

import { BotaoGrande } from './BotaoGrande';
import { InputNumerico } from './InputNumerico';

interface PropsLogadorSerie {
  repeticoes: number;
  pesoKg: number;
  numeroSerie: number;
  aoMudarRepeticoes: (valor: number) => void;
  aoMudarPeso: (valor: number) => void;
  aoRegistrar: () => void;
  desabilitado?: boolean;
}

// Peso + repetições combinados com o botão de registrar.
// Fica na metade inferior da tela — acessível com o polegar.
export function LogadorSerie({
  repeticoes,
  pesoKg,
  numeroSerie,
  aoMudarRepeticoes,
  aoMudarPeso,
  aoRegistrar,
  desabilitado = false,
}: PropsLogadorSerie) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <InputNumerico
          rotulo="Repetições"
          valor={repeticoes}
          aoMudar={aoMudarRepeticoes}
          passo={1}
          minimo={1}
        />
        <InputNumerico
          rotulo="Peso (kg)"
          valor={pesoKg}
          aoMudar={aoMudarPeso}
          passo={2.5}
          minimo={0}
        />
      </div>
      <BotaoGrande onClick={aoRegistrar} disabled={desabilitado}>
        Registrar Série {numeroSerie}
      </BotaoGrande>
    </div>
  );
}
