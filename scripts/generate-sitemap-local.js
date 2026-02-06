import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://www.up-brands.com';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateLocalSitemap() {
  console.log('Generating local sitemap for verification...');

  // Static routes
  const staticRoutes = [
    { url: '', priority: '1.0', changefreq: 'weekly' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' },
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Add static routes
  staticRoutes.forEach(route => {
    xml += `
  <url>
    <loc>${SITE_URL}${route.url}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  });

  // Fetch projects
  try {
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, slug, created_at, updated_at')
      .eq('is_visible', true);

    if (projectsError) console.error('Error fetching projects:', projectsError);

    // Fetch blog posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('slug, created_at, updated_at, date')
      .eq('is_visible', true);

    if (postsError) console.error('Error fetching posts:', postsError);

    if (projects) {
      console.log(`Found ${projects.length} visible projects.`);
      projects.forEach(project => {
        const slug = project.slug || project.id;
        const lastMod = project.updated_at || project.created_at || new Date().toISOString();
        
        xml += `
  <url>
    <loc>${SITE_URL}/project/${slug}</loc>
    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
      });
    }

    if (posts) {
      console.log(`Found ${posts.length} visible posts.`);
      posts.forEach(post => {
        const lastMod = post.updated_at || post.date || post.created_at || new Date().toISOString();
        
        xml += `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    }

  } catch (e) {
    console.error('Exception fetching data:', e);
  }

  xml += `
</urlset>`;

  const publicDir = path.resolve(__dirname, '../public');
  
  if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
  
  console.log(`✅ Local Sitemap generated at ${path.join(publicDir, 'sitemap.xml')}`);
  console.log('👉 You can now view it at http://localhost:5173/sitemap.xml');
}

generateLocalSitemap();
