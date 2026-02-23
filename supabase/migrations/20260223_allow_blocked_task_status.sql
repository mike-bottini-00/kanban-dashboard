-- Allow 'blocked' in tasks.status CHECK constraint.
-- Recreate canonical status CHECK constraint to avoid drift across environments.
DO $$
DECLARE
  constraint_row RECORD;
BEGIN
  FOR constraint_row IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.tasks'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.tasks DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;

  ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('todo', 'in_progress', 'review', 'blocked', 'done', 'archived'));
END
$$;
