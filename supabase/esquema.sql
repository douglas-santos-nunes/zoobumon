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


-- Ranking dos treinadores: todo mundo lê, cada um só escreve a própria linha.
-- (os números vêm do jogo de cada um, então entre amigos tudo bem; não é à prova de trapaça)
create table if not exists public.ranking (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  txp        integer not null default 0,
  nivel      integer not null default 1,
  pegos      integer not null default 0,
  melhor     integer not null default 1,
  updated_at timestamptz not null default now()
);
alter table public.ranking enable row level security;
drop policy if exists "ranking: todos leem" on public.ranking;
create policy "ranking: todos leem" on public.ranking for select using (true);
drop policy if exists "ranking: criar a propria linha" on public.ranking;
create policy "ranking: criar a propria linha" on public.ranking for insert with check (auth.uid() = user_id);
drop policy if exists "ranking: atualizar a propria linha" on public.ranking;
create policy "ranking: atualizar a propria linha" on public.ranking for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create index if not exists ranking_txp on public.ranking (txp desc);

-- Perfil no ranking: time atual, visual e duelos vencidos (o jogo atualiza junto com o save)
alter table public.ranking add column if not exists time jsonb not null default '[]'::jsonb;
alter table public.ranking add column if not exists visual jsonb not null default '{}'::jsonb;
alter table public.ranking add column if not exists vitorias integer not null default 0;
