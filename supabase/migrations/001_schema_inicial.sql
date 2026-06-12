-- =============================================================
-- FichaFit — Schema inicial
-- Todas as tabelas com RLS ativa e usuario_id para isolamento.
-- IDs de sessão são gerados no cliente (offline-first).
-- Soft delete via deletado_em — nunca DELETE físico.
-- =============================================================

-- ---------------------------------------------------------------
-- Catálogo de exercícios (global: usuario_id IS NULL / custom)
-- ---------------------------------------------------------------
create table public.exercicio_definicoes (
  id uuid primary key default gen_random_uuid(),
  wger_id integer unique,
  nome text not null,
  grupo_muscular text,
  descricao text,
  is_custom boolean not null default false,
  usuario_id uuid references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz
);

alter table public.exercicio_definicoes enable row level security;

create policy "catalogo e exercicios proprios visiveis"
  on public.exercicio_definicoes for select
  using (usuario_id is null or usuario_id = auth.uid());

create policy "criar exercicio custom proprio"
  on public.exercicio_definicoes for insert
  with check (usuario_id = auth.uid() and is_custom = true);

create policy "atualizar exercicio custom proprio"
  on public.exercicio_definicoes for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

-- ---------------------------------------------------------------
-- Fichas de treino
-- ---------------------------------------------------------------
create table public.fichas_treino (
  id uuid primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  descricao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz
);

alter table public.fichas_treino enable row level security;

create policy "ver fichas proprias"
  on public.fichas_treino for select
  using (usuario_id = auth.uid());

create policy "criar ficha propria"
  on public.fichas_treino for insert
  with check (usuario_id = auth.uid());

create policy "atualizar ficha propria"
  on public.fichas_treino for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create index idx_fichas_treino_usuario on public.fichas_treino (usuario_id);

-- ---------------------------------------------------------------
-- Exercícios dentro de uma ficha
-- ---------------------------------------------------------------
create table public.exercicios_ficha (
  id uuid primary key,
  ficha_id uuid not null references public.fichas_treino (id) on delete cascade,
  exercicio_definicao_id uuid references public.exercicio_definicoes (id),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  series integer not null default 3,
  repeticoes_min integer not null default 8,
  repeticoes_max integer not null default 12,
  carga_referencia_kg numeric(6, 2),
  descanso_segundos integer not null default 90,
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz
);

alter table public.exercicios_ficha enable row level security;

create policy "ver exercicios de fichas proprias"
  on public.exercicios_ficha for select
  using (usuario_id = auth.uid());

create policy "criar exercicio em ficha propria"
  on public.exercicios_ficha for insert
  with check (usuario_id = auth.uid());

create policy "atualizar exercicio de ficha propria"
  on public.exercicios_ficha for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create index idx_exercicios_ficha_ficha on public.exercicios_ficha (ficha_id);
create index idx_exercicios_ficha_usuario on public.exercicios_ficha (usuario_id);

-- ---------------------------------------------------------------
-- Sessões de treino — id e client_id gerados no cliente (offline)
-- client_id é usado para deduplicação no upsert do sync
-- ---------------------------------------------------------------
create table public.sessoes_treino (
  id uuid primary key,
  client_id uuid not null unique,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  ficha_id uuid not null,
  nome_ficha text not null,
  status text not null default 'em_andamento'
    check (status in ('em_andamento', 'concluida', 'cancelada')),
  iniciada_em timestamptz not null,
  concluida_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz
);

alter table public.sessoes_treino enable row level security;

create policy "ver sessoes proprias"
  on public.sessoes_treino for select
  using (usuario_id = auth.uid());

create policy "criar sessao propria"
  on public.sessoes_treino for insert
  with check (usuario_id = auth.uid());

create policy "atualizar sessao propria"
  on public.sessoes_treino for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create index idx_sessoes_treino_usuario on public.sessoes_treino (usuario_id);
create index idx_sessoes_treino_iniciada on public.sessoes_treino (usuario_id, iniciada_em desc);

-- ---------------------------------------------------------------
-- Séries realizadas dentro de uma sessão
-- ---------------------------------------------------------------
create table public.series_realizadas (
  id uuid primary key,
  sessao_id uuid not null references public.sessoes_treino (id) on delete cascade,
  exercicio_ficha_id uuid not null,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nome_exercicio text not null,
  numero_serie integer not null,
  repeticoes integer not null,
  peso_kg numeric(6, 2) not null,
  realizada_em timestamptz not null,
  criado_em timestamptz not null default now(),
  deletado_em timestamptz
);

alter table public.series_realizadas enable row level security;

create policy "ver series proprias"
  on public.series_realizadas for select
  using (usuario_id = auth.uid());

create policy "criar serie propria"
  on public.series_realizadas for insert
  with check (usuario_id = auth.uid());

create policy "atualizar serie propria"
  on public.series_realizadas for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create index idx_series_realizadas_sessao on public.series_realizadas (sessao_id);
create index idx_series_realizadas_usuario on public.series_realizadas (usuario_id);
