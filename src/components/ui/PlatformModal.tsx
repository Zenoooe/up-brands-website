import { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { FaBehance, FaWeixin, FaPinterest, FaLink, FaDribbble, FaInstagram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SiXiaohongshu, SiZcool } from 'react-icons/si';
import { Project } from '../../types';
import { getValidImageUrl } from '../../utils/image';

interface PlatformModalProps {
  project: Project | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  mode?: 'view' | 'contact';
  onContactClick?: () => void;
}

export const PlatformModal = ({ project, position, onClose, mode = 'view', onContactClick }: PlatformModalProps) => {
  const { t, i18n } = useTranslation();
  const [forceActive, setForceActive] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 768) {
      const timer = setTimeout(() => setForceActive(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!project || !position) return null;

  const projectUrl = `/project/${project.slug || project.id}`;
  const imageUrl = getValidImageUrl(project.backup_image_url, project.imageUrl);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + projectUrl);
    toast.success(t('common.linkCopied', 'Link copied!'));
  };

  const handlePinterestShare = () => {
    const url = encodeURIComponent(window.location.origin + projectUrl);
    const media = encodeURIComponent(imageUrl);
    const description = encodeURIComponent(project.title + " by Up-Brands");
    window.open(`https://pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`Check out ${project.title} by Up-Brands`);
    const url = encodeURIComponent(window.location.origin + projectUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const ButtonContent = () => (
    <>
      <span className={`absolute inset-0 bg-[#c0ac97] transform origin-left transition-transform duration-500 ease-out ${forceActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
      <span className={`relative z-10 transition-colors duration-300 flex items-center justify-between w-full ${forceActive ? 'text-white' : 'group-hover:text-white'}`}>
        <span>{mode === 'view' ? t('home.modal.title', 'VIEW PROJECT') : t('home.modal.contact', 'CONTACT')}</span>
        <span>↗</span>
      </span>
    </>
  );

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-transparent" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
        }}
        className="z-[101] bg-white shadow-xl rounded-xl p-4 min-w-[320px] border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
          {mode === 'view' ? (
            <Link
              to={projectUrl}
              className={`group relative flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-black font-black uppercase tracking-widest text-sm overflow-hidden rounded-md border border-gray-100 transition-colors duration-300 hover:border-[#c0ac97] ${forceActive ? 'border-[#c0ac97]' : ''}`}
            >
              <ButtonContent />
            </Link>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onContactClick) onContactClick();
              }}
              className={`group relative flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-black font-black uppercase tracking-widest text-sm overflow-hidden rounded-md border border-gray-100 transition-colors duration-300 hover:border-[#c0ac97] ${forceActive ? 'border-[#c0ac97]' : ''}`}
            >
              <ButtonContent />
            </button>
          )}
          <button onClick={onClose} className="p-3 ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-wrap justify-start items-center gap-6 mb-5 px-4 pt-4 relative">
          <p className="absolute -top-1 left-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 opacity-60 w-full">Also view on</p>
          
          {project.link && (
            <a href={project.link} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title={t('home.modal.behance')}>
              <div className="w-12 h-12 bg-[#1769FF] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm"><FaBehance /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">Behance</span>
            </a>
          )}
          
          {project.wechatLink && (
            <a href={project.wechatLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title={t('home.modal.wechat')}>
              <div className="w-12 h-12 bg-[#07C160] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm"><FaWeixin /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">
                {i18n.language.startsWith('zh') ? '微信公众号' : 'WeChat'}
              </span>
            </a>
          )}

          {project.redNoteLink && (
            <a href={project.redNoteLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title="RedNote">
              <div className="w-12 h-12 bg-[#FF2442] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm"><SiXiaohongshu /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">
                {i18n.language.startsWith('zh') ? '小红书' : 'RedNote'}
              </span>
            </a>
          )}

          {project.dribbbleLink && (
            <a href={project.dribbbleLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title="Dribbble">
              <div className="w-12 h-12 bg-[#EA4C89] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm"><FaDribbble /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">Dribbble</span>
            </a>
          )}

          {project.zcoolLink && (
            <a href={project.zcoolLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title="站酷 Zcool">
              <div className="w-12 h-12 bg-[#F3D024] text-black rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm"><SiZcool /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">站酷</span>
            </a>
          )}

          {project.gutianluLink && (
            <a href={project.gutianluLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title="古田路9号">
              <div className="w-12 h-12 bg-[#1A1A1A] text-white rounded-full flex items-center justify-center text-[11px] font-black group-hover:scale-110 transition-transform shadow-sm tracking-wider">G9</div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">古田路9号</span>
            </a>
          )}

          {project.instagramLink && (
            <a href={project.instagramLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title="Instagram">
              <div className="w-12 h-12 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-sm"><FaInstagram /></div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">Instagram</span>
            </a>
          )}

          {project.worldBrandSocietyLink && (
            <a href={project.worldBrandSocietyLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title="World Brand Design Society">
              <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-black group-hover:scale-110 transition-transform shadow-sm">WBDS</div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black text-center leading-[1.1]">World<br/>Brand</span>
            </a>
          )}

          {project.packagingOfTheWorldLink && (
            <a href={project.packagingOfTheWorldLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title="Packaging of the World">
              <div className="w-12 h-12 bg-[#00A1E0] text-white rounded-full flex items-center justify-center text-[9px] font-black group-hover:scale-110 transition-transform shadow-sm">POTW</div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black text-center leading-[1.1]">Packaging<br/>World</span>
            </a>
          )}

          {project.abduzeedoLink && (
            <a href={project.abduzeedoLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title="Abduzeedo">
              <div className="w-12 h-12 bg-[#FF3E00] text-white rounded-full flex items-center justify-center text-[9px] font-black group-hover:scale-110 transition-transform shadow-sm">ABDZ</div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black text-center leading-[1.1]">Abduzeedo</span>
            </a>
          )}

          {project.inspirationGridLink && (
            <a href={project.inspirationGridLink} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 group" title="The Inspiration Grid">
              <div className="w-12 h-12 bg-[#111111] text-white rounded-full flex items-center justify-center text-[9px] font-black group-hover:scale-110 transition-transform shadow-sm">TIG</div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black text-center leading-[1.1]">Inspiration<br/>Grid</span>
            </a>
          )}
        </div>

        <div className="border-t border-gray-100 pt-3">
          <div className="flex justify-center gap-3 pt-1">
            <button onClick={handlePinterestShare} className="text-gray-400 hover:text-[#E60023] transition-colors" title="Pin on Pinterest">
              <FaPinterest size={18} />
            </button>
            <button onClick={handleTwitterShare} className="text-gray-400 hover:text-black transition-colors" title="Share on X">
              <FaXTwitter size={18} />
            </button>
            <button onClick={handleCopyLink} className="text-gray-400 hover:text-black transition-colors" title="Copy Link">
              <FaLink size={18} />
            </button>
          </div>
        </div>
      </m.div>
    </>
  );
};