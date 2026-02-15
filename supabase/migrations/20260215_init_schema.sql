-- Kanban Items Table
CREATE TABLE IF NOT EXISTS kanban_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id BIGINT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL,
    repository_name TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- Move Metrics Table (Batch 2)
CREATE TABLE IF NOT EXISTS move_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id BIGINT NOT NULL,
    to_status TEXT NOT NULL,
    triggered_by TEXT NOT NULL, -- 'github_webhook', 'api_patch'
    repository TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for throughput calculation
CREATE INDEX IF NOT EXISTS idx_move_metrics_created_at ON move_metrics(created_at);

