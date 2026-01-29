-- Flowday Initial Schema
-- Creates the core tables for the task and calendar application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== User Profiles ====================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  default_workspace_id UUID,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  language TEXT DEFAULT 'nl',
  timezone TEXT DEFAULT 'Europe/Amsterdam',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Workspaces ====================
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('work', 'private')),
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Add foreign key for default workspace after workspaces table exists
ALTER TABLE user_profiles
  ADD CONSTRAINT fk_default_workspace
  FOREIGN KEY (default_workspace_id)
  REFERENCES workspaces(id) ON DELETE SET NULL;

-- ==================== Projects ====================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Labels ====================
CREATE TABLE IF NOT EXISTS labels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Tasks ====================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('high', 'normal', 'low')) DEFAULT 'normal',
  status TEXT CHECK (status IN ('open', 'in_progress', 'completed')) DEFAULT 'open',
  deadline TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  recurrence_rule TEXT,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Task Labels (Many-to-Many) ====================
CREATE TABLE IF NOT EXISTS task_labels (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  label_id UUID REFERENCES labels(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, label_id)
);

-- ==================== Calendar Events ====================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  location TEXT,
  recurrence_rule TEXT,
  parent_event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  google_event_id TEXT,
  sync_status TEXT CHECK (sync_status IN ('local', 'synced', 'pending', 'conflict')) DEFAULT 'local',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==================== Google Calendar Connections ====================
CREATE TABLE IF NOT EXISTS calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  google_calendar_id TEXT NOT NULL,
  google_refresh_token TEXT NOT NULL,
  sync_direction TEXT CHECK (sync_direction IN ('both', 'pull_only', 'push_only')) DEFAULT 'both',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, google_calendar_id)
);

-- ==================== Indexes ====================
CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_labels_workspace_id ON labels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_id ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_events_workspace_id ON events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_google_event_id ON events(google_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_id ON calendar_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_workspace_id ON calendar_connections(workspace_id);

-- ==================== Row Level Security ====================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Workspaces Policies
CREATE POLICY "Users can view own workspaces" ON workspaces
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workspaces" ON workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workspaces" ON workspaces
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workspaces" ON workspaces
  FOR DELETE USING (auth.uid() = user_id);

-- Projects Policies
CREATE POLICY "Users can view projects in own workspaces" ON projects
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create projects in own workspaces" ON projects
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update projects in own workspaces" ON projects
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete projects in own workspaces" ON projects
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- Labels Policies
CREATE POLICY "Users can view labels in own workspaces" ON labels
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create labels in own workspaces" ON labels
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update labels in own workspaces" ON labels
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete labels in own workspaces" ON labels
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- Tasks Policies
CREATE POLICY "Users can view tasks in own workspaces" ON tasks
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create tasks in own workspaces" ON tasks
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update tasks in own workspaces" ON tasks
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete tasks in own workspaces" ON tasks
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- Task Labels Policies
CREATE POLICY "Users can view task labels in own workspaces" ON task_labels
  FOR SELECT USING (
    task_id IN (
      SELECT id FROM tasks WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );
CREATE POLICY "Users can manage task labels in own workspaces" ON task_labels
  FOR ALL USING (
    task_id IN (
      SELECT id FROM tasks WHERE workspace_id IN (
        SELECT id FROM workspaces WHERE user_id = auth.uid()
      )
    )
  );

-- Events Policies
CREATE POLICY "Users can view events in own workspaces" ON events
  FOR SELECT USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can create events in own workspaces" ON events
  FOR INSERT WITH CHECK (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update events in own workspaces" ON events
  FOR UPDATE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete events in own workspaces" ON events
  FOR DELETE USING (
    workspace_id IN (SELECT id FROM workspaces WHERE user_id = auth.uid())
  );

-- Calendar Connections Policies
CREATE POLICY "Users can view own calendar connections" ON calendar_connections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own calendar connections" ON calendar_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar connections" ON calendar_connections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar connections" ON calendar_connections
  FOR DELETE USING (auth.uid() = user_id);

-- ==================== Functions ====================

-- Function to automatically create user profile and default workspaces on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  work_workspace_id UUID;
  private_workspace_id UUID;
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  -- Create work workspace
  INSERT INTO workspaces (user_id, name, type, color, icon)
  VALUES (NEW.id, 'Werk', 'work', '#007AFF', 'briefcase.fill')
  RETURNING id INTO work_workspace_id;

  -- Create private workspace
  INSERT INTO workspaces (user_id, name, type, color, icon)
  VALUES (NEW.id, 'Privé', 'private', '#34C759', 'house.fill')
  RETURNING id INTO private_workspace_id;

  -- Set default workspace to private
  UPDATE user_profiles
  SET default_workspace_id = private_workspace_id
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
