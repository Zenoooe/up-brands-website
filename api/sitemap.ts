import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Support both Vercel Integration env vars and Vite-style env vars
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://www.up-brands.com';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Debug: Log availability (do not log actual keys)
  // We prefer standard SUPABASE_URL without VITE_ prefix for backend
  // Note: Vercel environment variables are process.env properties
  const availableKeys = Object.keys(process.env);
  console.log('API Sitemap: Checking Env Vars. Available keys count:', availableKeys.length);
  
  const hasUrl = !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const hasKey = !!(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY);

  if (!hasUrl || !hasKey) {
    console.error('Sitemap Configuration Error: Missing Env Vars');
    console.error('Available Env Keys:', availableKeys);
    
    return res.status(500).json({ 
      error: 'Configuration Error', 
      message: 'Environment variables are missing on the server.',
      suggestion: 'Please add SUPABASE_URL and SUPABASE_ANON_KEY to Vercel Environment Variables.',
      debug: { 
        missingUrl: !hasUrl, 
        missingKey: !hasKey,
        availableKeysSample: availableKeys // Show all keys for now to debug
      } 
    });
  }

  const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) as string;
  const SUPABASE_KEY = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) as string;

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Fetch projects with updated_at
    // We check for is_visible is NOT false (so true or null/undefined are included if default is true)
    // But safer to just check eq true if we trust the default. 
    // Let's use .or to be safe: is_visible.eq.true,is_visible.is.null
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, slug, created_at, updated_at, is_visible')
      .or('is_visible.eq.true,is_visible.is.null');

    if (projectsError) throw projectsError;

    // Fetch blog posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('slug, created_at, updated_at, date, is_visible')
      .or('is_visible.eq.true,is_visible.is.null');

    if (postsError) throw postsError;

    // Static Routes
    const staticRoutes = [
      { url: '', priority: '1.0', changefreq: 'weekly' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/blog', priority: '0.8', changefreq: 'weekly' },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add Static Routes
    // Use the latest content update as the lastmod for static pages to signal freshness
    const allItems: any[] = [...(projects || []), ...(posts || [])];
    const latestUpdate = allItems.length 
      ? allItems.reduce((max, item) => {
          const date = new Date(item.updated_at || item.created_at || item.date || 0);
          return date > max ? date : max;
        }, new Date(0))
      : new Date();
    
    const latestDateStr = latestUpdate.toISOString().split('T')[0];

    staticRoutes.forEach(route => {
      xml += `
  <url>
    <loc>${SITE_URL}${route.url}</loc>
    <lastmod>${latestDateStr}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    });

    // Add Dynamic Project Routes
    projects?.forEach(project => {
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

    // Add Dynamic Blog Post Routes
    posts?.forEach(post => {
      const lastMod = post.updated_at || post.date || post.created_at || new Date().toISOString();
      
      xml += `
  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${new Date(lastMod).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    xml += `
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    // Disable caching to ensure immediate updates
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=0, must-revalidate');
    res.status(200).send(xml);

  } catch (e: any) {
    console.error('Sitemap Generation Error:', e);
    res.status(500).json({ error: 'Failed to generate sitemap', details: e.message });
  }
}
