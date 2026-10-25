-- Zoobumon: banco de dados do Supabase
-- Cole tudo isto no SQL Editor do Supabase e clique em "Run". Pode rodar de novo sem problema.

-- Um save por conta: o treinador inteiro (zoobumons, bolsa, moedas, posição) fica em "data".
create table if not exists public.saves (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Cada pessoa só lê e escreve o próprio save.
alter table public.saves enable row level security;

drop policy if exists "ler o proprio save" on public.saves;
create policy "ler o proprio save" on public.saves
  for select using (auth.uid() = user_id);

drop policy if exists "criar o proprio save" on public.saves;
create policy "criar o proprio save" on public.saves
  for insert with check (auth.uid() = user_id);

drop policy if exists "atualizar o proprio save" on public.saves;
create policy "atualizar o proprio save" on public.saves
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Amigos no mapa e duelos ao vivo usam o Realtime (canal "mundo"), que não precisa de tabela.
