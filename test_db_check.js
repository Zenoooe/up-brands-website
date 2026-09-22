import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('title_zh, imageUrl, backup_image_url')
    .limit(3);
  console.log(posts);
}
check();
