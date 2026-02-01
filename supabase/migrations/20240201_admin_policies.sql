-- Allow authenticated users to insert, update, delete on projects
CREATE POLICY "Enable insert for authenticated users on projects" ON public.projects
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on projects" ON public.projects
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users on projects" ON public.projects
FOR DELETE TO authenticated USING (true);

-- Allow authenticated users to insert, update, delete on posts
CREATE POLICY "Enable insert for authenticated users on posts" ON public.posts
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users on posts" ON public.posts
FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users on posts" ON public.posts
FOR DELETE TO authenticated USING (true);
