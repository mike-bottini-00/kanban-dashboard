-- Canonical schema for Kanban Dashboard
-- Direction chosen: projects/tasks are the source of truth for board data.
-- Metrics/logging tables are kept for backend telemetry.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks (board items)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,

    -- Optional GitHub linkage
    github_external_id BIGINT UNIQUE,
    github_issue_number INTEGER,
    repository_name TEXT,

    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'blocked', 'done', 'archived')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assignee TEXT NOT NULL DEFAULT 'unassigned' CHECK (assignee IN ('walter', 'mike', 'gilfoyle', 'dinesh', 'unassigned')),
    position DOUBLE PRECISION NOT NULL DEFAULT 1000,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    labels TEXT[] NOT NULL DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON tasks(position);
CREATE INDEX IF NOT EXISTS idx_tasks_repository_issue ON tasks(repository_name, github_issue_number);

-- Seed a default project for empty databases
INSERT INTO projects (name, slug)
VALUES ('Kanban Dashboard', 'kanban-dashboard')
ON CONFLICT (slug) DO NOTHING;

-- PR Metrics Table
CREATE TABLE IF NOT EXISTS pr_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_id BIGINT UNIQUE NOT NULL,
    repository TEXT NOT NULL,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    merged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Agent Run Logs Table
CREATE TABLE IF NOT EXISTS agent_run_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    task_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failure', 'in-progress'
    payload JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- Move Metrics Table
CREATE TABLE IF NOT EXISTS move_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id BIGINT NOT NULL,
    to_status TEXT NOT NULL,
    triggered_by TEXT NOT NULL, -- 'github_webhook', 'api_patch'
    repository TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_move_metrics_created_at ON move_metrics(created_at);

-- Keep updated_at in sync
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_updated_at ON projects;
CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
