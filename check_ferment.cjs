
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sbnnpbtvdvggpqesohxa.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibm5wYnR2ZHZnZ3BxZXNvaHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzAyODIsImV4cCI6MjA4NTUwNjI4Mn0.fwnSWv-16PViCKdilH8We3F4aKX1xO47OjUkrkUzLZQ';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkProject() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, is_visible')
    .ilike('title', '%ferment%');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Found projects matching "ferment":', data);
  }
}

checkProject();
