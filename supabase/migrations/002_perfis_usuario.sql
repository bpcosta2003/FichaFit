-- =============================================================
-- FichaFit — Perfis de usuário
-- Criado automaticamente via trigger quando um usuário se
-- cadastra (Magic Link). Avatar pré-definido estilo Duolingo.
-- =============================================================

create table public.perfis_usuario (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  avatar_id text not null default 'avatar_01',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.perfis_usuario enable row level security;

create policy "ver perfil proprio"
  on public.perfis_usuario for select
  using (id = auth.uid());

create policy "criar perfil proprio"
  on public.perfis_usuario for insert
  with check (id = auth.uid());

create policy "atualizar perfil proprio"
  on public.perfis_usuario for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Trigger: cria o perfil automaticamente no primeiro login
create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis_usuario (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.handle_novo_usuario();
