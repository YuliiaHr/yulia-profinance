-- yulia.profinance planner: cloud storage with per-client access.
-- Run once in Supabase → SQL Editor. Safe to re-run.

-- Advisors (Юлія). Added by hand: see the last statement.
create table if not exists public.advisors (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.advisors enable row level security;
drop policy if exists "advisors read self" on public.advisors;
create policy "advisors read self" on public.advisors for select using (user_id = auth.uid());

create or replace function public.is_advisor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.advisors where user_id = auth.uid());
$$;

-- One row per client plan. The whole plan is stored as JSON in `data`.
create table if not exists public.plans (
  id text primary key,
  advisor_id uuid not null default auth.uid() references auth.users on delete cascade,
  client_id uuid references auth.users on delete set null,
  client_email text,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid(),
  -- What the advisor last reviewed; used to show «що змінив клієнт».
  advisor_snapshot jsonb
);
alter table public.plans enable row level security;

drop policy if exists "plans read" on public.plans;
create policy "plans read" on public.plans for select
  using (public.is_advisor() or client_id = auth.uid());

drop policy if exists "plans insert" on public.plans;
create policy "plans insert" on public.plans for insert
  with check (public.is_advisor());

drop policy if exists "plans update" on public.plans;
create policy "plans update" on public.plans for update
  using (public.is_advisor() or client_id = auth.uid())
  with check (public.is_advisor() or client_id = auth.uid());

drop policy if exists "plans delete" on public.plans;
create policy "plans delete" on public.plans for delete
  using (public.is_advisor());

-- A client may not reassign their plan or touch the advisor's review snapshot.
create or replace function public.protect_plan_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_advisor() then
    new.client_id := old.client_id;
    new.client_email := old.client_email;
    new.advisor_id := old.advisor_id;
    new.advisor_snapshot := old.advisor_snapshot;
  end if;
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
drop trigger if exists protect_plan_fields on public.plans;
create trigger protect_plan_fields before update on public.plans
  for each row execute function public.protect_plan_fields();

-- Advisor links a plan to a client's account by email.
create or replace function public.link_client(plan_id text, email text) returns uuid
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.is_advisor() then raise exception 'only advisors'; end if;
  select id into uid from auth.users where lower(auth.users.email) = lower(link_client.email);
  if uid is null then raise exception 'no such user'; end if;
  update public.plans set client_id = uid, client_email = lower(link_client.email) where id = plan_id;
  return uid;
end $$;

-- Advisor removes a client's access to a plan.
create or replace function public.unlink_client(plan_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_advisor() then raise exception 'only advisors'; end if;
  update public.plans set client_id = null, client_email = null where id = plan_id;
end $$;

-- Advisor sets a new password for the client of a plan (client forgot theirs).
create or replace function public.reset_client_password(plan_id text, new_password text) returns void
language plpgsql security definer set search_path = public, auth, extensions as $$
declare uid uuid;
begin
  if not public.is_advisor() then raise exception 'only advisors'; end if;
  if length(new_password) < 8 then raise exception 'password too short'; end if;
  select client_id into uid from public.plans where id = plan_id;
  if uid is null then raise exception 'plan has no client'; end if;
  update auth.users set encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')), updated_at = now()
  where id = uid;
end $$;

-- Explicit grants: works even when the project does not expose new tables automatically.
-- Row-level security above still decides which rows each user can see.
grant usage on schema public to anon, authenticated;
revoke all on public.plans, public.advisors from anon;
grant select, insert, update, delete on public.plans to authenticated;
grant select on public.advisors to authenticated;
revoke execute on function public.is_advisor(), public.link_client(text, text), public.unlink_client(text), public.reset_client_password(text, text) from public, anon;
grant execute on function public.is_advisor(), public.link_client(text, text), public.unlink_client(text), public.reset_client_password(text, text) to authenticated;

-- After Юлія has signed up in the planner, make her the advisor (replace the email):
-- insert into public.advisors select id from auth.users where email = 'yulia@example.com' on conflict do nothing;
