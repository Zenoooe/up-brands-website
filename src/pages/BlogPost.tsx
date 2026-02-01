import { Layout } from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePost } from '../hooks/usePosts';
import { SEO } from '../components/common/SEO';
import { Link, useParams, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import * as OpenCC from 'opencc-js';

// Create converter instance
const convertToSimplified = OpenCC.Converter({ from: 'hk', to: 'cn' });

export default function BlogPost() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams();
  const { post, loading } = usePost(slug);
  const isZh = i18n.language.startsWith('zh');
  const isSimplified = i18n.language === 'zh-CN' || i18n.language === 'zh';

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

  // Helper to handle text conversion
  const getLocalizedText = (text: string) => {
    if (!isZh) return text;
    // If it's simplified mode, convert the traditional text to simplified
    return isSimplified ? convertToSimplified(text) : text;
  };

  const rawTitle = isZh ? post.title_zh : post.title_en;
  const rawExcerpt = isZh ? post.excerpt_zh : post.excerpt_en;
  const rawContent = isZh ? post.content_zh : post.content_en;

  const title = getLocalizedText(rawTitle);
  const excerpt = getLocalizedText(rawExcerpt);
  const content = getLocalizedText(rawContent);

  return (
    <Layout>
      <SEO
        title={title}
        description={excerpt}
        image={post.backup_image_url || post.imageUrl}
        type="article"
        publishedTime={post.date}
        author={post.author}
        tags={post.tags}
        keywords={post.tags}
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
              <span>•</span>
              <span>{post.author}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8">
              {title}
            </h1>

            <div className="w-full aspect-[21/9] overflow-hidden bg-gray-100 mb-12">
              <img 
                src={post.backup_image_url || post.imageUrl} 
                alt={title} 
                className="w-full h-full object-cover"
              />
            </div>
          </header>

          <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-gray-600 prose-img:rounded-lg">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
          
          <div className="mt-16 pt-8 border-t border-gray-200">
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
