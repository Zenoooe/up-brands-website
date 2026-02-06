import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = 'https://www.up-brands.com';

export default async function handler(req, res) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // Fetch projects with updated_at
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, slug, created_at, updated_at')
      .eq('is_visible', true);

    if (projectsError) throw projectsError;

    // Fetch blog posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('slug, created_at, updated_at, date')
      .eq('is_visible', true);

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
    // For static routes, we use the latest project update time as a proxy for site freshness
    const latestUpdate = projects?.length 
      ? projects.reduce((max, p) => {
          const date = new Date(p.updated_at || p.created_at);
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

  } catch (e) {
    console.error('Sitemap Error:', e);
    res.status(500).end();
  }
}
