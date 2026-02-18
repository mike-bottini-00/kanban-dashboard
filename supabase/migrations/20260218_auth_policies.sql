-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Simple Policy: All authenticated users can read and write for now
-- (In a real scenario, we would restrict by project membership)

CREATE POLICY "Allow authenticated read on projects" ON projects
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on tasks" ON tasks
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated update on tasks" ON tasks
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on task_comments" ON task_comments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read on task_comments" ON task_comments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on notifications" ON notifications
    FOR SELECT TO authenticated USING (user_id = auth.jwt() ->> 'email' OR user_id = auth.uid()::text);
