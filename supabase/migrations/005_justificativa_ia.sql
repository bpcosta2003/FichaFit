-- =============================================================
-- FichaFit — Justificativa da IA na ficha
-- Guarda o texto explicativo gerado pela assistente de IA (por que
-- o treino foi escolhido, como evoluir e nível de assertividade)
-- junto da ficha, para o usuário relembrar depois.
-- Estrutura JSON: { porqueDoTreino, comoEvoluir, nivelAssertividade }.
-- =============================================================

alter table public.fichas_treino
  add column justificativa_ia jsonb;
