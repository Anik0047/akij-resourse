-- Add per-exam configurable behavior violation limit.

alter table public.online_tests
  add column if not exists behavior_violation_limit integer
  not null default 3
  check (behavior_violation_limit > 0);

create index if not exists online_tests_behavior_violation_limit_idx
  on public.online_tests(behavior_violation_limit);
