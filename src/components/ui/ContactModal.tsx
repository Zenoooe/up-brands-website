import { motion } from 'framer-motion';
import { X, Mail } from 'lucide-react';
import { FaBehance, FaWeixin, FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export const ContactModal = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, x: "-50%", y: "-50%" }}
        animate={{ scale: 1, opacity: 1, x: "-50%", y: "-50%" }}
        exit={{ scale: 0.9, opacity: 0, x: "-50%", y: "-50%" }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed top-1/2 left-1/2 z-[101] bg-white shadow-2xl rounded-2xl p-8 min-w-[320px] md:min-w-[500px]"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold uppercase tracking-widest text-black">
            {t('home.contact_title')}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Email */}
          <a
            href="mailto:up-brands@hotmail.com"
            className="flex flex-col items-center gap-3 group relative"
          >
            <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-lg">
              <Mail />
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
            <div className="w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-lg">
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
            <div className="w-16 h-16 bg-[#07C160] text-white rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-lg">
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
            <div className="w-16 h-16 bg-[#1769FF] text-white rounded-full flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-lg">
              <FaBehance />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:opacity-0 transition-opacity">Behance</span>
            <span className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-[#1769FF] text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">
              @up-brands
            </span>
          </a>
        </div>
      </motion.div>
    </>
  );
};
