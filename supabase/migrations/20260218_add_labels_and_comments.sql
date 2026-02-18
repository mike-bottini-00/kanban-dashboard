-- Add labels to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS labels TEXT[] NOT NULL DEFAULT '{}';

-- Create task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author TEXT NOT NULL CHECK (author IN ('walter', 'mike', 'gilfoyle', 'dinesh')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

-- Keep updated_at in sync for task_comments
DROP TRIGGER IF EXISTS trg_task_comments_updated_at ON task_comments;
CREATE TRIGGER trg_task_comments_updated_at
BEFORE UPDATE ON task_comments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
