-- ── Remove automation_runs column ────────────────────────────────────────────
alter table usage_counters
  drop column if exists automation_runs;

-- ── Add daily test-case tracking columns ─────────────────────────────────────
alter table usage_counters
  add column if not exists test_cases_today int not null default 0;

alter table usage_counters
  add column if not exists test_cases_date date not null default current_date;

-- ── Back-fill existing rows so the date is set correctly ─────────────────────
update usage_counters
set test_cases_today = 0,
    test_cases_date  = current_date
where test_cases_date is null;
