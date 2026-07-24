import { useTranslation } from 'react-i18next';
import { Layout } from '../components/layout/Layout';
import { m, AnimatePresence } from 'framer-motion';
import { useBehanceProjects } from '../hooks/useBehanceProjects';
import { Project } from '../types';
import { useState, useEffect } from 'react';
import { FaBehance, FaWeixin, FaPinterest, FaLink } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SiXiaohongshu } from 'react-icons/si';
import { X } from 'lucide-react';
import { ContactModal } from '../components/ui/ContactModal';
import { SEO } from '../components/common/SEO';
import { ResponsiveImage } from '../components/ui/ResponsiveImage';
import { HeroInteraction } from '../components/home/HeroInteraction';
import { LoadingScreen } from '../components/ui/Spinner';
import { toast } from 'react-hot-toast';
import { getSupabaseUrl } from '../utils/image';

const ProjectCard = ({ project, index, onClick, priority = false }: { project: Project; index: number; onClick: (project: Project, e: React.MouseEvent) => void; priority?: boolean }) => {
  // Use backup URL if available, otherwise fallback to original imageUrl
  let displayUrl = project.backup_image_url || project.imageUrl;
  displayUrl = getSupabaseUrl(displayUrl, 600);
  
  return (
    <m.div
      onClick={(e) => onClick(project, e)}
      className="block w-full mb-12 md:mb-32 group cursor-pointer"
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-10%" }}
    >
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3] md:aspect-[3/4] lg:aspect-[4/5]">
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 z-10" />
        <div className="w-full h-full overflow-hidden">
          <m.div
            className="w-full h-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <ResponsiveImage
              src={displayUrl}
              alt={project.title}
              className="w-full h-full object-cover"
              priority={priority}
            />
          </m.div>
        </div>
      </div>
      
      <div className="mt-4 md:mt-6 flex flex-col items-start">
        <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4 decoration-black">
          {project.title}
        </h3>
        <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-widest mt-2">
          {project.category}
        </p>
        
        <a 
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-black text-white px-4 py-2 rounded-full hover:bg-[#1769FF] transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300"
        >
          <FaBehance size={14} />
          View on Behance
        </a>
      </div>
    </m.div>
  );
};

interface SpawnedImage {
  id: number;
  x: number;
  y: number;
  src: string;
  rotation: number;
  scale: number;
  createdAt: number;
}

const MarqueeBar = () => {
  const { t } = useTranslation();
  const content = t('home.marquee');
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white text-black py-3 overflow-hidden whitespace-nowrap z-20 border-t border-black/10">
      <div className="inline-flex animate-marquee gap-8">
        {[...Array(8)].map((_, i) => (
          <span key={i} className="text-sm tracking-[0.2em] uppercase font-medium">
            {content}
          </span>
        ))}
      </div>
    </div>
  );
};

