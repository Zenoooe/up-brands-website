import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://sbnnpbtvdvggpqesohxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibm5wYnR2ZHZnZ3BxZXNvaHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzAyODIsImV4cCI6MjA4NTUwNjI4Mn0.fwnSWv-16PViCKdilH8We3F4aKX1xO47OjUkrkUzLZQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyze() {
  const { data: projects, error: pErr } = await supabase.from('projects').select('id, title, category, description_en');
  if (pErr) console.error("Projects error:", pErr);
  
  console.log(`Found ${projects?.length} projects.`);
  if (projects && projects.length > 0) {
    projects.forEach(p => {
      console.log(`- ${p.title} | Current Category: ${p.category}`);
    });
  }
}
analyze();
