-- Zoobumon: tabela do ranking + preenche com quem já joga.
-- Cole tudo isto no SQL Editor do Supabase e clique em "Run". Pode rodar de novo sem problema.

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

-- Troca o nome do treinador Doddy pra ZecaPauGordinho
update public.saves set data = jsonb_set(data, '{name}', '"ZecaPauGordinho"') where data->>'name' = 'Doddy';

-- Coloca no ranking todo mundo que já tem save
insert into public.ranking (user_id, nome, txp, nivel, pegos, melhor, updated_at)
select s.user_id,
       left(coalesce(s.data->>'name', 'Treinador'), 20),
       coalesce((s.data->>'txp')::numeric, 0)::int,
       (1 + floor(sqrt(coalesce((s.data->>'txp')::numeric, 0) / 30)))::int,
       greatest((select count(*) from jsonb_object_keys(coalesce(s.data->'dex'->'p', '{}'::jsonb)))::int, coalesce((s.data->>'caught')::int, 0)),
       coalesce((select max((m->>'lv')::int) from jsonb_array_elements(coalesce(s.data->'party', '[]'::jsonb) || coalesce(s.data->'box', '[]'::jsonb)) m), 1),
       s.updated_at
from public.saves s
on conflict (user_id) do update set nome = excluded.nome, txp = excluded.txp, nivel = excluded.nivel,
  pegos = excluded.pegos, melhor = excluded.melhor, updated_at = excluded.updated_at;

select nome, txp, nivel, pegos, melhor from public.ranking order by txp desc;
