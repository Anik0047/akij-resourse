-- Backfill missing employee and candidate rows from existing user profiles.

insert into public.employees (id)
select up.id
from public.user_profiles up
where up.role = 'employer'
on conflict (id) do nothing;

insert into public.candidates (id)
select up.id
from public.user_profiles up
where up.role = 'candidate'
on conflict (id) do nothing;
