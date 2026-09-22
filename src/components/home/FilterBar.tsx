import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface FilterBarProps {
  services: string[];
  industries: string[];
  selectedService: string;
  selectedIndustry: string;
  onServiceChange: (val: string) => void;
  onIndustryChange: (val: string) => void;
  translationsMap?: Record<string, string>;
}

const Dropdown = ({ 
  options, 
  value, 
  onChange, 
  placeholder,
  isChinese,
  formatOption
}: { 
  options: string[], 
  value: string, 
  onChange: (val: string) => void,
  placeholder: string,
  isChinese: boolean,
  formatOption: (opt: string) => string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block mx-2 md:mx-4" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 border-b-[3px] border-black/20 hover:border-black transition-colors pb-1 cursor-pointer whitespace-nowrap"
      >
        <span className={value ? "text-black font-bold" : `text-gray-500 ${isChinese ? 'font-normal' : 'italic'}`}>
          {value ? formatOption(value) : placeholder}
        </span>
        <ChevronDown size={24} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-0 top-full mt-2 min-w-[280px] bg-[#f8f6f0] border border-[#e6e2da] shadow-2xl rounded-xl overflow-hidden z-[100]"
          >
            <div 
              className="max-h-[400px] overflow-y-auto py-2 overscroll-contain custom-scrollbar"
              onWheel={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => { onChange(''); setIsOpen(false); }}
                className={`w-full text-left px-6 py-4 hover:bg-[#ebe6db] transition-colors text-lg md:text-xl ${!value ? 'font-bold bg-[#ebe6db]' : 'text-gray-600'}`}
              >
                {placeholder}
              </button>
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setIsOpen(false); }}
                  className={`w-full text-left px-6 py-4 hover:bg-[#ebe6db] transition-colors text-lg md:text-xl ${value === opt ? 'font-bold bg-[#ebe6db] text-black' : 'text-gray-600'}`}
                >
                  {formatOption(opt)}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const FilterBar = ({
  services,
  industries,
  selectedService,
  selectedIndustry,
  onServiceChange,
  onIndustryChange,
  translationsMap = {}
}: FilterBarProps) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // Dynamic font sizing and styling based on language
  const isChinese = i18n.language.startsWith('zh');

  const handleGoTo = () => {
    const params = new URLSearchParams();
    if (selectedService) params.set('service', selectedService);
    if (selectedIndustry) params.set('industry', selectedIndustry);
    navigate(`/work?${params.toString()}`);
  };

  const getTranslatedTag = (type: 'services' | 'industries', opt: string) => {
    // If it's English, just return the English tag
    if (!isChinese) return opt;
    
    // Check dynamic translations map first
    if (translationsMap[opt]) {
      return translationsMap[opt];
    }
    
    // Otherwise try to get from i18n translations (fallback)
    return t(`tags.${type}.${opt}`, { defaultValue: opt });
  };

  return (
    <div className="w-full py-12 md:py-16 bg-[#F3EFEA] flex flex-col xl:flex-row items-center justify-between gap-8 border-b border-black/10 z-30 relative px-4 md:px-8 xl:px-16">
      <div className={`flex-1 flex flex-wrap items-center justify-center xl:justify-start ${isChinese ? 'text-4xl md:text-5xl lg:text-6xl font-medium tracking-normal' : 'text-3xl md:text-5xl lg:text-6xl font-light tracking-tight'} leading-tight text-center xl:text-left text-[#1f2021]`}>
        {isChinese ? (
          <>
            <span className="my-2 whitespace-nowrap">我们为</span>
            <Dropdown 
              options={industries} 
              value={selectedIndustry} 
              onChange={onIndustryChange} 
              placeholder={t('filter_bar.everyone')} 
              isChinese={isChinese}
              formatOption={(opt) => getTranslatedTag('industries', opt)}
            />
            <span className="my-2 whitespace-nowrap">提供</span>
            <Dropdown 
              options={services} 
              value={selectedService} 
              onChange={onServiceChange} 
              placeholder={t('filter_bar.everything')} 
              isChinese={isChinese}
              formatOption={(opt) => getTranslatedTag('services', opt)}
            />
            <span className="my-2 whitespace-nowrap">服务</span>
          </>
        ) : (
          <>
            <span className="my-2 whitespace-nowrap">{t('filter_bar.we_design')}</span>
            <Dropdown 
              options={services} 
              value={selectedService} 
              onChange={onServiceChange} 
              placeholder={t('filter_bar.everything')} 
              isChinese={isChinese}
              formatOption={(opt) => getTranslatedTag('services', opt)}
            />
            <span className="my-2 whitespace-nowrap">{t('filter_bar.for')}</span>
            <Dropdown 
              options={industries} 
              value={selectedIndustry} 
              onChange={onIndustryChange} 
              placeholder={t('filter_bar.everyone')} 
              isChinese={isChinese}
              formatOption={(opt) => getTranslatedTag('industries', opt)}
            />
          </>
        )}
      </div>

      <button
        onClick={handleGoTo}
        className="group inline-flex items-center justify-center gap-4 bg-black text-white px-10 py-5 rounded-full font-bold uppercase tracking-widest text-sm hover:bg-[#1769FF] transition-all duration-300 whitespace-nowrap flex-shrink-0 shadow-xl hover:shadow-2xl hover:-translate-y-1"
      >
        <span>{t('filter_bar.go_to_work')}</span>
        <ArrowRight size={20} className="transform group-hover:translate-x-2 transition-transform" />
      </button>
    </div>
  );
};
