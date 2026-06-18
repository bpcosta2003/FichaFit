-- =============================================================
-- FichaFit — Grupos de ficha
-- Permite agrupar várias fichas de treino (ex: grupo "PPL"
-- contendo as fichas Push/Pull/Legs). Soft delete via deletado_em.
-- =============================================================

create table public.grupos_ficha (
  id uuid primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  deletado_em timestamptz
);

alter table public.grupos_ficha enable row level security;

create policy "ver grupos proprios"
  on public.grupos_ficha for select
  using (usuario_id = auth.uid());

create policy "criar grupo proprio"
  on public.grupos_ficha for insert
  with check (usuario_id = auth.uid());

create policy "atualizar grupo proprio"
  on public.grupos_ficha for update
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());

create index idx_grupos_ficha_usuario on public.grupos_ficha (usuario_id);

-- Ficha vinculada a um grupo — ao excluir o grupo, a ficha vira "sem grupo".
alter table public.fichas_treino
  add column grupo_id uuid references public.grupos_ficha (id) on delete set null;

create index idx_fichas_treino_grupo on public.fichas_treino (grupo_id);
