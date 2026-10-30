-- Ares personal memory store. Apply only to a dedicated Ares Supabase project.
-- Data API access is opt-in: grant only authenticated and service_role.
create table if not exists public.ares_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  content text not null check (char_length(content) between 1 and 20000),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ares_memories_user_updated_idx
  on public.ares_memories (user_id, updated_at desc);

alter table public.ares_memories enable row level security;

drop policy if exists "Users read their own Ares memories" on public.ares_memories;
create policy "Users read their own Ares memories"
  on public.ares_memories for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create their own Ares memories" on public.ares_memories;
create policy "Users create their own Ares memories"
  on public.ares_memories for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own Ares memories" on public.ares_memories;
create policy "Users update their own Ares memories"
  on public.ares_memories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own Ares memories" on public.ares_memories;
create policy "Users delete their own Ares memories"
  on public.ares_memories for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.ares_memories from anon;
grant select, insert, update, delete on public.ares_memories to authenticated;
grant select, insert, update, delete on public.ares_memories to service_role;

create or replace function public.ares_memories_touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ares_memories_updated_at on public.ares_memories;
create trigger ares_memories_updated_at
before update on public.ares_memories
for each row execute function public.ares_memories_touch_updated_at();
