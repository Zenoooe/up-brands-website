import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { ServiceCategory } from '../admin/TagsManager';

export function ServicesSection() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [dynamicCategories, setDynamicCategories] = useState<ServiceCategory[] | null>(null);
  
  const isChinese = i18n.language.startsWith('zh');

  useEffect(() => {
    async function loadTags() {
      try {
        const { data, error } = await supabase.from('settings').select('value').eq('key', 'services_hierarchy').maybeSingle();
        if (data && data.value) {
          setDynamicCategories(data.value);
        }
      } catch (e) {
        console.error('Failed to load dynamic categories', e);
      }
    }
    loadTags();
  }, []);

  const toggleAccordion = (index: number) => {
    setHoveredIndex(hoveredIndex === index ? null : index);
  };

  const handleItemClick = (enItem: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent accordion toggle if clicking item
    const params = new URLSearchParams();
    params.set('service', enItem);
    navigate(`/work?${params.toString()}`);
  };

  const accordionVariants = {
    hidden: { 
      height: 0, 
      opacity: 0,
      transition: { 
        height: { duration: 0.5, ease: [0.76, 0, 0.24, 1] },
        opacity: { duration: 0.3 }
      }
    },
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { 
        height: { duration: 0.6, ease: [0.76, 0, 0.24, 1] },
        opacity: { duration: 0.4 },
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] }
    }
  };

  // Fetch translations (fallback)
  const fallbackServicesData = t('services_section.categories', { returnObjects: true }) as Array<{ title: string; items: string[] }>;
  const fallbackEnServicesData = t('services_section.categories', { lng: 'en', returnObjects: true }) as Array<{ title: string; items: string[] }>;

  // Combine dynamic or fallback
  let displayCategories: Array<{ title: string; items: string[]; enItems: string[] }> = [];
  
  if (dynamicCategories && dynamicCategories.length > 0) {
    displayCategories = dynamicCategories.map(cat => ({
      title: isChinese ? cat.title_zh || cat.title_en : cat.title_en,
      items: cat.items.map(item => isChinese ? item.zh || item.en : item.en),
      enItems: cat.items.map(item => item.en)
    }));
  } else {
    displayCategories = Array.isArray(fallbackServicesData) ? fallbackServicesData.map((cat, idx) => ({
      title: cat.title,
      items: cat.items,
      enItems: fallbackEnServicesData[idx]?.items || cat.items
    })) : [];
  }

  return (
    <section className="w-full bg-black text-white py-24 md:py-32 relative z-20">
      <div className="px-4 md:px-8 max-w-[90vw] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-5 flex flex-col justify-start pt-4">
            <h2 className={`text-4xl md:text-6xl ${isChinese ? 'font-medium tracking-normal' : 'font-bold uppercase tracking-tight'} mb-8`}>
              {t('services_section.title')}
            </h2>
            <p className={`text-xl md:text-2xl ${isChinese ? 'font-normal tracking-wide' : 'font-light'} leading-relaxed text-gray-400 max-w-lg`}>
              {t('services_section.description')}
            </p>
          </div>

          {/* Right Column - Accordion */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            <div className="border-t border-gray-800">
              {displayCategories.map((service, index) => {
                const isHovered = hoveredIndex === index;
                return (
                  <div
                    key={index}
                    className="border-b border-gray-800 group cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => toggleAccordion(index)}
                  >
                    <div className="py-6 md:py-8 flex justify-between items-center">
                      <h3 className={`text-2xl md:text-3xl lg:text-4xl ${isChinese ? 'font-normal tracking-normal' : 'font-light tracking-tight'} transition-colors duration-500 ${isHovered ? 'text-white' : 'text-gray-500 group-hover:text-white'}`}>
                        {service.title}
                      </h3>
                      <div className="relative w-6 h-6 flex items-center justify-center transform origin-center transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]">
                        <span className={`absolute w-full h-[2px] bg-current transition-colors duration-500 ${isHovered ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                        <span className={`absolute h-full w-[2px] bg-current transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] ${isHovered ? 'rotate-90 scale-y-0' : 'rotate-0 scale-y-100'} ${isHovered ? 'text-white' : 'text-gray-500 group-hover:text-white'}`} />
                      </div>
                    </div>
                    
                    <AnimatePresence initial={false}>
                      {isHovered && (
                        <motion.div
                          variants={accordionVariants}
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          className="overflow-hidden"
                        >
                          <ul className="pb-8 space-y-4 pl-0 m-0">
                            {service.items.map((item, idx) => {
                              const enItem = service.enItems[idx] || item;
                              return (
                                <motion.li 
                                  key={idx} 
                                  variants={itemVariants}
                                  onClick={(e) => handleItemClick(enItem, e)}
                                  className={`text-gray-400 hover:text-white transition-colors duration-300 text-lg md:text-xl ${isChinese ? 'font-normal tracking-wide' : 'font-light tracking-wide'} cursor-pointer`}
                                >
                                  {item}
                                </motion.li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
