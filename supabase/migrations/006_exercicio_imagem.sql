-- =============================================================
-- FichaFit — Imagem do exercício
-- Adiciona a URL de uma foto estática de como executar o exercício
-- (vinda do wger ou definida manualmente para exercícios custom).
-- O wger não fornece GIFs/animações — apenas fotos estáticas, com
-- cobertura parcial entre os exercícios do catálogo.
-- =============================================================

alter table public.exercicio_definicoes
  add column imagem_url text;