const PlatformModal = ({ project, position, onClose }: { project: Project | null; position: { x: number, y: number } | null; onClose: () => void }) => {
  const { t, i18n } = useTranslation();
  const [forceActive, setForceActive] = useState(false);

  useEffect(() => {
    // Auto-trigger animation on mobile
    if (window.innerWidth < 768) {
      const timer = setTimeout(() => setForceActive(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!project || !position) return null;

  const projectUrl = `/project/${project.slug || project.id}`;
  const imageUrl = project.backup_image_url || project.imageUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(projectUrl);
    toast.success(t('common.linkCopied', 'Link copied!'));
  };

  const handlePinterestShare = () => {
    // Pinterest requires an absolute URL for the image
    // If it's a relative path or local, it won't work well. 
    // Assuming backup_image_url is a full Supabase URL or similar public URL.
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

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-transparent" 
        onClick={onClose}
      />
      <m.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          // Removed centering transforms to allow precise cursor positioning
          // translateX: '-50%',
          // translateY: '-50%',
        }}
        className="z-[101] bg-white shadow-xl rounded-xl p-4 min-w-[320px] border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
          <a 
            href={projectUrl}
            className={`group relative flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white text-black font-black uppercase tracking-widest text-sm overflow-hidden rounded-md border border-gray-100 transition-colors duration-300 hover:border-[#c0ac97] ${forceActive ? 'border-[#c0ac97]' : ''}`}
          >
            {/* Gold Sweep Layer */}
            <span className={`absolute inset-0 bg-[#c0ac97] transform origin-left transition-transform duration-500 ease-out ${forceActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
            
            {/* Content Layer */}
            <span className={`relative z-10 transition-colors duration-300 flex items-center justify-between w-full ${forceActive ? 'text-white' : 'group-hover:text-white'}`}>
              <span>{t('home.modal.title')}</span>
              <span>↗</span>
            </span>
          </a>
          <button 
            onClick={onClose}
            className="p-3 ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-start items-center gap-8 mb-5 px-4 pt-4 relative">
          <p className="absolute -top-1 left-4 text-[9px] font-bold uppercase tracking-widest text-gray-400 opacity-60">Also view on</p>
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group"
            title={t('home.modal.behance')}
          >
            <div className="w-12 h-12 bg-[#1769FF] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <FaBehance />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">Behance</span>
          </a>
          
          <a
            href={project.wechatLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col items-center gap-2 group ${!project.wechatLink ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
            title={t('home.modal.wechat')}
          >
            <div className="w-12 h-12 bg-[#07C160] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <FaWeixin />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">
              {i18n.language.startsWith('zh') ? '微信公众号' : 'WeChat'}
            </span>
          </a>

          <a
            href={project.redNoteLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col items-center gap-2 group ${!project.redNoteLink ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}`}
            title="RedNote"
          >
            <div className="w-12 h-12 bg-[#FF2442] text-white rounded-full flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              <SiXiaohongshu />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">
              {i18n.language.startsWith('zh') ? '小红书' : 'RedNote'}
            </span>
          </a>
        </div>

        {/* Share Section */}
        <div className="border-t border-gray-100 pt-3">
          {/* Removed title per request to reduce height */}
          {/* <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 text-center mb-2">SHARE PROJECT</p> */}
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

export default function Home() {
  const { t, i18n } = useTranslation();
  const { projects, loading } = useBehanceProjects();

  // Custom SEO for Home
  const seoTitle = t('seo.home.title', "Up-Brands - Leading Brand Strategy & Creative Marketing in GBA");
  const seoDesc = t('seo.home.description', "Based in GBA, Up-Brands specializes in brand strategy and creative vision, providing one-stop services from brand upgrade to digital marketing.");
  
  // Interactive Hero State
  // const [spawnedImages, setSpawnedImages] = useState<SpawnedImage[]>([]);
  // const lastSpawnPos = useRef({ x: 0, y: 0 });
  // const imageIdCounter = useRef(0);
  // const containerRef = useRef<HTMLDivElement>(null);
  
  // Modal States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalPosition, setModalPosition] = useState<{ x: number, y: number } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Auto open modal for specific URL hash (legacy support)
  useEffect(() => {
    if (window.location.hash === '#contact') {
      setShowContactModal(true);
    }
  }, []);

  const handleProjectClick = (project: Project, e: React.MouseEvent) => {
    // Get click coordinates relative to viewport
    const x = e.clientX;
    const y = e.clientY;
    
    // Calculate position to place "VIEW PROJECT" link directly under cursor
    // Modal padding is p-4 (16px)
    // Link is at top-left. We want cursor to be roughly over the text.
    // Offset X: 40px (padding + start of text)
    // Offset Y: 26px (padding + half line height)
    const targetX = x - 40;
    const targetY = y - 26;

    // Basic clamping to prevent top-left from disappearing off-screen
    // but allowing it to flow right/down naturally
    const clampedX = Math.max(10, Math.min(window.innerWidth - 50, targetX));
    const clampedY = Math.max(10, Math.min(window.innerHeight - 50, targetY));

    setModalPosition({ x: clampedX, y: clampedY });
    setSelectedProject(project);
  };

  const closeModal = () => {
    setSelectedProject(null);
    setModalPosition(null);
  };

  // Split projects for masonry layout
  const leftColumnProjects = projects.filter((_, i) => i % 2 === 0);
  const rightColumnProjects = projects.filter((_, i) => i % 2 !== 0);

  return (
    <Layout>
      <SEO 
        title={seoTitle}
        description={seoDesc}
        keywords={['Brand Strategy', 'Creative Design', 'Visual Identity', 'Digital Marketing', 'Greater Bay Area', 'Up-Brands', '品牌咨询', '品牌策略', '创意视觉', '珠海品牌设计', '大湾区设计']}
      />

      {/* Hidden H1 for SEO (Semantic Structure) */}
      <h1 className="sr-only">
        Up-Brands - Leading Brand Strategy, Creative Visual Design, and Digital Marketing Agency in Greater Bay Area.
        Providing VI design, packaging design, and social media marketing services.
      </h1>

      {/* Interactive Hero Section */}
      <section  
        className="relative w-full h-screen px-4 md:px-8 flex flex-col justify-end overflow-hidden cursor-crosshair pb-32"
      >
        {/* Interaction Layer (Background) */}
        <HeroInteraction projects={projects} />

        {/* Original Tagline (Foreground) */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-0 max-w-[90vw] md:max-w-[80vw] pointer-events-none"
        >
          <h2 className="text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.9] text-black mb-8 mix-blend-darken">
            {t('home.tagline')}
          </h2>
          <div className="w-full h-px bg-black/20 mt-8 md:mt-16" />
        </m.div>

        {/* Marquee Bar at the bottom of Hero Section */}
        <MarqueeBar />
      </section>

      {/* "We are Up-Brands" Section (Hybrid Design Style) */}
      <section className="w-full bg-[#1f2021] text-[#F3EFEA] py-32 md:py-48 relative overflow-hidden">
        {/* Top Decorative Strip */}
        <div className="absolute top-0 left-0 w-full h-4 md:h-8 bg-[#F3EFEA]/10" />
        
        <div className="px-4 md:px-8 max-w-[90vw]">
          <div className="flex flex-col gap-12 md:gap-24 relative z-10">
            <m.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold tracking-tight"
            >
              {t('home.about_title')}
            </m.h2>

            <m.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
              className="max-w-4xl"
            >
              <p className="text-xl md:text-3xl lg:text-4xl font-light leading-relaxed md:leading-relaxed text-[#F3EFEA]/90">
                {t('home.about_desc_1')}
                <br className="hidden md:block" />
                <span className="block mt-8 text-[#F3EFEA]/60">
                  {t('home.about_desc_2')}
                </span>
              </p>
            </m.div>
          </div>
          
          {/* Decorative Circle */}
          <m.div 
            initial={{ scale: 0, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            viewport={{ once: true }}
            className="absolute -right-32 -bottom-32 w-[600px] h-[600px] rounded-full border border-[#F3EFEA]/10"
          />
        </div>
      </section>

      {/* Projects Grid - Masonry Style */}
      <section className="w-full px-4 md:px-8 py-32 bg-white">
        {loading ? (
          <LoadingScreen className="h-96" />
        ) : (
          <div className="flex flex-col md:flex-row gap-8 md:gap-16 lg:gap-24">
            {/* Left Column */}
            <div className="w-full md:w-1/2 pt-0 md:pt-24">
              {leftColumnProjects.map((project, i) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  index={i} 
                  onClick={handleProjectClick}
                  priority={i === 0}
                />
              ))}
            </div>
            
            {/* Right Column */}
            <div className="w-full md:w-1/2">
              {rightColumnProjects.map((project, i) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  index={i} 
                  onClick={handleProjectClick}
                  priority={i === 0}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section className="w-full py-32 md:py-48 px-4 md:px-8 bg-black text-white text-center">
        <m.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold uppercase tracking-tighter mb-12">
            {t('home.contact_title')}
          </h2>
          <button 
            onClick={() => setShowContactModal(true)}
            className="inline-block text-xl md:text-2xl px-12 py-6 border border-white/30 hover:bg-white hover:text-black transition-colors duration-300 uppercase tracking-widest"
          >
            {t('home.contact_btn')}
          </button>
        </m.div>
      </section>

      {/* Platform Selection Modal */}
      <AnimatePresence>
        {selectedProject && modalPosition && (
          <PlatformModal 
            key="platform-modal"
            project={selectedProject} 
            position={modalPosition} 
            onClose={closeModal} 
          />
        )}
        {showContactModal && (
          <ContactModal key="contact-modal" onClose={() => setShowContactModal(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
