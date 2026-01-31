-- TaskFlow Database Schema
-- Secure by default with Row Level Security

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enum types
create type task_category as enum ('work', 'personal');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type import_source as enum ('manual', 'voice', 'gmail', 'whatsapp');

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text,
    full_name text,
    avatar_url text,
    preferences jsonb default '{
        "defaultCategory": "personal",
        "theme": "system",
        "voiceLanguage": "nl-NL"
    }'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tasks table
create table public.tasks (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null check (char_length(title) <= 500),
    description text default '' check (char_length(description) <= 5000),
    category task_category default 'personal' not null,
    priority task_priority default 'medium' not null,
    due_date timestamp with time zone,
    is_completed boolean default false not null,
    completed_at timestamp with time zone,
    import_source import_source default 'manual' not null,
    source_reference text check (char_length(source_reference) <= 500),
    tags text[] default '{}' check (array_length(tags, 1) <= 10),
    reminder_date timestamp with time zone,
    original_input text, -- Original voice/text input for reference
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Events table
create table public.events (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null check (char_length(title) <= 500),
    description text default '' check (char_length(description) <= 5000),
    category task_category default 'personal' not null,
    start_date timestamp with time zone not null,
    end_date timestamp with time zone not null,
    is_all_day boolean default false not null,
    location text check (char_length(location) <= 500),
    import_source import_source default 'manual' not null,
    source_reference text check (char_length(source_reference) <= 500),
    color text check (char_length(color) <= 20),
    reminder_minutes_before integer check (reminder_minutes_before >= 0 and reminder_minutes_before <= 10080),
    recurrence text check (recurrence in ('daily', 'weekly', 'biweekly', 'monthly', 'yearly', null)),
    attendees text[] default '{}' check (array_length(attendees, 1) <= 50),
    original_input text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint valid_date_range check (end_date >= start_date)
);

-- Indexes for performance
create index tasks_user_id_idx on public.tasks(user_id);
create index tasks_category_idx on public.tasks(category);
create index tasks_due_date_idx on public.tasks(due_date) where due_date is not null;
create index tasks_is_completed_idx on public.tasks(is_completed);
create index tasks_created_at_idx on public.tasks(created_at desc);
create index events_user_id_idx on public.events(user_id);
create index events_start_date_idx on public.events(start_date);
create index events_category_idx on public.events(category);

-- ============================================
-- ROW LEVEL SECURITY (RLS) - CRITICAL
-- Users can ONLY access their own data
-- ============================================

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.events enable row level security;

-- Profiles: users can only see/edit their own profile
create policy "Users can view own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Tasks: complete isolation per user
create policy "Users can view own tasks"
    on public.tasks for select
    using (auth.uid() = user_id);

create policy "Users can create own tasks"
    on public.tasks for insert
    with check (auth.uid() = user_id);

create policy "Users can update own tasks"
    on public.tasks for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own tasks"
    on public.tasks for delete
    using (auth.uid() = user_id);

-- Events: complete isolation per user
create policy "Users can view own events"
    on public.events for select
    using (auth.uid() = user_id);

create policy "Users can create own events"
    on public.events for insert
    with check (auth.uid() = user_id);

create policy "Users can update own events"
    on public.events for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "Users can delete own events"
    on public.events for delete
    using (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

create trigger update_profiles_updated_at
    before update on public.profiles
    for each row execute procedure public.update_updated_at_column();

create trigger update_tasks_updated_at
    before update on public.tasks
    for each row execute procedure public.update_updated_at_column();

create trigger update_events_updated_at
    before update on public.events
    for each row execute procedure public.update_updated_at_column();

-- Rate limiting function (optional, call from edge functions)
create or replace function public.check_rate_limit(p_user_id uuid, p_action text, p_limit int, p_window interval)
returns boolean
language plpgsql
security definer
as $$
declare
    v_count int;
begin
    -- Simple rate limit check based on recent task/event creation
    if p_action = 'create_task' then
        select count(*) into v_count
        from public.tasks
        where user_id = p_user_id
        and created_at > now() - p_window;
    elsif p_action = 'create_event' then
        select count(*) into v_count
        from public.events
        where user_id = p_user_id
        and created_at > now() - p_window;
    else
        return true;
    end if;

    return v_count < p_limit;
end;
$$;

-- Enable realtime (only for authenticated users via RLS)
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.events;
