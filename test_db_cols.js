import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Try to insert a dummy record with a 'services' field to see if it complains
  const { error } = await supabase.from('projects').update({ services: [] }).eq('id', 'nonexistent');
  console.log("Update services error:", error);
}
test();
