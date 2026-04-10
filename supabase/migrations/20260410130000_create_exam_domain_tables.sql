-- Exam domain: employees, candidates, question ownership, and candidate submissions.

create table if not exists public.employees (
  id uuid primary key references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.candidates (
  id uuid primary key references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  title text not null,
  question_type text not null check (question_type in ('checkbox', 'radio', 'text')),
  options jsonb not null default '[]'::jsonb,
  correct_answer jsonb,
  points numeric(10,2) not null default 1 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.exam_submissions (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete restrict,
  score numeric(10,2) not null default 0,
  max_score numeric(10,2) not null default 0,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (score >= 0),
  check (max_score >= 0),
  check (score <= max_score)
);

create table if not exists public.exam_submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.exam_submissions(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  candidate_answer jsonb not null,
  awarded_points numeric(10,2) not null default 0 check (awarded_points >= 0),
  is_correct boolean,
  created_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create or replace function public.sync_user_profile_role_tables()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'employer' then
    insert into public.employees (id)
    values (new.id)
    on conflict (id) do nothing;

    delete from public.candidates where id = new.id;
  elsif new.role = 'candidate' then
    insert into public.candidates (id)
    values (new.id)
    on conflict (id) do nothing;

    delete from public.employees where id = new.id;
  else
    delete from public.employees where id = new.id;
    delete from public.candidates where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sync_user_profile_role_tables on public.user_profiles;

create trigger sync_user_profile_role_tables
after insert or update of role on public.user_profiles
for each row
execute function public.sync_user_profile_role_tables();

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

create index if not exists questions_employee_id_idx
  on public.questions(employee_id);

create index if not exists exam_submissions_candidate_id_idx
  on public.exam_submissions(candidate_id);

create index if not exists exam_submissions_employee_id_idx
  on public.exam_submissions(employee_id);

create index if not exists exam_submission_answers_submission_id_idx
  on public.exam_submission_answers(submission_id);

create index if not exists exam_submission_answers_question_id_idx
  on public.exam_submission_answers(question_id);

create or replace function public.set_exam_domain_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_questions_updated_at
before update on public.questions
for each row
execute function public.set_exam_domain_updated_at_timestamp();

create trigger set_exam_submissions_updated_at
before update on public.exam_submissions
for each row
execute function public.set_exam_domain_updated_at_timestamp();

create or replace function public.enforce_submission_question_owner()
returns trigger
language plpgsql
as $$
declare
  submission_employee_id uuid;
  question_employee_id uuid;
begin
  select employee_id
  into submission_employee_id
  from public.exam_submissions
  where id = new.submission_id;

  if submission_employee_id is null then
    raise exception 'Submission does not exist for submission_id=%', new.submission_id;
  end if;

  select employee_id
  into question_employee_id
  from public.questions
  where id = new.question_id;

  if question_employee_id is null then
    raise exception 'Question does not exist for question_id=%', new.question_id;
  end if;

  if submission_employee_id <> question_employee_id then
    raise exception 'Question % is not owned by employee % for submission %', new.question_id, submission_employee_id, new.submission_id;
  end if;

  return new;
end;
$$;

create trigger enforce_submission_question_owner
before insert or update on public.exam_submission_answers
for each row
execute function public.enforce_submission_question_owner();

alter table public.employees enable row level security;
alter table public.candidates enable row level security;
alter table public.questions enable row level security;
alter table public.exam_submissions enable row level security;
alter table public.exam_submission_answers enable row level security;

create policy "Employees can read their own row"
  on public.employees
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Employees can insert their own row"
  on public.employees
  for insert
  to authenticated
  with check (
    auth.uid() = id
    and exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'employer'
    )
  );

create policy "Employees can update their own row"
  on public.employees
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Candidates can read their own row"
  on public.candidates
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Candidates can insert their own row"
  on public.candidates
  for insert
  to authenticated
  with check (
    auth.uid() = id
    and exists (
      select 1
      from public.user_profiles up
      where up.id = auth.uid()
        and up.role = 'candidate'
    )
  );

create policy "Candidates can update their own row"
  on public.candidates
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Employees can manage their own questions"
  on public.questions
  for all
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

create policy "Candidates can read questions"
  on public.questions
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

create policy "Candidates can create their own submissions"
  on public.exam_submissions
  for insert
  to authenticated
  with check (candidate_id = auth.uid());

create policy "Candidates can read their own submissions"
  on public.exam_submissions
  for select
  to authenticated
  using (candidate_id = auth.uid());

create policy "Employees can read submissions for their questions"
  on public.exam_submissions
  for select
  to authenticated
  using (employee_id = auth.uid());

create policy "Employees can update submissions for scoring"
  on public.exam_submissions
  for update
  to authenticated
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());

create policy "Candidates can insert answers for their submissions"
  on public.exam_submission_answers
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.exam_submissions es
      where es.id = submission_id
        and es.candidate_id = auth.uid()
    )
  );

create policy "Candidates can read answers for their submissions"
  on public.exam_submission_answers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.exam_submissions es
      where es.id = submission_id
        and es.candidate_id = auth.uid()
    )
  );

create policy "Employees can read answers for their submissions"
  on public.exam_submission_answers
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.exam_submissions es
      where es.id = submission_id
        and es.employee_id = auth.uid()
    )
  );

create policy "Employees can update answers for scoring"
  on public.exam_submission_answers
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.exam_submissions es
      where es.id = submission_id
        and es.employee_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.exam_submissions es
      where es.id = submission_id
        and es.employee_id = auth.uid()
    )
  );
