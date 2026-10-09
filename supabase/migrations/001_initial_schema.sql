-- SAKETH FIT starter schema. Review policies and configure Supabase Auth before production.
create extension if not exists pgcrypto;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  water_goal_ml integer not null default 2500 check (water_goal_ml > 0),
  preferences jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null default current_date,
  plan_day smallint not null check (plan_day between 1 and 7),
  duration_minutes integer,
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);
create table if not exists public.exercise_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_name text not null,
  set_number integer not null check (set_number > 0),
  reps integer,
  weight_kg numeric(7,2),
  completed boolean not null default false
);
create table if not exists public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  eaten_at timestamptz not null default now(),
  meal_type text not null default 'snack',
  food_name text not null,
  portion text,
  calories numeric(8,2),
  protein_g numeric(8,2),
  carbs_g numeric(8,2),
  fat_g numeric(8,2),
  is_estimate boolean not null default true
);
create table if not exists public.hydration_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consumed_at timestamptz not null default now(),
  amount_ml integer not null check (amount_ml > 0)
);
create table if not exists public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  weight_kg numeric(6,2),
  height_cm numeric(6,2),
  shoulder_cm numeric(6,2),
  waist_cm numeric(6,2),
  chest_cm numeric(6,2),
  arm_cm numeric(6,2),
  thigh_cm numeric(6,2)
);
create table if not exists public.recovery_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  sleep_hours numeric(4,2),
  walking_minutes integer,
  mobility_minutes integer,
  notes text
);
create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.generated_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in ('daily','weekly','monthly')),
  period_start date not null,
  period_end date not null,
  metrics jsonb not null default '{}'::jsonb,
  ai_summary text,
  created_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_date_idx on public.workout_sessions(user_id, workout_date desc);
create index if not exists food_logs_user_eaten_idx on public.food_logs(user_id, eaten_at desc);
create index if not exists hydration_logs_user_consumed_idx on public.hydration_logs(user_id, consumed_at desc);
create index if not exists body_metrics_user_recorded_idx on public.body_metrics(user_id, recorded_at desc);
create index if not exists recovery_logs_user_recorded_idx on public.recovery_logs(user_id, recorded_at desc);

do $$ declare t text; begin
  foreach t in array array['user_settings','workout_sessions','exercise_sets','food_logs','hydration_logs','body_metrics','recovery_logs','ai_conversations','generated_reports'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "own rows only" on public.%I', t);
    execute format('create policy "own rows only" on public.%I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;
