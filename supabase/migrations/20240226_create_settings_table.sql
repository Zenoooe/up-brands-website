
-- Create settings table
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to settings" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated users to update settings" ON public.settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert settings" ON public.settings;

-- Create policies
CREATE POLICY "Allow public read access to settings" ON public.settings
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to update settings" ON public.settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert settings" ON public.settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO public.settings (key, value, description)
VALUES 
    ('hero_interaction', '{"enable_click_spawn": true}', 'Settings for the hero section interaction')
ON CONFLICT (key) DO NOTHING;
