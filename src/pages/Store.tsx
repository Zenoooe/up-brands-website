import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { ContactModal } from '../components/ui/ContactModal';
import { getCanonicalUrl } from '../utils/seo';

export default function Store() {
  const { t, i18n } = useTranslation();
  const [showContactModal, setShowContactModal] = useState(false);

  const isZh = i18n.language.startsWith('zh');
  const seoTitle = isZh ? '商店 - 上游文创Up-Brands' : 'Store - Up-Brands';
  const seoDesc = isZh
    ? '上游文创在线商店即将上线，将提供品牌周边、品牌模板与设计资源。欢迎订阅或联系我们获取上线通知。'
    : 'The Up-Brands online store is coming soon, featuring brand merchandise, templates, and design resources. Subscribe or contact us to be notified at launch.';
  const storeUrl = getCanonicalUrl('/store');

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDesc}
        url={storeUrl}
        schemas={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: seoTitle,
            description: seoDesc,
            url: storeUrl,
            inLanguage: isZh ? 'zh-CN' : 'en',
          },
        ]}
      />

      <section className="w-full pt-48 pb-24 px-4 md:px-8 bg-[#F3EFEA] min-h-[70vh] flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-20 h-20 bg-[#1f2021] text-[#c0ac97] rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag size={32} />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
            {t('store.eyebrow')}
          </p>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-[#1f2021] leading-[0.95]">
            {t('store.title')}
          </h1>
          <p className="mt-8 text-lg md:text-xl text-gray-600 font-medium leading-relaxed">
            {t('store.intro')}
          </p>
          <p className="mt-6 inline-block px-5 py-2 bg-[#1f2021] text-[#c0ac97] text-sm font-bold uppercase tracking-widest rounded-full">
            {t('store.coming_soon')}
          </p>
          <p className="mt-8 text-gray-600 leading-relaxed max-w-2xl mx-auto">
            {t('store.desc')}
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center justify-center px-8 py-4 bg-[#1f2021] text-[#c0ac97] font-bold uppercase tracking-widest text-sm rounded-full hover:opacity-90 transition-opacity"
            >
              {t('store.cta_btn')}
            </button>
            <Link
              to="/projects"
              className="inline-flex items-center justify-center px-8 py-4 border border-[#1f2021] text-[#1f2021] font-bold uppercase tracking-widest text-sm rounded-full hover:bg-[#1f2021] hover:text-[#c0ac97] transition-colors"
            >
              {t('store.back')}
            </Link>
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
        {showContactModal && (
          <ContactModal onClose={() => setShowContactModal(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
