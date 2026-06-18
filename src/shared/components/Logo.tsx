import Image from 'next/image';

type Tamanho = 'sm' | 'md' | 'lg';

interface PropsLogo {
  tamanho?: Tamanho;
}

const dimensoes: Record<Tamanho, number> = {
  sm: 40,
  md: 64,
  lg: 96,
};

export function Logo({ tamanho = 'md' }: PropsLogo) {
  const px = dimensoes[tamanho];
  return (
    <Image
      src="/icons/image-logo.png"
      alt="FichaFit"
      width={px}
      height={px}
      className="rounded-2xl"
      priority
    />
  );
}
