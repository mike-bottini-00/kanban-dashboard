-- Add scheduled_for to tasks as nullable timestamptz (default NULL)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ DEFAULT NULL;

-- Optional index for future scheduling queries
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_for ON public.tasks(scheduled_for);
