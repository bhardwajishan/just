-- ============================================================
-- Suite Compile — full reference schema
-- This file is for reference only. Do NOT re-run against production.
-- Run migrations from supabase/migrations/ instead.
-- ============================================================

create extension if not exists "pgcrypto";

-- ============================================================
-- projects
-- ============================================================
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now()
);

alter table projects enable row level security;

create policy "Users can manage their own projects"
  on projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- modules
-- ============================================================
create table if not exists modules (
  id                   uuid primary key default gen_random_uuid(),
  project_id           uuid not null references projects(id) on delete cascade,
  name                 text not null,
  status               text not null default 'draft',
  prd_text             text,
  figma_url            text,
  figma_description    text,
  flow_description     text,
  desired_count        int not null default 10,
  coverage_areas       text[] not null default '{}',
  -- New columns (migration: 005_figma_and_multi_prd.sql)
  figma_access_token   text,          -- AES-256-GCM encrypted token, server-side only
  figma_input_type     text,          -- 'url' | 'pdf' | 'screenshot' | null
  figma_file_paths     text[],        -- Supabase storage paths for pdf/screenshot uploads
  prd_file_paths       text[],        -- storage paths for all uploaded PRD files
  prd_texts            text[],        -- extracted text per PRD file (parallel to prd_file_paths)
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table modules enable row level security;

create policy "Users can manage modules in their projects"
  on modules for all
  using (
    exists (
      select 1 from projects p
      where p.id = modules.project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from projects p
      where p.id = modules.project_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- test_cases
-- ============================================================
create table if not exists test_cases (
  id              text not null,
  module_id       uuid not null references modules(id) on delete cascade,
  title           text not null,
  preconditions   text[] not null default '{}',
  steps           text[] not null default '{}',
  expected_result text not null,
  priority        text not null default 'Medium',
  type            text not null default 'Functional',
  version         int not null default 1,
  created_at      timestamptz not null default now(),
  primary key (id, module_id)
);

alter table test_cases enable row level security;

create policy "Users can manage test cases in their modules"
  on test_cases for all
  using (
    exists (
      select 1 from modules m
      join projects p on p.id = m.project_id
      where m.id = test_cases.module_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from modules m
      join projects p on p.id = m.project_id
      where m.id = test_cases.module_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- chat_messages
-- ============================================================
create table if not exists chat_messages (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references modules(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table chat_messages enable row level security;

create policy "Users can manage chat messages in their modules"
  on chat_messages for all
  using (
    exists (
      select 1 from modules m
      join projects p on p.id = m.project_id
      where m.id = chat_messages.module_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from modules m
      join projects p on p.id = m.project_id
      where m.id = chat_messages.module_id and p.user_id = auth.uid()
    )
  );

-- ============================================================
-- profiles (from 003_profiles_and_plans.sql)
-- ============================================================
create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  plan       text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can read their own profile"
  on profiles for select using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger modules_updated_at
  before update on modules
  for each row execute function update_updated_at_column();
