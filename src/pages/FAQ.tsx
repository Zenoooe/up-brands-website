import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { ContactModal } from '../components/ui/ContactModal';
import { getCanonicalUrl } from '../utils/seo';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

export default function FAQ() {
  const { t, i18n } = useTranslation();
  const [showContactModal, setShowContactModal] = useState(false);
  const [openItem, setOpenItem] = useState<string | null>('0-0');

  const isZh = i18n.language.startsWith('zh');
  const rawCategories = t('faq.categories', { returnObjects: true }) as unknown;
  const categories: FaqCategory[] = Array.isArray(rawCategories) ? (rawCategories as FaqCategory[]) : [];

  const seoTitle = isZh ? '常见问题 - 上游文创Up-Brands' : 'Frequently Asked Questions - Up-Brands';
  const seoDesc = isZh
    ? '关于与上游文创合作的常见问题解答：服务内容、合作流程、项目周期、费用报价与联系方式，一次了解清楚。'
    : 'Answers to common questions about working with Up-Brands: services, process, timelines, pricing, and how to get started on your brand project.';

  const faqUrl = getCanonicalUrl('/faq');
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: seoTitle,
    description: seoDesc,
    url: faqUrl,
    inLanguage: isZh ? 'zh-CN' : 'en',
    mainEntity: categories.flatMap((category) =>
      category.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    ),
  };

  const toggleItem = (key: string) => {
    setOpenItem((current) => (current === key ? null : key));
  };

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDesc}
        url={faqUrl}
        schemas={[faqSchema]}
      />

      <section className="w-full pt-48 pb-16 px-4 md:px-8 bg-[#F3EFEA]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
            {t('faq.eyebrow')}
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#1f2021] leading-[0.9]">
            {t('faq.title')}
          </h1>
          <p className="mt-8 text-lg text-gray-600 max-w-2xl font-medium leading-relaxed">
            {t('faq.intro')}
          </p>
        </motion.div>
      </section>

      <section className="w-full px-4 md:px-8 py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto space-y-16">
          {categories.map((category, categoryIndex) => (
            <div key={category.title}>
              <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight mb-6 pb-4 border-b border-gray-200">
                {category.title}
              </h2>
              <div className="divide-y divide-gray-100">
                {category.items.map((item, itemIndex) => {
                  const key = `${categoryIndex}-${itemIndex}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={item.question}>
                      <button
                        type="button"
                        onClick={() => toggleItem(key)}
                        aria-expanded={isOpen}
                        className="w-full flex items-start justify-between gap-6 py-6 text-left group"
                      >
                        <h3 className="text-lg md:text-xl font-bold text-[#1f2021] group-hover:text-[#8a6c4a] transition-colors">
                          {item.question}
                        </h3>
                        <ChevronDown
                          size={24}
                          className={`shrink-0 mt-1 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <p className="pb-6 pr-10 text-gray-600 leading-relaxed">
                              {item.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full px-4 md:px-8 pb-24 bg-white">
        <div className="max-w-4xl mx-auto bg-[#1f2021] text-[#c0ac97] p-12 md:p-16 rounded-3xl text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-6 uppercase tracking-wide">
            {t('faq.cta_title')}
          </h2>
          <p className="text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto opacity-90 mb-8">
            {t('faq.cta_desc')}
          </p>
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center justify-center px-8 py-4 bg-[#c0ac97] text-[#1f2021] font-bold uppercase tracking-widest text-sm rounded-full hover:opacity-90 transition-opacity"
          >
            {t('faq.cta_btn')}
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
