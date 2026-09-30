import { Layout } from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePost } from '../hooks/usePosts';
import { SEO } from '../components/common/SEO';
import { Link, useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getBlogImageAlt, getCanonicalUrl } from '../utils/seo';
import { getSupabaseUrl, getValidImageUrl } from '../utils/image';
import { convertChinese } from '../utils/zhConvert';

type Heading = { id: string; text: string; level: number };

const slugifyHeading = (text: string) =>
  'h-' + text.trim().toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g, '-').replace(/^-+|-+$/g, '');

function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  let inCodeBlock = false;

  markdown.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) return;

    const match = /^(#{2,3})\s+(.+)$/.exec(trimmed);
    if (match) {
      const text = match[2].replace(/[*`_]/g, '').trim();
      headings.push({ id: slugifyHeading(text), text, level: match[1].length });
    }
  });

  return headings;
}

export default function BlogPost() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const { post, loading } = usePost(slug);
  const isZh = i18n.language.startsWith('zh');
  const isSimplified = isZh && !/(TW|HK|MO|Hant)/.test(i18n.language);
  const [convertedContent, setConvertedContent] = useState<{
    title: string;
    excerpt: string;
    content: string;
  } | null>(null);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const articleRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const rawTitle = post ? (isZh ? post.title_zh : post.title_en) : '';
  const rawExcerpt = post ? (isZh ? post.excerpt_zh : post.excerpt_en) : '';
  const rawContent = post ? (isZh ? post.content_zh : post.content_en) : '';

  useEffect(() => {
    let isMounted = true;

    if (!isZh || !post) {
      setConvertedContent(null);
      return () => {
        isMounted = false;
      };
    }

    const target = isSimplified ? 'simplified' : 'traditional';

    const convertPost = async () => {
      const [title, excerpt, content] = await Promise.all([
        convertChinese(rawTitle, target),
        convertChinese(rawExcerpt, target),
        convertChinese(rawContent, target),
      ]);

      if (isMounted) {
        setConvertedContent({ title, excerpt, content });
      }
    };

    void convertPost();

    return () => {
      isMounted = false;
    };
  }, [isSimplified, isZh, rawContent, rawExcerpt, rawTitle, post]);

  const title = isZh ? convertedContent?.title || rawTitle : rawTitle;
  const excerpt = isZh ? convertedContent?.excerpt || rawExcerpt : rawExcerpt;
  const content = isZh ? convertedContent?.content || rawContent : rawContent;

  const headings = useMemo(() => extractHeadings(content), [content]);

  // Reading progress + scrollspy
  useEffect(() => {
    const handleScroll = () => {
      const el = articleRef.current;
      if (el && progressRef.current) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
        progressRef.current.style.width = `${total > 0 ? (scrolled / total) * 100 : 0}%`;
      }

      if (headings.length > 0) {
        let current = headings[0].id;
        for (const heading of headings) {
          const node = document.getElementById(heading.id);
          if (node && node.getBoundingClientRect().top <= 160) {
            current = heading.id;
          }
        }
        setActiveHeading(current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings, content]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="w-full h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const finalImageToUse = getValidImageUrl(post.backup_image_url, post.imageUrl);

  const currentUrl = getCanonicalUrl(`/blog/${post.slug}`);
  const breadcrumbs = [
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: 'Blog', url: getCanonicalUrl('/blog') },
    { name: title, url: currentUrl },
  ];
  const authorName = post.author || 'Up-Brands Team';
  const authorSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: authorName,
    jobTitle: 'Brand Strategy Author',
    worksFor: {
      '@type': 'Organization',
      name: 'Up-Brands™上游文创',
      url: getCanonicalUrl('/'),
    },
    sameAs: [
      'https://www.behance.net/up-brands',
      'https://dribbble.com/up-brands',
      'https://www.zcool.com.cn/u/15722034',
    ],
  };

  return (
    <Layout>
      <SEO
        title={title}
        description={excerpt}
        image={getSupabaseUrl(finalImageToUse, 1200)}
        type="article"
        url={currentUrl}
        publishedTime={post.date}
        author={post.author}
        tags={post.tags}
        keywords={post.tags}
        breadcrumbs={breadcrumbs}
        schemas={[authorSchema]}
      />

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-[60]">
        <div ref={progressRef} className="h-full bg-black transition-[width] duration-100" style={{ width: 0 }} />
      </div>

      <article className="w-full pt-32 pb-16 px-4 md:px-8 bg-white min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-16">
            <div ref={articleRef}>
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider mb-8 hover:opacity-60 transition-opacity"
              >
                <span>←</span> {t('blog.back')}
              </Link>

              <header className="mb-12">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6 uppercase tracking-widest">
                  <span>{post.date}</span>
                  {post.author && (
                    <>
                      <span>•</span>
                      <span>{post.author}</span>
                    </>
                  )}
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
                  {title}
                </h1>

                <div className="w-full aspect-[21/9] overflow-hidden bg-gray-100 mb-12">
                  <img
                    src={getSupabaseUrl(finalImageToUse, 1600)}
                    alt={getBlogImageAlt(title, post.tags)}
                    className="w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    sizes="100vw"
                  />
                </div>
              </header>

              <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-32 prose-p:text-gray-600 prose-img:rounded-lg">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 id={slugifyHeading(String(children))}>{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 id={slugifyHeading(String(children))}>{children}</h3>
                    ),
                    img: ({ node, ...props }) => (
                      <img {...props} src={getSupabaseUrl(props.src || '', 1200)} alt={props.alt || ''} loading="lazy" />
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>

              <div className="mt-16 pt-8 border-t border-gray-200">
                <div className="mb-10 p-6 md:p-8 rounded-3xl bg-gray-50 border border-gray-200">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-500 mb-3">Author</p>
                  <h2 className="text-2xl font-bold mb-3">{authorName}</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Up-Brands shares bilingual insights on brand strategy, visual identity, packaging design, and growth for businesses in the Greater Bay Area and beyond.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {post.tags?.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 text-sm font-medium rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-5 py-2 border border-gray-200 rounded-full text-sm font-bold uppercase tracking-wider hover:border-black hover:bg-black hover:text-white transition-colors"
                  >
                    {copied ? (isZh ? '已复制' : 'Copied!') : (isZh ? '复制链接' : 'Share')}
                  </button>
                </div>
              </div>
            </div>

            {headings.length > 0 && (
              <aside className="hidden xl:block">
                <div className="sticky top-32">
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400 mb-4">
                    {isZh ? '目录' : 'On this page'}
                  </p>
                  <nav className="border-l border-gray-200">
                    {headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className={`block py-1.5 pr-2 text-sm leading-snug border-l-2 -ml-px transition-colors ${
                          heading.level === 3 ? 'pl-6' : 'pl-4'
                        } ${
                          activeHeading === heading.id
                            ? 'border-black text-black font-medium'
                            : 'border-transparent text-gray-500 hover:text-black'
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </aside>
            )}
          </div>
        </motion.div>
      </article>
    </Layout>
  );
}
