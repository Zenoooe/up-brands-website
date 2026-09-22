import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
const distIndexPath = path.join(distDir, 'index.html');

const FALLBACK_SUPABASE_URL = 'https://sbnnpbtvdvggpqesohxa.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNibm5wYnR2ZHZnZ3BxZXNvaHhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MzAyODIsImV4cCI6MjA4NTUwNjI4Mn0.fwnSWv-16PViCKdilH8We3F4aKX1xO47OjUkrkUzLZQ';
const SITE_URL = 'https://www.up-brands.com';
const DEFAULT_OG = `${SITE_URL}/og-image.svg`;
const DEFAULT_ROBOTS = 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function decodeHtmlEntities(input = '') {
  return String(input)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function escapeHtml(input = '') {
  return decodeHtmlEntities(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripMarkdown(input = '') {
  return decodeHtmlEntities(input)
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerpt(text = '', limit = 220) {
  const clean = stripMarkdown(text);
  return clean.length > limit ? `${clean.slice(0, limit - 1).trim()}...` : clean;
}

// Parses the JSON tag payload stored in `category` ({"services":[...],"industries":[...]})
// and returns a flat, human readable "A, B, C" string. Returns null when the value
// is not a JSON payload so callers can fall back to legacy string handling.
function parseCategoryTags(category) {
  const raw = String(category || '').trim();
  if (!raw.startsWith('{')) return null;

  try {
    const parsed = JSON.parse(raw);
    const services = Array.isArray(parsed?.services) ? parsed.services : [];
    const industries = Array.isArray(parsed?.industries) ? parsed.industries : [];
    return [...services, ...industries].filter(Boolean).join(', ');
  } catch {
    return null;
  }
}

function getDisplaySubtitle(project = {}) {
  const subtitle = String(project.subtitle || '').trim();
  if (subtitle) return subtitle;

  const rawCategory = String(project.category || '').trim();
  if (!rawCategory) return '';

  // JSON tag payloads are tags, not subtitles.
  if (rawCategory.startsWith('{')) return '';

  return /[|｜/]/.test(rawCategory) || rawCategory.length >= 24 ? rawCategory : '';
}

function getDisplayCategory(project = {}) {
  const rawCategory = String(project.category || '').trim();
  if (!rawCategory) return '';

  const tags = parseCategoryTags(rawCategory);
  if (tags !== null) return tags;

  return /[|｜/]/.test(rawCategory) || rawCategory.length >= 24 ? '' : rawCategory;
}

function routeUrl(routePath) {
  return new URL(routePath, SITE_URL).toString();
}

function localizedUrl(url, language) {
  const nextUrl = new URL(url);
  if (!language || language === 'en') {
    nextUrl.searchParams.delete('lng');
    return nextUrl.toString();
  }
  nextUrl.searchParams.set('lng', language);
  return nextUrl.toString();
}

function alternateLinks(url) {
  return [
    { hrefLang: 'x-default', href: localizedUrl(url, 'en') },
    { hrefLang: 'en', href: localizedUrl(url, 'en') },
    { hrefLang: 'zh-CN', href: localizedUrl(url, 'zh-CN') },
    { hrefLang: 'zh-TW', href: localizedUrl(url, 'zh-TW') },
  ]
    .map((item) => `<link rel="alternate" hrefLang="${item.hrefLang}" href="${escapeHtml(item.href)}" />`)
    .join('\n    ');
}

function updateTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function injectIntoHead(html, content) {
  return html.replace('</head>', `    ${content}\n  </head>`);
}

function replaceRoot(html, content) {
  return html.replace(/<div id="root">[\s\S]*?<\/div>\s*<\/body>/, `<div id="root">${content}</div>\n  </body>`);
}

function renderBaseHtml(
  template,
  { title, description, canonical, image = DEFAULT_OG, robots = DEFAULT_ROBOTS, body, schemas = [], ogType = 'website' },
) {
  let html = template;

  html = updateTag(html, /<html[^>]*lang="[^"]*"/i, '<html lang="en"');
  html = updateTag(html, /<title[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = updateTag(
    html,
    /<meta name="description" content="[^"]*"[^>]*>/i,
    `<meta name="description" content="${escapeHtml(description)}" />`,
  );
  html = updateTag(html, /<meta name="robots" content="[^"]*"[^>]*>/i, `<meta name="robots" content="${robots}" />`);
  html = updateTag(html, /<link rel="canonical" href="[^"]*"[^>]*>/i, `<link rel="canonical" href="${canonical}" />`);
  html = updateTag(html, /<meta property="og:title" content="[^"]*"[^>]*>/i, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  html = updateTag(
    html,
    /<meta property="og:description" content="[^"]*"[^>]*>/i,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
  );
  html = updateTag(html, /<meta property="og:image" content="[^"]*"[^>]*>/i, `<meta property="og:image" content="${escapeHtml(image)}" />`);
  html = updateTag(html, /<meta property="og:url" content="[^"]*"[^>]*>/i, `<meta property="og:url" content="${canonical}" />`);
  html = updateTag(html, /<meta property="og:type" content="[^"]*"[^>]*>/i, `<meta property="og:type" content="${ogType}" />`);
  html = updateTag(html, /<meta name="twitter:image" content="[^"]*"[^>]*>/i, `<meta name="twitter:image" content="${escapeHtml(image)}" />`);

  const twitterTitle = html.includes('name="twitter:title"')
    ? ''
    : `\n    <meta name="twitter:title" content="${escapeHtml(title)}" />`;
  const twitterDesc = html.includes('name="twitter:description"')
    ? ''
    : `\n    <meta name="twitter:description" content="${escapeHtml(description)}" />`;
  const alternates = alternateLinks(canonical);
  const schemaMarkup = schemas
    .map((schema) => `<script type="application/ld+json">${JSON.stringify(schema)}</script>`)
    .join('\n    ');

  html = injectIntoHead(
    html,
    `${alternates}${twitterTitle}${twitterDesc}${schemaMarkup ? `\n    ${schemaMarkup}` : ''}`,
  );

  return replaceRoot(html, body);
}

function pageChrome({ eyebrow, title, description, image, content, links = [], meta }) {
  const imageMarkup = image
    ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" style="width:100%;max-width:960px;aspect-ratio:16/9;object-fit:cover;border-radius:28px;border:1px solid #e5e5e5;background:#f5f5f5;" />`
    : '';
  const linksMarkup = links.length
    ? `<ul style="margin:32px 0 0;padding:0;list-style:none;display:grid;gap:16px;">${links
        .map(
          (link) =>
            `<li><a href="${escapeHtml(link.href)}" style="font-size:1.05rem;font-weight:700;color:#111;text-decoration:none;">${escapeHtml(link.label)}</a>${
              link.description
                ? `<p style="margin:8px 0 0;color:#555;line-height:1.6;">${escapeHtml(link.description)}</p>`
                : ''
            }</li>`,
        )
        .join('')}</ul>`
    : '';

  return `
      <main style="max-width:1080px;margin:0 auto;padding:56px 24px 96px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111;background:#fff;">
        <a href="/" style="display:inline-block;margin-bottom:28px;font-size:0.9rem;letter-spacing:0.16em;text-transform:uppercase;color:#666;text-decoration:none;">Up-Brands</a>
        ${eyebrow ? `<p style="margin:0 0 16px;font-size:0.82rem;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#8a8a8a;">${escapeHtml(eyebrow)}</p>` : ''}
        <h1 style="margin:0 0 18px;font-size:clamp(2.4rem,5vw,4.8rem);line-height:0.95;font-weight:900;text-transform:uppercase;">${escapeHtml(title)}</h1>
        ${meta ? `<p style="margin:0 0 18px;font-size:0.95rem;letter-spacing:0.08em;text-transform:uppercase;color:#777;">${escapeHtml(meta)}</p>` : ''}
        <p style="max-width:760px;margin:0 0 32px;font-size:1.12rem;line-height:1.8;color:#454545;">${escapeHtml(description)}</p>
        ${imageMarkup}
        <section style="max-width:860px;margin-top:36px;display:grid;gap:18px;font-size:1.05rem;line-height:1.85;color:#333;">
          ${content}
        </section>
        ${linksMarkup}
      </main>
    `;
}

function paragraphize(texts) {
  return texts
    .filter(Boolean)
    .map((text) => `<p style="margin:0;">${escapeHtml(text)}</p>`)
    .join('');
}

async function writeRoute(routePath, html) {
  const normalizedPath = routePath.replace(/^\/+/, '');
  const targetDir = path.join(distDir, normalizedPath);
  await mkdir(targetDir, { recursive: true });
  await writeFile(path.join(targetDir, 'index.html'), html, 'utf8');

  // Also emit a flat .html file so Vercel clean URLs can resolve
  // extensionless routes like /project/slug to /project/slug.html reliably.
  await writeFile(path.join(distDir, `${normalizedPath}.html`), html, 'utf8');
}

async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, slug, title, subtitle, category, description, description_en, imageUrl, backup_image_url, link, updated_at, is_visible, sort_order')
    .or('is_visible.eq.true,is_visible.is.null')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchPosts() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, title_en, title_zh, excerpt_en, excerpt_zh, content_en, content_zh, date, imageUrl, backup_image_url, author, tags, is_visible, sort_order')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true })
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

function homeSchemas(projects, posts) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Featured Projects',
      itemListElement: projects.slice(0, 8).map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: routeUrl(`/project/${project.slug || project.id}`),
        name: project.title,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Latest Insights',
      itemListElement: posts.slice(0, 3).map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: routeUrl(`/blog/${post.slug}`),
        name: post.title_en,
      })),
    },
  ];
}

