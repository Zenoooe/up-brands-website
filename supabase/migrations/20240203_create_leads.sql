-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_info TEXT NOT NULL,
    message TEXT,
    source TEXT DEFAULT 'chat_widget',
    status TEXT DEFAULT 'new', -- new, contacted, closed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow insert from public (for now, or restrict to anon role)
CREATE POLICY "Allow public insert" ON leads FOR INSERT WITH CHECK (true);

-- Allow select only for authenticated users (admin)
CREATE POLICY "Allow admin select" ON leads FOR SELECT USING (auth.role() = 'authenticated');
