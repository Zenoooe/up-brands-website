import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, title, slug, updated_at, is_visible')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  console.log('Projects in DB:');
  data.forEach(p => {
    console.log(`Title: ${p.title}, Slug: ${p.slug}, ID: ${p.id}, Visible: ${p.is_visible}, Updated: ${p.updated_at}`);
  });
}

checkProjects();
