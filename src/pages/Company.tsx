import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '../components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { ContactModal } from '../components/ui/ContactModal';
import { getCanonicalUrl } from '../utils/seo';

interface CompanyService {
  title: string;
  desc: string;
}

export default function Company() {
  const { t, i18n } = useTranslation();
  const [showContactModal, setShowContactModal] = useState(false);

  const isZh = i18n.language.startsWith('zh');
  const rawServices = t('company.services', { returnObjects: true }) as unknown;
  const rawValues = t('company.values', { returnObjects: true }) as unknown;
  const services: CompanyService[] = Array.isArray(rawServices) ? (rawServices as CompanyService[]) : [];
  const values: string[] = Array.isArray(rawValues) ? (rawValues as string[]) : [];

  const seoTitle = isZh ? '关于公司 - 上游文创Up-Brands | 品牌策略与创意设计' : 'The Company - Up-Brands | Brand Strategy & Creative Design';
  const seoDesc = isZh
    ? '上游文创（Up-Brands™）是一家扎根珠海的中英双语品牌策略与创意设计公司，服务粤港澳大湾区及全球客户，提供品牌策略、创意视觉设计与数字营销服务。'
    : 'Up-Brands™上游文创 is a bilingual brand strategy and creative design company rooted in Zhuhai, serving the Greater Bay Area and global clients with brand strategy, visual identity, and digital marketing.';

  const companyUrl = getCanonicalUrl('/company');
  const companySchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: seoTitle,
      description: seoDesc,
      url: companyUrl,
      inLanguage: isZh ? 'zh-CN' : 'en',
      mainEntity: {
        '@type': 'Organization',
        name: 'Up-Brands™上游文创',
        url: getCanonicalUrl('/'),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Up-Brands™上游文创',
      alternateName: 'Up-Brands',
      url: getCanonicalUrl('/'),
      logo: 'https://www.up-brands.com/favicon.svg',
      image: 'https://www.up-brands.com/og-image.svg',
      description: seoDesc,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Room 1101, Dongda Commercial Center, Jingshan Road, Jida, Xiangzhou District',
        addressLocality: 'Zhuhai',
        addressRegion: 'Guangdong',
        postalCode: '519000',
        addressCountry: 'CN',
      },
      areaServed: ['Greater Bay Area', 'Hong Kong', 'Macau', 'Shenzhen', 'Zhuhai', 'Guangzhou'],
      knowsAbout: ['Brand Strategy', 'Visual Identity Design', 'Packaging Design', 'Digital Marketing'],
      sameAs: ['https://www.behance.net/up-brands'],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'up-brands@hotmail.com',
        telephone: '+86-166-2620-6849',
        contactType: 'customer service',
        availableLanguage: ['en', 'zh'],
      },
    },
  ];

  return (
    <Layout>
      <SEO
        title={seoTitle}
        description={seoDesc}
        url={companyUrl}
        schemas={companySchemas}
      />

      <section className="w-full pt-48 pb-16 px-4 md:px-8 bg-[#F3EFEA]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6">
            {t('company.eyebrow')}
          </p>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-[#1f2021] leading-[0.9]">
            {t('company.title')}
          </h1>
          <p className="mt-8 text-lg md:text-xl text-gray-600 max-w-3xl font-medium leading-relaxed">
            {t('company.intro')}
          </p>
        </motion.div>
      </section>

      <section className="w-full px-4 md:px-8 py-16 md:py-24 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-8">{t('company.who_title')}</h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">{t('company.who_desc')}</p>
        </motion.div>
      </section>

      <section className="w-full px-4 md:px-8 pb-16 md:pb-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-10">{t('company.what_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <div
                key={service.title}
                className="bg-[#F3EFEA] p-8 rounded-2xl flex flex-col h-full"
              >
                <div className="text-3xl font-black text-[#c0ac97] mb-4">0{index + 1}</div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-4 md:px-8 pb-16 md:pb-24 bg-white">
        <div className="max-w-4xl mx-auto bg-gray-100 p-10 md:p-14 rounded-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 flex items-center gap-4">
            <MapPin className="text-[#8a6c4a]" /> {t('company.where_title')}
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl mb-8">{t('company.where_desc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="mailto:up-brands@hotmail.com"
              className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
            >
              <Mail size={18} /> up-brands@hotmail.com
            </a>
            <a
              href="tel:+8616626206849"
              className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
            >
              <Phone size={18} /> +86 166-2620-6849
            </a>
            <a
              href="https://wa.me/85253311007"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
            >
              <Phone size={18} /> WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="w-full px-4 md:px-8 pb-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-8">{t('company.how_title')}</h2>
          <ul className="space-y-5">
            {values.map((value) => (
              <li key={value} className="flex items-start gap-4 text-lg text-gray-700 leading-relaxed">
                <span className="mt-3 w-2 h-2 rounded-full bg-[#c0ac97] shrink-0" />
                {value}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="w-full px-4 md:px-8 pb-24 bg-white">
        <div className="max-w-4xl mx-auto bg-[#1f2021] text-[#c0ac97] p-12 md:p-16 rounded-3xl text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-6 uppercase tracking-wide">
            {t('company.cta_title')}
          </h2>
          <p className="text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto opacity-90 mb-8">
            {t('company.cta_desc')}
          </p>
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="inline-flex items-center justify-center px-8 py-4 bg-[#c0ac97] text-[#1f2021] font-bold uppercase tracking-widest text-sm rounded-full hover:opacity-90 transition-opacity"
          >
            {t('company.cta_btn')}
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
