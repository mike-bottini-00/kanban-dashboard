-- Add test_flag to tasks as boolean with default false
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS test_flag BOOLEAN NOT NULL DEFAULT FALSE;
