-- Ensure due_date exists on tasks as nullable timestamptz (default NULL)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ DEFAULT NULL;
