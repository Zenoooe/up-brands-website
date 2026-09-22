import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title_zh, content_zh');
    
  if (error) {
    console.error(error);
    return;
  }
  
  for (const post of posts) {
    if (post.content_zh && (post.content_zh.includes('<img') || post.content_zh.includes('!['))) {
      console.log(`Post: ${post.title_zh}`);
      // find image URLs
      const imgRegex = /<img[^>]+src="([^">]+)"/g;
      let match;
      while ((match = imgRegex.exec(post.content_zh)) !== null) {
        console.log(`  img src: ${match[1]}`);
      }
      
      const mdRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
      while ((match = mdRegex.exec(post.content_zh)) !== null) {
        console.log(`  md img: ${match[1]}`);
      }
    }
  }
}
test();
