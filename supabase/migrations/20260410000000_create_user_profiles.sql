-- Store authenticated users in a profile table that can be queried by the app.
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'candidate' check (role in ('candidate', 'employer', 'admin')),
  panel text not null default 'candidate' check (panel in ('candidate', 'employer')),
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

create or replace function public.set_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_user_profiles_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email, role, panel, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'candidate'),
    coalesce(new.raw_user_meta_data ->> 'panel', 'candidate'),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do update
  set
    email = excluded.email,
    role = excluded.role,
    panel = excluded.panel,
    full_name = coalesce(excluded.full_name, public.user_profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create policy "Profiles are readable by the owning user"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Profiles are insertable by the owning user"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Profiles are updatable by the owning user"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
