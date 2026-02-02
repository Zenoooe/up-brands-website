import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContactModal } from '../ui/ContactModal';
import UpBrandsLogo from '../../assets/Up-brands-logo.svg';

export function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    // Cycle between en -> zh-CN -> zh-TW -> en
    const currentLang = i18n.language;
    let newLang = 'en';
    
    if (currentLang.startsWith('en')) {
      newLang = 'zh-CN';
    } else if (currentLang === 'zh-CN' || currentLang === 'zh') {
      newLang = 'zh-TW';
    } else if (currentLang === 'zh-TW') {
      newLang = 'en';
    } else {
      newLang = 'en';
    }
    
    i18n.changeLanguage(newLang);
  };

  const getLangLabel = () => {
    const lang = i18n.language;
    if (lang.startsWith('en')) return 'EN';
    if (lang === 'zh-TW' || lang === 'zh-HK') return '繁';
    return '简';
  };

  const navItems = [
    { label: t('nav.work'), href: '/' },
    { label: t('nav.about'), href: '/about' },
    { label: t('nav.blog'), href: '/blog' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 w-full z-50 transition-all duration-500",
          scrolled ? "bg-white/90 backdrop-blur-md py-4 border-b border-black/5" : "bg-transparent py-6 md:py-8"
        )}
      >
        <div className="container mx-auto px-4 md:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="z-50">
            <img 
              src={UpBrandsLogo} 
              alt="Up-Brands" 
              className="h-10 w-auto"
              width="150"
              height="40"
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-12">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "text-sm font-bold uppercase tracking-widest hover:text-gray-500 transition-colors",
                  isActive(item.href) ? "opacity-100" : "opacity-60"
                )}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => setShowContactModal(true)}
              className={cn(
                "text-sm font-bold uppercase tracking-widest hover:text-gray-500 transition-colors",
                "opacity-60 hover:opacity-100"
              )}
            >
              {t('nav.contact')}
            </button>
            <button
              onClick={toggleLanguage}
              className="text-sm font-bold uppercase tracking-widest hover:text-gray-500 transition-colors ml-4 border border-black px-3 py-1 rounded-full w-12 text-center"
            >
              {getLangLabel()}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden z-50 p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center space-y-8"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMenuOpen(false)}
                className="text-4xl font-black uppercase tracking-tighter hover:text-gray-500 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setShowContactModal(true);
              }}
              className="text-4xl font-black uppercase tracking-tighter hover:text-gray-500 transition-colors"
            >
              {t('nav.contact')}
            </button>
            <button
              onClick={() => {
                toggleLanguage();
                setIsMenuOpen(false);
              }}
              className="text-xl font-bold uppercase tracking-widest mt-8 border-2 border-black px-6 py-2 rounded-full"
            >
              Switch Language ({getLangLabel()})
            </button>
          </motion.div>
        )}
        
        {showContactModal && (
          <ContactModal onClose={() => setShowContactModal(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
