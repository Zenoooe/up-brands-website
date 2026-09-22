import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
const supabaseUrl = 'https://sbnnpbtvdvggpqesohxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibm5wYnR2ZHZnZ3BxZXNvaHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzAyODIsImV4cCI6MjA4NTUwNjI4Mn0.fwnSWv-16PViCKdilH8We3F4aKX1xO47OjUkrkUzLZQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: projects } = await supabase.from('projects').select('id, title, description_en').order('created_at', { ascending: false });
  fs.writeFileSync('projects.json', JSON.stringify(projects, null, 2));
  console.log("Written", projects.length, "projects");
}
run();
