-- Online tests table for storing exam metadata in Supabase.

create table if not exists public.online_tests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  title text not null,
  total_candidates integer not null default 0 check (total_candidates >= 0),
  total_slots integer not null default 1 check (total_slots > 0),
  question_sets integer not null default 1 check (question_sets > 0),
  question_type text not null check (question_type in ('checkbox', 'radio', 'text')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  negative_marking numeric(10,2) not null default 0 check (negative_marking >= 0),
  candidates text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

alter table public.questions
  add column if not exists exam_id uuid references public.online_tests(id) on delete cascade;

create index if not exists online_tests_employee_id_idx
  on public.online_tests(employee_id);

create index if not exists questions_exam_id_idx
  on public.questions(exam_id);

create or replace function public.set_online_tests_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_online_tests_updated_at
before update on public.online_tests
for each row
execute function public.set_online_tests_updated_at();

create or replace function public.enforce_question_exam_owner()
returns trigger
language plpgsql
as $$
declare
  test_owner_id uuid;
begin
  if new.exam_id is null then
    return new;
  end if;

  select employee_id
  into test_owner_id
  from public.online_tests
  where id = new.exam_id;

  if test_owner_id is null then
    raise exception 'Exam does not exist for exam_id=%', new.exam_id;
  end if;

  if test_owner_id <> new.employee_id then
    raise exception 'Question owner % does not match exam owner % for exam %', new.employee_id, test_owner_id, new.exam_id;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_question_exam_owner on public.questions;

create trigger enforce_question_exam_owner
before insert or update on public.questions
for each row
execute function public.enforce_question_exam_owner();

alter table public.online_tests enable row level security;

create policy "Employees can manage their own online tests"
  on public.online_tests
  for all
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

create policy "Candidates can read online tests"
  on public.online_tests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'candidate'
    )
  );
