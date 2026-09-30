import { Layout } from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { usePosts } from '../hooks/usePosts';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { SEO } from '../components/common/SEO';
import { getBlogImageAlt, getCanonicalUrl } from '../utils/seo';
import { getSupabaseUrl, getValidImageUrl } from '../utils/image';
import { convertChinese } from '../utils/zhConvert';
import type { BlogPost } from '../types';

export default function Blog() {
  const { t, i18n } = useTranslation();
  const { posts, loading } = usePosts();
  const isZh = i18n.language.startsWith('zh');
  const isSimplified = isZh && !/(TW|HK|MO|Hant)/.test(i18n.language);
  const [convertedPosts, setConvertedPosts] = useState<Record<string, { title: string; excerpt: string }>>({});
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Custom SEO for Blog
  const seoTitle = i18n.language.startsWith('zh')
    ? "创意视觉与品牌策略 - 上游文创Up-Brands | 品牌提升专家"
    : "Creative Vision & Brand Strategy - Up-Brands | Brand Enhancement Experts";

  const seoDesc = i18n.language.startsWith('zh')
    ? "上游文创Up-Brands提供专业的品牌策略和创意视觉服务，帮助大湾区企业通过精准的市场定位和创意设计实现品牌升级和业务增长。探索我们的行业洞察、品牌设计趋势和最新项目动态。"
    : "Up-Brands provides professional brand strategy and creative vision services, helping GBA enterprises achieve brand upgrades and business growth through precise positioning and design. Explore our industry insights, brand design trends, and latest project updates.";

  useEffect(() => {
    let isMounted = true;

    if (!isZh || posts.length === 0) {
      setConvertedPosts({});
      return () => {
        isMounted = false;
      };
    }

    const target = isSimplified ? 'simplified' : 'traditional';

    const convertPosts = async () => {
      const entries = await Promise.all(
        posts.map(async (post) => [
          post.id,
          {
            title: await convertChinese(post.title_zh, target),
            excerpt: await convertChinese(post.excerpt_zh, target),
          },
        ] as const),
      );

      if (isMounted) {
        setConvertedPosts(Object.fromEntries(entries));
      }
    };

    void convertPosts();

    return () => {
      isMounted = false;
    };
  }, [isSimplified, isZh, posts]);

  const allTags = useMemo(() => {
    const seen = new Set<string>();
    posts.forEach((post) => post.tags?.forEach((tag) => tag && seen.add(tag)));
    return Array.from(seen);
  }, [posts]);

  const filteredPosts = useMemo(
    () => (activeTag ? posts.filter((post) => post.tags?.includes(activeTag)) : posts),
    [posts, activeTag],
  );

  const featuredPost: BlogPost | null =
    !activeTag && filteredPosts.length > 3 ? filteredPosts[0] : null;
  const gridPosts = featuredPost ? filteredPosts.slice(1) : filteredPosts;

  const resolveText = (post: BlogPost) => {
    const rawTitle = isZh ? post.title_zh : post.title_en;
    const rawExcerpt = isZh ? post.excerpt_zh : post.excerpt_en;
    const convertedPost = convertedPosts[post.id];
    return {
      title: isZh ? convertedPost?.title || rawTitle : rawTitle,
      excerpt: isZh ? convertedPost?.excerpt || rawExcerpt : rawExcerpt,
      image: getValidImageUrl(post.backup_image_url, post.imageUrl),
    };
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDesc}
        url={getCanonicalUrl('/blog')}
      />

      <section className="w-full pt-32 pb-16 px-4 md:px-8 bg-white min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-12">
            {t('blog.title')}
          </h1>

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-16">
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-full border transition-colors ${
                  activeTag === null
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'
                }`}
              >
                {isZh ? '全部' : 'All'}
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(tag)}
                  className={`px-4 py-2 text-sm font-bold uppercase tracking-wider rounded-full border transition-colors ${
                    activeTag === tag
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {featuredPost && (
            <Link to={`/blog/${featuredPost.slug}`} className="group block mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="overflow-hidden aspect-[16/10] bg-gray-100">
                  <img
                    src={getSupabaseUrl(resolveText(featuredPost).image, 1200)}
                    alt={getBlogImageAlt(resolveText(featuredPost).title, featuredPost.tags)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 uppercase tracking-widest">
                    <span className="px-3 py-1 bg-black text-white rounded-full">
                      {isZh ? '精选' : 'Featured'}
                    </span>
                    {featuredPost.tags?.[0] && <span>{featuredPost.tags[0]}</span>}
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-4 group-hover:underline decoration-2 underline-offset-4">
                    {resolveText(featuredPost).title}
                  </h2>
                  <p className="text-gray-600 line-clamp-3 mb-6">
                    {resolveText(featuredPost).excerpt}
                  </p>
                  <span className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 group-hover:gap-4 transition-all">
                    {t('blog.read_more')}
                    <span className="text-lg">→</span>
                  </span>
                </div>
              </div>
            </Link>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridPosts.map((post, index) => {
              const { title, excerpt, image } = resolveText(post);

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
                        src={getSupabaseUrl(image, 800)}
                        alt={getBlogImageAlt(title, post.tags)}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading={index === 0 ? 'eager' : 'lazy'}
                        fetchPriority={index === 0 ? 'high' : 'auto'}
                        decoding="async"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>

                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 uppercase tracking-widest">
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

          {filteredPosts.length === 0 && (
            <p className="text-center text-gray-500 py-24">
              {isZh ? '暂无相关文章。' : 'No articles found.'}
            </p>
          )}
        </motion.div>
      </section>
    </Layout>
  );
}
