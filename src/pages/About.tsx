import { useTranslation } from 'react-i18next';
import { Layout } from '../components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone } from 'lucide-react';
import { FaBehance, FaWeixin, FaWhatsapp } from 'react-icons/fa';
import { ContactModal } from '../components/ui/ContactModal';
import { useState } from 'react';
import { SEO } from '../components/common/SEO';

export default function About() {
  const { t, i18n } = useTranslation();
  const [showContactModal, setShowContactModal] = useState(false);

  // Custom SEO for About
  const seoTitle = i18n.language.startsWith('zh')
    ? "关于我们 - 上游文创Up-Brands | 品牌提升专家"
    : "About Us - Up-Brands | Brand Enhancement Experts";

  const seoDesc = i18n.language.startsWith('zh')
    ? "基本介绍：上游致力为企业提供一套可执行的、有效率的全套品牌核心解决方案，以品牌战略+创意视觉+全网营销为核心路径，实现品牌更新和重塑之路。"
    : "Up-Brands is dedicated to providing efficient brand core solutions, focusing on Brand Strategy + Creative Vision + Digital Marketing to achieve brand renewal and reshaping.";

  return (
    <Layout>
      <SEO 
        title={seoTitle}
        description={seoDesc}
      />
      <div className="container mx-auto px-4 md:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-12">
            {t('about.title')}
          </h1>
          
          {/* Intro Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 mb-24">
            <div className="space-y-6">
              <p className="text-xl md:text-2xl font-medium leading-relaxed text-gray-800">
                {t('about.intro')}
              </p>
            </div>
            
            <div className="bg-gray-100 p-10 flex flex-col items-center justify-center text-center rounded-2xl">
              <h3 className="text-2xl font-bold uppercase tracking-widest mb-8">{t('about.connect')}</h3>
              
              <div className="grid grid-cols-2 gap-8 w-full max-w-sm">
                {/* Email */}
                <a
                  href="mailto:up-brands@hotmail.com"
                  className="flex flex-col items-center gap-3 group relative"
                >
                  <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
                    <Mail size={24} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:opacity-0 transition-opacity">Email</span>
                  <span className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-black text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                    up-brands@hotmail.com
                  </span>
                </a>

                {/* WhatsApp */}
                <a
                  href="https://wa.me/85253311007"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 group relative"
                >
                  <div className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
                    <FaWhatsapp />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:opacity-0 transition-opacity">WhatsApp</span>
                  <span className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-[#25D366] text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                    +852 5331 1007
                  </span>
                </a>
                
                {/* WeChat */}
                <a
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    alert('WeChat ID: DANISEBD'); 
                  }}
                  className="flex flex-col items-center gap-3 group relative"
                >
                  <div className="w-14 h-14 bg-[#07C160] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
                    <FaWeixin />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:opacity-0 transition-opacity">WeChat</span>
                  <span className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-[#07C160] text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                    ID: DANISEBD
                  </span>
                </a>

                {/* Behance */}
                <a
                  href="https://www.behance.net/up-brands"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-3 group relative"
                >
                  <div className="w-14 h-14 bg-[#1769FF] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-lg">
                    <FaBehance />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:opacity-0 transition-opacity">Behance</span>
                  <span className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-[#1769FF] text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
                    @up-brands
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* Problem Section */}
          <div className="mb-24">
            <h2 className="text-3xl md:text-5xl font-bold mb-12 text-center">{t('about.problem_title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="bg-white border border-gray-200 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-4xl font-black text-gray-200 mb-4">0{num}</div>
                  <h3 className="text-xl font-bold mb-3">{t(`about.problems.${num}.title`)}</h3>
                  <p className="text-gray-600 leading-relaxed">{t(`about.problems.${num}.desc`)}</p>
                </div>
              ))}
              
              {/* Problem 6 - Contact CTA */}
              <button 
                onClick={() => setShowContactModal(true)}
                className="bg-[#1f2021] text-[#c0ac97] p-8 rounded-xl shadow-lg hover:opacity-90 transition-opacity flex flex-col justify-center items-center text-center group cursor-pointer"
              >
                <div className="text-4xl font-black text-[#c0ac97] mb-4">06</div>
                <h3 className="text-xl font-bold mb-3 uppercase tracking-wider text-[#c0ac97]">{t('about.contact_cta_title')}</h3>
                <p className="text-[#c0ac97]/80 leading-relaxed">
                  {t('about.contact_cta_desc')}
                </p>
              </button>
            </div>
          </div>

          {/* Solution Section */}
          <div className="bg-[#1f2021] text-[#c0ac97] p-12 md:p-20 rounded-3xl text-center">
            <h2 className="text-2xl md:text-4xl font-bold mb-8 uppercase tracking-wide text-[#c0ac97]">
              {t('about.solution_title')}
            </h2>
            <div className="w-24 h-1 bg-[#c0ac97] mx-auto mb-8"></div>
            <p className="text-lg md:text-2xl font-light leading-relaxed max-w-4xl mx-auto opacity-90 text-[#c0ac97]">
              {t('about.solution_desc')}
            </p>
          </div>

        </motion.div>
      </div>

      <AnimatePresence>
        {showContactModal && (
          <ContactModal onClose={() => setShowContactModal(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
