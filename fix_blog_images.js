import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBlogImages() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title_zh, imageUrl, backup_image_url');
    
  if (error) {
    console.error("Error fetching posts:", error);
    return;
  }
  
  console.log(`Found ${posts.length} posts.`);
  
  let updateCount = 0;
  for (const post of posts) {
    if (post.backup_image_url && post.backup_image_url.includes('supabase.co')) {
      console.log(`Updating post: ${post.title_zh}`);
      console.log(`  - Old backup_image_url: ${post.backup_image_url}`);
      console.log(`  - Will fallback to imageUrl: ${post.imageUrl}`);
      
      const { error: updateError } = await supabase
        .from('posts')
        .update({ backup_image_url: null })
        .eq('id', post.id);
        
      if (updateError) {
        console.error(`Failed to update post ${post.id}:`, updateError);
      } else {
        console.log(`  - Successfully cleared backup_image_url`);
        updateCount++;
      }
    } else if (!post.imageUrl && !post.backup_image_url) {
      console.log(`Post missing images completely: ${post.title_zh}`);
    } else {
      console.log(`Post OK: ${post.title_zh} (imageUrl: ${post.imageUrl})`);
    }
  }
  
  console.log(`\nFixed ${updateCount} posts.`);
}

fixBlogImages();
