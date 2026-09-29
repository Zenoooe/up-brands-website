import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { SEO } from '../components/common/SEO';
import { ContactModal } from '../components/ui/ContactModal';
import { getCanonicalUrl } from '../utils/seo';
import { getRelatedServices, isServiceSlug } from '../data/services';
import NotFound from './NotFound';

interface ServiceSection {
  title: string;
  desc: string;
}

interface ServiceContent {
  title: string;
  summary: string;
  intro: string;
  sections: ServiceSection[];
  deliverables: string[];
  keywords: string[];
}

const asArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const [showContactModal, setShowContactModal] = useState(false);

  if (!isServiceSlug(slug)) {
    return <NotFound />;
  }

  const isZh = i18n.language.startsWith('zh');
  const raw = t(`services.items.${slug}`, { returnObjects: true }) as Partial<ServiceContent> | string;

  const content: ServiceContent = typeof raw === 'object' && raw !== null
    ? {
        title: raw.title || '',
        summary: raw.summary || '',
        intro: raw.intro || '',
        sections: asArray<ServiceSection>(raw.sections),
        deliverables: asArray<string>(raw.deliverables),
        keywords: asArray<string>(raw.keywords),
      }
    : { title: '', summary: '', intro: '', sections: [], deliverables: [], keywords: [] };

  const relatedServices = getRelatedServices(slug);
  const serviceUrl = getCanonicalUrl(`/service/${slug}`);
  const seoTitle = `${content.title} - Up-Brands | ${isZh ? '品牌策略与创意设计' : 'Brand Strategy & Creative Design'}`;

  const serviceSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: content.title,
      serviceType: content.title,
      description: content.summary,
      url: serviceUrl,
      inLanguage: isZh ? 'zh-CN' : 'en',
      provider: {
        '@type': 'Organization',
        name: 'Up-Brands™上游文创',
        url: getCanonicalUrl('/'),
        areaServed: ['Greater Bay Area', 'Hong Kong', 'Macau', 'Shenzhen', 'Zhuhai', 'Guangzhou'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: isZh ? '首页' : 'Home', item: getCanonicalUrl('/') },
        { '@type': 'ListItem', position: 2, name: isZh ? '服务' : 'Services', item: getCanonicalUrl('/company') },
        { '@type': 'ListItem', position: 3, name: content.title, item: serviceUrl },
      ],
    },
  ];

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={content.summary}
        url={serviceUrl}
        keywords={content.keywords}
        schemas={serviceSchemas}
      />

      <section className="w-full pt-48 pb-16 px-4 md:px-8 bg-[#F3EFEA]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <nav className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500">
            <Link to="/" className="hover:text-black transition-colors">
              {isZh ? '首页' : 'Home'}
            </Link>
            <span aria-hidden>/</span>
            <Link to="/company" className="hover:text-black transition-colors">
              {t('services.eyebrow')}
            </Link>
          </nav>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
            {t('services.eyebrow')}
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#1f2021] leading-[0.9]">
            {content.title}
          </h1>
          <p className="mt-8 text-lg md:text-xl text-gray-600 max-w-3xl font-medium leading-relaxed">
            {content.intro}
          </p>
        </motion.div>
      </section>

      {content.sections.length > 0 && (
        <section className="w-full px-4 md:px-8 py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-10">{t('services.sections_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {content.sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.05 }}
                  className="bg-[#F3EFEA] p-8 rounded-2xl flex flex-col h-full"
                >
                  <div className="text-3xl font-black text-[#c0ac97] mb-4">0{index + 1}</div>
                  <h3 className="text-xl font-bold mb-3">{section.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{section.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {content.deliverables.length > 0 && (
        <section className="w-full px-4 md:px-8 pb-16 md:pb-24 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-8">{t('services.deliverables_title')}</h2>
            <ul className="space-y-5">
              {content.deliverables.map((item) => (
                <li key={item} className="flex items-start gap-4 text-lg text-gray-700 leading-relaxed">
                  <span className="mt-3 w-2 h-2 rounded-full bg-[#c0ac97] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {relatedServices.length > 0 && (
        <section className="w-full px-4 md:px-8 pb-16 md:pb-24 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('services.related_title')}</h2>
            <p className="text-lg text-gray-600 leading-relaxed mb-8">{t('services.related_desc')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedServices.map((service) => (
                <Link
                  key={service.slug}
                  to={`/service/${service.slug}`}
                  className="group flex items-center justify-between gap-4 bg-gray-100 p-6 rounded-2xl hover:bg-[#1f2021] hover:text-[#c0ac97] transition-colors"
                >
                  <span className="text-base font-bold">{t(`services.items.${service.slug}.title`)}</span>
                  <ArrowUpRight size={18} className="shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="w-full px-4 md:px-8 pb-24 bg-white">
        <div className="max-w-4xl mx-auto bg-[#1f2021] text-[#c0ac97] p-12 md:p-16 rounded-3xl text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-6 uppercase tracking-wide">
            {t('services.cta_title')}
          </h2>
          <p className="text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto opacity-90 mb-8">
            {t('services.cta_desc')}
          </p>
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center justify-center px-8 py-4 bg-[#c0ac97] text-[#1f2021] font-bold uppercase tracking-widest text-sm rounded-full hover:opacity-90 transition-opacity"
          >
            {t('services.cta_btn')}
          </button>
        </div>
      </section>

      <AnimatePresence>
        {showContactModal && (
          <ContactModal onClose={() => setShowContactModal(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
