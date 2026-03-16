-- ── User profiles ────────────────────────────────────────────────────────────
create table if not exists user_profiles (
  id                  uuid primary key references auth.users on delete cascade,
  full_name           text,
  job_title           text,          -- QA Engineer | QA Lead | Product Manager | Developer | Other
  company_name        text,
  company_size        text,          -- 1-10 | 11-50 | 51-200 | 201-1000 | 1000+
  primary_use_case    text,          -- Manual Testing | Automation | Both
  how_did_you_hear    text,          -- Google | LinkedIn | Friend | Twitter/X | Other
  onboarding_completed boolean default false,
  plan                text default 'free',   -- free | pro
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── Usage counters ────────────────────────────────────────────────────────────
create table if not exists usage_counters (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid references auth.users on delete cascade unique,
  projects_created        int default 0,
  modules_created         int default 0,
  test_cases_generated    int default 0,   -- lifetime total
  test_cases_today        int default 0,   -- resets each calendar day
  test_cases_date         date default current_date, -- date of last daily write
  updated_at              timestamptz default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table user_profiles  enable row level security;
alter table usage_counters enable row level security;

do $$
begin
  -- user_profiles policies
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_profiles' and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile"
      on user_profiles for select using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'user_profiles' and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile"
      on user_profiles for update using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'user_profiles' and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile"
      on user_profiles for insert with check (auth.uid() = id);
  end if;

  -- usage_counters policies
  if not exists (
    select 1 from pg_policies
    where tablename = 'usage_counters' and policyname = 'Users can read own usage'
  ) then
    create policy "Users can read own usage"
      on usage_counters for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'usage_counters' and policyname = 'Users can update own usage'
  ) then
    create policy "Users can update own usage"
      on usage_counters for update using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'usage_counters' and policyname = 'Users can insert own usage'
  ) then
    create policy "Users can insert own usage"
      on usage_counters for insert with check (auth.uid() = user_id);
  end if;
end
$$;
