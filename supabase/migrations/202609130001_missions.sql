create extension if not exists pgcrypto;

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique check (code ~ '^[A-Z0-9]{6}$'),
  title text not null check (char_length(title) between 6 and 90),
  grade_band text not null check (grade_band in ('6–8', '9–10', '11–12')),
  learning_objective text not null check (char_length(learning_objective) between 12 and 240),
  bill jsonb not null,
  representative jsonb not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mission_sources (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  source_key text not null,
  label text not null,
  url text not null,
  publisher text not null,
  excerpt text not null,
  created_at timestamptz not null default now(),
  unique (mission_id, source_key)
);

create table public.mission_content (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  kind text not null check (kind in ('evidence', 'question')),
  position integer not null check (position >= 0),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  unique (mission_id, kind, position)
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 24),
  token_hash text not null,
  created_at timestamptz not null default now(),
  unique (mission_id, token_hash)
);

create table public.mission_responses (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null unique references public.participants(id) on delete cascade,
  current_chapter integer not null default 0 check (current_chapter between 0 and 6),
  response jsonb not null default '{}'::jsonb,
  review_status text not null default 'draft' check (review_status in ('draft', 'submitted', 'approved', 'returned', 'excluded')),
  feedback text,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index missions_owner_id_idx on public.missions(owner_id);
create index mission_sources_mission_id_idx on public.mission_sources(mission_id);
create index mission_content_mission_id_idx on public.mission_content(mission_id);
create index participants_mission_id_idx on public.participants(mission_id);

alter table public.missions enable row level security;
alter table public.mission_sources enable row level security;
alter table public.mission_content enable row level security;
alter table public.participants enable row level security;
alter table public.mission_responses enable row level security;

revoke all on public.missions, public.mission_sources, public.mission_content, public.participants, public.mission_responses from anon;
revoke all on public.participants, public.mission_responses from authenticated;
grant select, insert, update, delete on public.missions, public.mission_sources, public.mission_content to authenticated;
grant select, update on public.participants, public.mission_responses to authenticated;

create policy "teachers manage owned missions" on public.missions
  for all to authenticated
  using ((select auth.uid()) is not null and (select auth.uid()) = owner_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = owner_id);

create policy "teachers manage owned sources" on public.mission_sources
  for all to authenticated
  using (exists (select 1 from public.missions m where m.id = mission_id and m.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.missions m where m.id = mission_id and m.owner_id = (select auth.uid())));

create policy "teachers manage owned content" on public.mission_content
  for all to authenticated
  using (exists (select 1 from public.missions m where m.id = mission_id and m.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.missions m where m.id = mission_id and m.owner_id = (select auth.uid())));

create policy "teachers read mission participants" on public.participants
  for select to authenticated
  using (exists (select 1 from public.missions m where m.id = mission_id and m.owner_id = (select auth.uid())));

create policy "teachers read mission responses" on public.mission_responses
  for select to authenticated
  using (exists (
    select 1 from public.participants p
    join public.missions m on m.id = p.mission_id
    where p.id = participant_id and m.owner_id = (select auth.uid())
  ));

create policy "teachers review mission responses" on public.mission_responses
  for update to authenticated
  using (exists (
    select 1 from public.participants p
    join public.missions m on m.id = p.mission_id
    where p.id = participant_id and m.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.participants p
    join public.missions m on m.id = p.mission_id
    where p.id = participant_id and m.owner_id = (select auth.uid())
  ));
