import { useTranslation } from 'react-i18next';
import { Layout } from '../components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useBehanceProjects } from '../hooks/useBehanceProjects';
import { Project } from '../types';
import { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { X } from 'lucide-react';
import { FaBehance, FaWeixin } from 'react-icons/fa';
import { SiXiaohongshu } from 'react-icons/si';
import { ContactModal } from '../components/ui/ContactModal';
import { SEO } from '../components/common/SEO';

function toWpImageProxyUrl(url: string) {
  const cleaned = url.replace(/^https?:\/\//, '');
  return `https://i0.wp.com/${cleaned}`;
}

function useSmartImageSrc(originalSrc: string) {
  const proxySrc = toWpImageProxyUrl(originalSrc);
  const [src, setSrc] = useState(originalSrc);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = false;
    setSrc(originalSrc);
    const timeoutId = window.setTimeout(() => {
      if (!loadedRef.current) setSrc(proxySrc);
    }, 30000);
    return () => window.clearTimeout(timeoutId);
  }, [originalSrc, proxySrc]);

  return {
    src,
    onLoad: () => {
      loadedRef.current = true;
    },
    onError: () => {
      setSrc(proxySrc);
    },
  };
}

const SpawnedPreviewImage = ({ src }: { src: string }) => {
  const smart = useSmartImageSrc(src);
  return (
    <img
      src={smart.src}
      alt="Project Preview"
      className="w-full h-full object-cover shadow-lg"
      onLoad={smart.onLoad}
      onError={smart.onError}
      referrerPolicy="no-referrer"
    />
  );
};

const ProjectCard = ({ project, index, onClick }: { project: Project; index: number; onClick: (project: Project, e: React.MouseEvent) => void }) => {
  // Use backup URL if available, otherwise fallback to original imageUrl
  // And use smart loader for further fallback (wp proxy) if needed
  const displayUrl = project.backup_image_url || project.imageUrl;
  const smart = useSmartImageSrc(displayUrl);
  
  return (
    <motion.div
      onClick={(e) => onClick(project, e)}
      className="block w-full mb-12 md:mb-32 group cursor-pointer"
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true, margin: "-10%" }}
    >
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3] md:aspect-[3/4] lg:aspect-[4/5]">
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 z-10" />
        <motion.img
          src={smart.src}
          alt={project.title}
          className="w-full h-full object-cover"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          onLoad={smart.onLoad}
          onError={smart.onError}
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="mt-4 md:mt-6 flex flex-col items-start">
        <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4 decoration-black">
          {project.title}
        </h3>
        <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-widest mt-2">
          {project.category}
        </p>
      </div>
    </motion.div>
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
  const { t } = useTranslation();
  if (!project || !position) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[100] bg-transparent" 
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          translateX: '-50%',
          translateY: '-50%',
        }}
        className="z-[101] bg-white shadow-xl rounded-xl p-4 min-w-[280px] border border-gray-100"
      >
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
            {t('home.modal.title')}
          </span>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex justify-around items-center gap-4">
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">WeChat</span>
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black">RedNote</span>
          </a>
        </div>
      </motion.div>
    </>
  );
};

