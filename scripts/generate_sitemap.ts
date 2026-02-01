import { createClient } from '@supabase/supabase-js';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createWriteStream } from 'fs';
import { resolve } from 'path';
import 'dotenv/config';

// Load env from .env file for local script execution
// In production, these should be environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateSitemap() {
  const sitemap = new SitemapStream({ hostname: 'https://up-brands.com' });
  const writeStream = createWriteStream(resolve('public/sitemap.xml'));

  sitemap.pipe(writeStream);

  // Add static pages
  sitemap.write({ url: '/', changefreq: 'weekly', priority: 1.0 });
  sitemap.write({ url: '/about', changefreq: 'monthly', priority: 0.8 });
  sitemap.write({ url: '/blog', changefreq: 'daily', priority: 0.9 });

  // Add dynamic blog posts
  const { data: posts } = await supabase
    .from('posts')
    .select('slug, date');

  if (posts) {
    posts.forEach((post) => {
      sitemap.write({
        url: `/blog/${post.slug}`,
        changefreq: 'weekly',
        priority: 0.7,
        lastmod: post.date
      });
    });
  }

  sitemap.end();
  await streamToPromise(sitemap);
  console.log('Sitemap generated successfully!');
}

generateSitemap();
