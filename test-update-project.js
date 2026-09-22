import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://sbnnpbtvdvggpqesohxa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibm5wYnR2ZHZnZ3BxZXNvaHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzAyODIsImV4cCI6MjA4NTUwNjI4Mn0.fwnSWv-16PViCKdilH8We3F4aKX1xO47OjUkrkUzLZQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  const { data: project } = await supabase.from('projects').select('id, category').limit(1).single();
  console.log("Current:", project);
  
  if (project) {
    const { data, error } = await supabase.from('projects').update({ category: project.category }).eq('id', project.id).select();
    console.log("Update result:", data, error);
  }
}
test();
