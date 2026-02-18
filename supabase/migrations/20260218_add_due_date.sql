-- Add due_date to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Index for due_date searches (useful for calendar/reminders)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
