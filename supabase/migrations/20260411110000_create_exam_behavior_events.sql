-- Persist candidate behavior/proctoring events for employer review.

create table if not exists public.exam_behavior_events (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.online_tests(id) on delete cascade,
  submission_id uuid references public.exam_submissions(id) on delete set null,
  employee_id uuid not null references public.employees(id) on delete cascade,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  candidate_email text,
  event_type text not null check (
    event_type in (
      'tab_switch',
      'fullscreen_exit',
      'fullscreen_enter',
      'auto_submit_policy'
    )
  ),
  event_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists exam_behavior_events_exam_id_idx
  on public.exam_behavior_events(exam_id);

create index if not exists exam_behavior_events_candidate_id_idx
  on public.exam_behavior_events(candidate_id);

create index if not exists exam_behavior_events_exam_candidate_id_idx
  on public.exam_behavior_events(exam_id, candidate_id);

create index if not exists exam_behavior_events_exam_candidate_email_idx
  on public.exam_behavior_events(exam_id, candidate_email);

create index if not exists exam_behavior_events_created_at_idx
  on public.exam_behavior_events(created_at desc);

alter table public.exam_behavior_events enable row level security;

create policy "Candidates can insert own behavior events"
  on public.exam_behavior_events
  for insert
  to authenticated
  with check (
    candidate_id = auth.uid()
    and exists (
      select 1
      from public.online_tests ot
      where ot.id = exam_id
        and ot.employee_id = exam_behavior_events.employee_id
    )
  );

create policy "Candidates can read own behavior events"
  on public.exam_behavior_events
  for select
  to authenticated
  using (candidate_id = auth.uid());

create policy "Employers can read behavior events for own exams"
  on public.exam_behavior_events
  for select
  to authenticated
  using (employee_id = auth.uid());
