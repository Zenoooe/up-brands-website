import { Layout } from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePosts } from '../hooks/usePosts';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import * as OpenCC from 'opencc-js';
import { useEffect, useState } from 'react';
import { SEO } from '../components/common/SEO';

// Create converter instance
const convertToSimplified = OpenCC.Converter({ from: 'hk', to: 'cn' });

export default function Blog() {
  const { t, i18n } = useTranslation();
  const { posts, loading } = usePosts();
  const isZh = i18n.language.startsWith('zh');
  const isSimplified = i18n.language === 'zh-CN' || i18n.language === 'zh';
  
  // Helper to handle text conversion
  const getLocalizedText = (text: string) => {
    if (!isZh) return text;
    // If it's simplified mode, convert the traditional text to simplified
    return isSimplified ? convertToSimplified(text) : text;
  };

  return (
    <Layout>
      <SEO 
        title={t('blog.seo_title') || "Blog & Insights | Up-Brands"}
        description={t('blog.seo_desc') || "Explore our latest thoughts on brand strategy, design trends, and marketing insights."}
        keywords={['Brand Insights', 'Design Blog', 'Marketing Trends', '品牌洞察', '设计博客', '营销趋势']}
      />

      <section className="w-full pt-32 pb-16 px-4 md:px-8 bg-white min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-16 tracking-tighter uppercase">
            {t('blog.title')}
          </h1>

          {loading ? (
            <div className="w-full h-64 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, index) => {
                // Get the base text (either EN or ZH-Traditional)
                const rawTitle = isZh ? post.title_zh : post.title_en;
                const rawExcerpt = isZh ? post.excerpt_zh : post.excerpt_en;
                
                // Convert if needed
                const title = isZh ? getLocalizedText(rawTitle) : rawTitle;
                const excerpt = isZh ? getLocalizedText(rawExcerpt) : rawExcerpt;
                
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group cursor-pointer flex flex-col h-full"
                  >
                    <Link to={`/blog/${post.slug}`} className="block h-full">
                      <div className="overflow-hidden aspect-[16/9] mb-6 bg-gray-100">
                        <img 
                          src={post.backup_image_url || post.imageUrl} 
                          alt={title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 uppercase tracking-widest">
                          {/* <span>{post.date}</span> */}
                          <span>{post.tags?.[0]}</span>
                        </div>
                        
                        <h2 className="text-2xl font-bold mb-3 leading-tight group-hover:underline decoration-2 underline-offset-4">
                          {title}
                        </h2>
                        
                        <p className="text-gray-600 line-clamp-3 mb-6 flex-1">
                          {excerpt}
                        </p>
                        
                        <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 group-hover:gap-4 transition-all">
                          {t('blog.read_more')}
                          <span className="text-lg">→</span>
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </section>
    </Layout>
  );
}