export default function Home() {
  const { t, i18n } = useTranslation();
  const { projects, loading } = useBehanceProjects();

  // Custom SEO for Home
  const seoTitle = i18n.language.startsWith('zh') 
    ? "上游文创Up-Brands - 大湾区领先的品牌策略与创意营销解决方案"
    : "Up-Brands - Leading Brand Strategy & Creative Marketing in GBA";
    
  const seoDesc = i18n.language.startsWith('zh')
    ? "位于大湾区的上游文创专注于品牌策略和创意视觉，为企业提供从品牌升级到全网营销的一站式服务，助力品牌全面提升。"
    : "Based in GBA, Up-Brands specializes in brand strategy and creative vision, providing one-stop services from brand upgrade to digital marketing.";
  
  // Interactive Hero State
  const [spawnedImages, setSpawnedImages] = useState<SpawnedImage[]>([]);
  const lastSpawnPos = useRef({ x: 0, y: 0 });
  const imageIdCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Modal States
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalPosition, setModalPosition] = useState<{ x: number, y: number } | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  const handleProjectClick = (project: Project, e: React.MouseEvent) => {
    // Get click coordinates relative to viewport
    const x = e.clientX;
    const y = e.clientY;
    
    // Clamp values to keep modal somewhat on screen if clicked near edges
    const clampedX = Math.max(150, Math.min(window.innerWidth - 150, x));
    const clampedY = Math.max(100, Math.min(window.innerHeight - 100, y));

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

  // Auto-remove old images to keep it clean and fast
  useEffect(() => {
    if (spawnedImages.length > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        setSpawnedImages(prev => prev.filter(img => now - img.createdAt < 1500)); // Remove images older than 1.5s
      }, 200);
      return () => clearInterval(interval);
    }
  }, [spawnedImages]);

  const spawnImage = (x: number, y: number) => {
    // Calculate distance from last spawn
    const dist = Math.hypot(x - lastSpawnPos.current.x, y - lastSpawnPos.current.y);

    // Threshold distance to spawn new image (e.g., every 80px)
    if (dist > 80) {
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      if (!randomProject) return;
      
      const newImage: SpawnedImage = {
        id: imageIdCounter.current++,
        x,
        y,
        src: randomProject.backup_image_url || randomProject.imageUrl,
        rotation: Math.random() * 40 - 20, // -20 to 20 degrees
        scale: Math.random() * 0.3 + 0.8, // 0.8 to 1.1 scale
        createdAt: Date.now(),
      };

      setSpawnedImages(prev => {
        // Keep max 8 images to prevent clutter and ensure fast exit
        const newState = [...prev, newImage];
        if (newState.length > 8) return newState.slice(newState.length - 8);
        return newState;
      });

      lastSpawnPos.current = { x, y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || projects.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    spawnImage(x, y);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || projects.length === 0) return;

    // Use the first touch point
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    spawnImage(x, y);
  };

  return (
    <Layout>
      <SEO 
        title={seoTitle}
        description={seoDesc}
        keywords={['Brand Strategy', 'Creative Design', 'Visual Identity', 'Digital Marketing', 'Greater Bay Area', 'Up-Brands', '品牌咨询', '品牌策略', '创意视觉', '珠海品牌设计', '大湾区设计']}
      />

      {/* Interactive Hero Section */}
      <section 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full h-screen px-4 md:px-8 flex flex-col justify-end overflow-hidden cursor-crosshair pb-32"
      >
        {/* Interaction Layer (Background) */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <AnimatePresence>
            {spawnedImages.map((img) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.5, x: img.x - 150, y: img.y - 100 }}
                animate={{ opacity: 1, scale: img.scale, x: img.x - 150, y: img.y - 100 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
                transition={{ duration: 0.4, ease: "backOut" }}
                className="absolute w-[300px] h-[200px] shadow-2xl origin-center"
                style={{ 
                  rotate: img.rotation,
                }}
              >
                <SpawnedPreviewImage src={img.src} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Original Tagline (Foreground) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative z-0 max-w-[90vw] md:max-w-[80vw] pointer-events-none"
        >
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.9] text-black mb-8 mix-blend-darken">
            {t('home.tagline')}
          </h1>
          <div className="w-full h-px bg-black/20 mt-8 md:mt-16" />
        </motion.div>

        {/* Marquee Bar at the bottom of Hero Section */}
        <MarqueeBar />
      </section>

      {/* "We are Up-Brands" Section (Hybrid Design Style) */}
      <section className="w-full bg-[#1f2021] text-[#F3EFEA] py-32 md:py-48 relative overflow-hidden">
        {/* Top Decorative Strip */}
        <div className="absolute top-0 left-0 w-full h-4 md:h-8 bg-[#F3EFEA]/10" />
        
        <div className="px-4 md:px-8 max-w-[90vw]">
          <div className="flex flex-col gap-12 md:gap-24 relative z-10">
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl md:text-6xl font-bold tracking-tight"
            >
              {t('home.about_title')}
            </motion.h2>

            <motion.div 
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
            </motion.div>
          </div>
          
          {/* Decorative Circle */}
          <motion.div 
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
          <div className="w-full h-96 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
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
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Contact Section */}
      <section className="w-full py-32 md:py-48 px-4 md:px-8 bg-black text-white text-center">
        <motion.div
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
        </motion.div>
      </section>

      {/* Platform Selection Modal */}
      <AnimatePresence>
        {selectedProject && modalPosition && (
          <PlatformModal 
            project={selectedProject} 
            position={modalPosition}
            onClose={closeModal} 
          />
        )}
        {showContactModal && (
          <ContactModal onClose={() => setShowContactModal(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
