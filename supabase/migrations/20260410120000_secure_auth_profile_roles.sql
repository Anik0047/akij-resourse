-- Secure role handling for Supabase Auth based signup/signin.
-- Passwords are managed only by Supabase Auth (auth.users), not stored in public tables.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  normalized_role text;
  normalized_panel text;
begin
  requested_role := lower(coalesce(new.raw_user_meta_data ->> 'role', 'candidate'));

  -- Allow only public signup roles from metadata.
  normalized_role := case
    when requested_role in ('candidate', 'employer') then requested_role
    else 'candidate'
  end;

  normalized_panel := case
    when normalized_role = 'employer' then 'employer'
    else 'candidate'
  end;

  insert into public.user_profiles (id, email, role, panel, full_name)
  values (
    new.id,
    new.email,
    normalized_role,
    normalized_panel,
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

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id
     and (
       new.role is distinct from old.role
       or new.panel is distinct from old.panel
     ) then
    raise exception 'You are not allowed to change your role or panel.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_self_role_change on public.user_profiles;

create trigger prevent_self_role_change
before update on public.user_profiles
for each row
execute function public.prevent_self_role_change();
