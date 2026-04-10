-- Link submissions to an exam and persist candidate email for employer-side review.

alter table public.exam_submissions
  add column if not exists exam_id uuid references public.online_tests(id) on delete cascade;

alter table public.exam_submissions
  add column if not exists candidate_email text;

create index if not exists exam_submissions_exam_id_idx
  on public.exam_submissions(exam_id);

create index if not exists exam_submissions_exam_candidate_email_idx
  on public.exam_submissions(exam_id, candidate_email);

-- Backfill candidate email for existing rows when possible.
update public.exam_submissions es
set candidate_email = up.email
from public.user_profiles up
where up.id = es.candidate_id
  and es.candidate_email is null;

create or replace function public.enforce_submission_exam_owner()
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
    raise exception 'Submission employee % does not match exam owner % for exam %', new.employee_id, test_owner_id, new.exam_id;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_submission_exam_owner on public.exam_submissions;

create trigger enforce_submission_exam_owner
before insert or update on public.exam_submissions
for each row
execute function public.enforce_submission_exam_owner();
