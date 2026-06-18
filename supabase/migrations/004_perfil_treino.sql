-- =============================================================
-- FichaFit — Perfil de treino
-- Campos usados pelo assistente de IA personal trainer para
-- gerar fichas personalizadas.
-- =============================================================

alter table public.perfis_usuario
  add column objetivo text
    check (objetivo in ('hipertrofia', 'perda_peso', 'manutencao', 'resistencia')),
  add column idade integer check (idade between 10 and 100),
  add column peso_kg numeric(5, 2) check (peso_kg > 0),
  add column sexo text check (sexo in ('masculino', 'feminino', 'outro')),
  add column dias_por_semana integer check (dias_por_semana between 1 and 7);

-- =============================================================
-- FichaFit — Gerações de IA
-- Usada apenas para limitar a frequência de chamadas ao
-- assistente de IA (rate limiting por usuário).
-- =============================================================

create table public.ia_geracoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.ia_geracoes enable row level security;

create policy "ver geracoes proprias"
  on public.ia_geracoes for select
  using (usuario_id = auth.uid());

create policy "criar geracao propria"
  on public.ia_geracoes for insert
  with check (usuario_id = auth.uid());

create index idx_ia_geracoes_usuario_criado on public.ia_geracoes (usuario_id, criado_em desc);
