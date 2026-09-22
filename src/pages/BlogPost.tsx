import { Layout } from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePost } from '../hooks/usePosts';
import { SEO } from '../components/common/SEO';
import { Link, useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useEffect, useState } from 'react';
import { getBlogImageAlt, getCanonicalUrl } from '../utils/seo';
import { getSupabaseUrl, getValidImageUrl } from '../utils/image';
import { toSimplifiedChinese } from '../utils/opencc-simplified';

export default function BlogPost() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const { post, loading } = usePost(slug);
  const isZh = i18n.language.startsWith('zh');
  const isSimplified = i18n.language === 'zh-CN' || i18n.language === 'zh';
  const [convertedContent, setConvertedContent] = useState<{
    title: string;
    excerpt: string;
    content: string;
  } | null>(null);

  const rawTitle = post ? (isZh ? post.title_zh : post.title_en) : '';
  const rawExcerpt = post ? (isZh ? post.excerpt_zh : post.excerpt_en) : '';
  const rawContent = post ? (isZh ? post.content_zh : post.content_en) : '';

  useEffect(() => {
    let isMounted = true;

    if (!isZh || !isSimplified || !post) {
      setConvertedContent(null);
      return () => {
        isMounted = false;
      };
    }

    const convertPost = async () => {
      const [title, excerpt, content] = await Promise.all([
        toSimplifiedChinese(rawTitle),
        toSimplifiedChinese(rawExcerpt),
        toSimplifiedChinese(rawContent),
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

  const title = isZh && isSimplified ? convertedContent?.title || rawTitle : rawTitle;
  const excerpt = isZh && isSimplified ? convertedContent?.excerpt || rawExcerpt : rawExcerpt;
  const content = isZh && isSimplified ? convertedContent?.content || rawContent : rawContent;
  
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

      <article className="w-full pt-32 pb-16 px-4 md:px-8 bg-white min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
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

          <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-gray-600 prose-img:rounded-lg">
            <ReactMarkdown
              components={{
                img: ({ node, ...props }) => (
                  <img {...props} src={getSupabaseUrl(props.src || '', 1200)} alt={props.alt || ''} loading="lazy" />
                )
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

            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags?.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-sm font-medium rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </article>
    </Layout>
  );
}
