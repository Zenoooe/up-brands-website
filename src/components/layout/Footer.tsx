import { useTranslation } from 'react-i18next';
import { ArrowRight, Loader2 } from 'lucide-react';
import LogoFont from '../../assets/logofont.svg';
import { motion } from 'framer-motion';
import { useState, FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert({ email });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast.error('This email is already subscribed!');
        } else {
          throw error;
        }
      } else {
        toast.success('Successfully subscribed!');
        setEmail('');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="w-full bg-[#1f2021] text-[#F3EFEA] pt-20 pb-12 px-4 md:px-8 overflow-hidden font-sans">
      {/* Top Section with Logo and Menu Icon Placeholder */}
      <div className="w-full flex justify-between items-start mb-20 md:mb-32 relative">
        <div className="w-full border-b border-[#F3EFEA]/20 pb-4">
           {/* Massive Headline */}
           <div className="w-full overflow-hidden">
             <motion.img 
               initial={{ pathLength: 0, opacity: 0 }}
               whileInView={{ pathLength: 1, opacity: 1 }}
               transition={{ duration: 1.5, ease: "easeInOut" }}
               src={LogoFont} 
               alt="Up-Brands" 
               className="w-full h-auto mix-blend-difference"
             />
           </div>
        </div>
      </div>

      <div className="container mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
        {/* Column 1: Socials & Copyright (Span 3) */}
        <div className="md:col-span-3 flex flex-col justify-between h-full min-h-[240px]">
          <div className="flex flex-col gap-4">
            <a href="https://www.linkedin.com/company/up_brands/" target="_blank" rel="noopener noreferrer" className="text-2xl font-normal hover:opacity-70 transition-opacity">
              LinkedIn
            </a>
            <a href="https://www.instagram.com/up.brands_/" target="_blank" rel="noopener noreferrer" className="text-2xl font-normal hover:opacity-70 transition-opacity">
              Instagram
            </a>
            <a href="https://www.behance.net/up-brands" target="_blank" rel="noopener noreferrer" className="text-2xl font-normal hover:opacity-70 transition-opacity">
              Behance
            </a>
            <a href="https://mp.weixin.qq.com/s/bSMmQyzfit5OIACx9uZ8kw" target="_blank" rel="noopener noreferrer" className="text-2xl font-normal hover:opacity-70 transition-opacity">
              {t('footer.wechat')}
            </a>
            <a href="https://www.xiaohongshu.com/user/profile/663a1f290000000007005cc2" target="_blank" rel="noopener noreferrer" className="text-2xl font-normal hover:opacity-70 transition-opacity">
              {t('footer.xiaohongshu')}
            </a>
          </div>
          
          <div className="mt-auto text-xs text-[#F3EFEA]/60 font-light pt-8">
            ©Up-Brands {currentYear}. {t('footer.rights')}
          </div>
        </div>

        {/* Column 2: Newsletter (Span 5) */}
        <div className="md:col-span-5 flex flex-col justify-end">
          <div className="w-full max-w-md">
            <h3 className="text-sm font-medium mb-6">{t('footer.keep_touch')}</h3>
            <form onSubmit={handleSubscribe} className="relative border-b border-[#F3EFEA] pb-2 group flex items-center">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer.email_placeholder')} 
                className="w-full bg-transparent border-none outline-none text-[#F3EFEA] placeholder-[#F3EFEA]/40 text-lg py-2 pr-12"
                disabled={loading}
              />
              <button 
                type="submit"
                disabled={loading}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full border border-[#F3EFEA] hover:bg-[#F3EFEA] hover:text-[#1f2021] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
              </button>
            </form>
          </div>
        </div>

        {/* Column 3: Contact & Location (Span 4) */}
        <div className="md:col-span-4 grid grid-cols-2 gap-8">
          {/* Let's Talk */}
          <div className="flex flex-col gap-8">
            <h3 className="text-lg font-medium">{t('footer.lets_talk')}</h3>
            
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#F3EFEA]/60 mb-1">{t('footer.new_business')}</span>
              <a href="mailto:up-brands@hotmail.com" className="text-sm hover:underline">up-brands@hotmail.com</a>
              <a href="tel:+8616626206849" className="text-sm hover:underline">+86 166-2620-6849</a>
              <a href="tel:+85253311007" className="text-sm hover:underline">+852 5331 1007</a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#F3EFEA]/60 mb-1">{t('footer.careers')}</span>
              <a href="mailto:up-brands@hotmail.com" className="text-sm hover:underline">up-brands@hotmail.com</a>
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-8">
            <h3 className="text-lg font-medium">{t('footer.location')}</h3>
            
            <div className="flex flex-col gap-1">
              <p className="text-sm leading-relaxed text-[#F3EFEA]/80">
                {t('footer.address_line1')}<br />
                {t('footer.address_line2')}<br />
                {t('footer.address_line3')}<br />
                {t('footer.address_line4')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