async function run() {
  const template = await readFile(distIndexPath, 'utf8');
  let projects = [];
  let posts = [];

  try {
    [projects, posts] = await Promise.all([fetchProjects(), fetchPosts()]);
    console.log(`Prerender data loaded: ${projects.length} projects, ${posts.length} posts.`);
  } catch (error) {
    console.warn('Prerender data fetch failed, generating core static pages only.', error);
  }

  const homeHtml = renderBaseHtml(template, {
    title: 'Up-Brands™上游文创 | Brand Strategy & Creative Design',
    description:
      'Up-Brands is a bilingual brand strategy and creative design agency serving the Greater Bay Area with visual identity, packaging, and digital marketing expertise.',
    canonical: routeUrl('/'),
    image: DEFAULT_OG,
    schemas: homeSchemas(projects, posts),
    body: pageChrome({
      eyebrow: 'Brand Strategy • Creative Design • Digital Growth',
      title: 'Up-Brands™上游文创',
      description:
        'We help ambitious brands in the Greater Bay Area build sharper positioning, stronger visual systems, and launch-ready creative assets in both English and Chinese.',
      image: projects[0]?.backup_image_url || projects[0]?.imageUrl || DEFAULT_OG,
      content: paragraphize([
        'Up-Brands partners with founders, hospitality groups, lifestyle brands, food businesses, and premium product teams that need strategy, visual identity, packaging, and digital execution to feel coherent from first touch to final conversion.',
        'Our work spans brand strategy, visual identity, packaging systems, marketing campaigns, and content design for businesses targeting local, regional, and cross-border growth.',
      ]),
      links: [
        ...projects.slice(0, 6).map((project) => ({
          href: `/project/${project.slug || project.id}`,
          label: project.title,
          description: excerpt(project.description_en || project.description || getDisplaySubtitle(project) || getDisplayCategory(project), 120),
        })),
        ...posts.slice(0, 3).map((post) => ({
          href: `/blog/${post.slug}`,
          label: post.title_en || post.title_zh,
          description: excerpt(post.excerpt_en || post.excerpt_zh, 120),
        })),
      ],
    }),
  });

  await writeFile(distIndexPath, homeHtml, 'utf8');

  const aboutHtml = renderBaseHtml(template, {
    title: 'About Up-Brands | Brand Enhancement Experts',
    description:
      'Learn how Up-Brands combines brand strategy, creative vision, and digital marketing to help Greater Bay Area businesses grow with clearer positioning and stronger design systems.',
    canonical: routeUrl('/about'),
    image: DEFAULT_OG,
    schemas: [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About Up-Brands',
        url: routeUrl('/about'),
      },
    ],
    body: pageChrome({
      eyebrow: 'About',
      title: 'About Up-Brands',
      description:
        'Up-Brands builds executable brand systems for companies that need strategy, visual clarity, and marketing momentum across Chinese and international audiences.',
      content: paragraphize([
        'Our process connects brand diagnosis, strategic positioning, visual direction, and campaign-ready design so teams can move from fragmented communication to one cohesive identity.',
        'We work from Zhuhai and support businesses across Shenzhen, Guangzhou, Hong Kong, Macau, and wider international markets through bilingual delivery and brand systems that are ready for real commercial use.',
      ]),
      links: [
        { href: '/', label: 'Browse selected projects', description: 'See recent branding, packaging, and visual identity work.' },
        { href: '/blog', label: 'Read brand insights', description: 'Explore articles on strategy, design systems, and market positioning.' },
      ],
    }),
  });

  await writeRoute('/about', aboutHtml);

  const blogIndexHtml = renderBaseHtml(template, {
    title: 'Brand Insights | Up-Brands Blog',
    description:
      'Read bilingual insights from Up-Brands on brand strategy, visual identity, packaging design, and digital growth for businesses in the Greater Bay Area and beyond.',
    canonical: routeUrl('/blog'),
    image: posts[0]?.backup_image_url || posts[0]?.imageUrl || DEFAULT_OG,
    body: pageChrome({
      eyebrow: 'Insights',
      title: 'Brand Insights',
      description:
        'A growing library of bilingual essays and case-driven thinking on brand strategy, visual identity, packaging, and business growth.',
      content: paragraphize([
        'These articles translate real client work into practical thinking about brand systems, audience positioning, packaging direction, and the design choices that help companies look more valuable and act with more clarity.',
      ]),
      links: posts.map((post) => ({
        href: `/blog/${post.slug}`,
        label: post.title_en || post.title_zh,
        description: excerpt(post.excerpt_en || post.excerpt_zh, 150),
      })),
    }),
  });

  await writeRoute('/blog', blogIndexHtml);

  for (const post of posts) {
    const postUrl = routeUrl(`/blog/${post.slug}`);
    const body = pageChrome({
      eyebrow: 'Article',
      title: post.title_en || post.title_zh,
      meta: `${post.date || ''}${post.author ? ` • ${post.author}` : ''}`,
      description: post.excerpt_en || post.excerpt_zh || 'Up-Brands article',
      image: post.backup_image_url || post.imageUrl || DEFAULT_OG,
      content: paragraphize([
        excerpt(post.content_en, 600),
        excerpt(post.content_zh, 600),
      ]),
      links: [{ href: '/blog', label: 'Back to all insights', description: 'Browse more strategy, design, and branding articles.' }],
    });

    const html = renderBaseHtml(template, {
      title: `${post.title_en || post.title_zh} | Up-Brands`,
      description: post.excerpt_en || post.excerpt_zh || 'Up-Brands article',
      canonical: postUrl,
      image: post.backup_image_url || post.imageUrl || DEFAULT_OG,
      ogType: 'article',
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title_en || post.title_zh,
          description: post.excerpt_en || post.excerpt_zh,
          image: [post.backup_image_url || post.imageUrl || DEFAULT_OG],
          datePublished: post.date,
          author: {
            '@type': 'Person',
            name: post.author || 'Up-Brands Team',
          },
          mainEntityOfPage: postUrl,
        },
      ],
      body,
    });

    await writeRoute(`/blog/${post.slug}`, html);
  }

  for (const project of projects) {
    const slugOrId = project.slug || project.id;
    const canonical = routeUrl(`/project/${slugOrId}`);
    const image = project.backup_image_url || project.imageUrl || DEFAULT_OG;
    const description =
      project.description_en || project.description || `${project.title} is an Up-Brands brand strategy and creative design case study.`;
    const displaySubtitle = getDisplaySubtitle(project);
    const displayCategory = getDisplayCategory(project);
    const body = pageChrome({
      eyebrow: displaySubtitle || displayCategory || 'Project',
      title: project.title,
      description: excerpt(description, 220),
      image,
      content: paragraphize([
        excerpt(project.description_en, 700),
        excerpt(project.description, 700),
      ]),
      links: [
        project.link ? { href: project.link, label: 'View on Behance', description: 'See the original case study and additional visual assets.' } : null,
        { href: '/', label: 'Browse more projects', description: 'Explore more branding, packaging, and visual identity work.' },
      ].filter(Boolean),
    });

    const html = renderBaseHtml(template, {
      title: `${project.title} | Up-Brands`,
      description: excerpt(description, 180),
      canonical,
      image,
      ogType: 'article',
      schemas: [
        {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          name: project.title,
          description: excerpt(description, 320),
          image,
          url: canonical,
          genre: displayCategory || displaySubtitle,
        },
      ],
      body,
    });

    await writeRoute(`/project/${slugOrId}`, html);
    if (project.slug && project.id && project.slug !== project.id) {
      await writeRoute(`/project/${project.id}`, html);
    }
  }

  const notFoundHtml = renderBaseHtml(template, {
    title: '404 | Up-Brands',
    description: 'The page you are looking for could not be found.',
    canonical: routeUrl('/404'),
    robots: 'noindex, follow',
    body: pageChrome({
      eyebrow: '404',
      title: 'Page Not Found',
      description: 'The link you requested is unavailable or has moved. You can return home or continue exploring recent work and insights.',
      content: paragraphize([
        'We have kept the route structure clean, but sometimes old or mistyped URLs still appear in bookmarks, crawlers, or shared links.',
      ]),
      links: [
        { href: '/', label: 'Back to Home', description: 'Return to the Up-Brands homepage.' },
        { href: '/blog', label: 'Browse Insights', description: 'Read our latest articles on branding and design.' },
      ],
    }),
  });

  await writeFile(path.join(distDir, '404.html'), notFoundHtml, 'utf8');
  console.log('Prerendered static route snapshots generated.');
}

run().catch((error) => {
  console.error('Failed to generate prerendered routes:', error);
  process.exitCode = 1;
});
