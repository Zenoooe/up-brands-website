import { useTranslation } from 'react-i18next';
import { Layout } from '../components/layout/Layout';
import { m, AnimatePresence } from 'framer-motion';
import { useBehanceProjects } from '../hooks/useBehanceProjects';
import { Project } from '../types';
import { useState, useEffect, useMemo } from 'react';
import { FaBehance, FaWeixin, FaPinterest, FaLink, FaDribbble, FaInstagram } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { SiXiaohongshu, SiZcool } from 'react-icons/si';
import { X } from 'lucide-react';
import { ContactModal } from '../components/ui/ContactModal';
import { PlatformModal } from '../components/ui/PlatformModal';
import { SEO } from '../components/common/SEO';
import { HeroInteraction } from '../components/home/HeroInteraction';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getSupabaseUrl, getValidImageUrl } from '../utils/image';
import { supabase } from '../lib/supabase';
import { getCanonicalUrl, getProjectImageAlt } from '../utils/seo';
import { getProjectDisplayCategory, getProjectDisplaySubtitle } from '../../shared/project-metadata';
import { FilterBar } from '../components/home/FilterBar';
import { ServicesSection } from '../components/home/ServicesSection';
import { parseProjectTags } from '../utils/tags';

const ProjectCard = ({ project, onClick, priority = false }: { project: Project; index: number; onClick: (project: Project, e: React.MouseEvent) => void; priority?: boolean }) => {
  // Use backup URL if valid, otherwise fallback to original imageUrl
  let displayUrl = getValidImageUrl(project.backup_image_url, project.imageUrl);
  displayUrl = getSupabaseUrl(displayUrl, 600); // Optimization for non-supabase URLs
  
  return (
    <m.div
      layout
      onClick={(e) => onClick(project, e)}
      className="block w-full mb-12 md:mb-32 group cursor-pointer"
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.1 }}
    >
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3] md:aspect-[3/4] lg:aspect-[4/5]">
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 z-10" />
        <div className="w-full h-full overflow-hidden">
          <m.div
            className="w-full h-full"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {/* Standard img tag is faster than ResponsiveImage for simple grid items */}
            <img
              src={displayUrl}
              alt={getProjectImageAlt(project)}
              className="w-full h-full object-cover block"
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priority ? "high" : "auto"}
              sizes="(max-width: 768px) 100vw, 50vw"
              width={600}
              height={800}
              referrerPolicy="no-referrer"
            />
          </m.div>
        </div>
      </div>
      
      <div className="mt-4 md:mt-6 flex flex-col items-start">
        <h3 className="text-2xl md:text-3xl font-bold uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4 decoration-black">
          {project.title}
        </h3>
        <p className="text-xs md:text-sm font-medium text-gray-500 uppercase tracking-widest mt-2">
          {getProjectDisplaySubtitle(project) || getProjectDisplayCategory(project)}
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


export default function Home() {
  const { t } = useTranslation();
  const { projects, loading } = useBehanceProjects();

  // Custom SEO for Home
  // Shortened title to fix "Title too long" issue (keep it under ~60 chars)
  const seoTitle = t('seo.home.title', "Up-Brands | Brand Strategy & Creative Marketing Expert");
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
  const [enableClickSpawn, setEnableClickSpawn] = useState(true);
  const [enableMachineGun, setEnableMachineGun] = useState(true);
  const [machineGunInterval, setMachineGunInterval] = useState(200);

  // Filter States
  const [selectedService, setSelectedService] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  
  const [dynamicServices, setDynamicServices] = useState<string[]>([]);
  const [dynamicIndustries, setDynamicIndustries] = useState<string[]>([]);
  const [translationsMap, setTranslationsMap] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadTagsFromSettings() {
      try {
        const [servicesRes, industriesRes] = await Promise.all([
          supabase.from('settings').select('value').eq('key', 'services_hierarchy').maybeSingle(),
          supabase.from('settings').select('value').eq('key', 'industries_list').maybeSingle()
        ]);
        
        const sSet = new Set<string>();
        const iSet = new Set<string>();
        const tMap: Record<string, string> = {};
        
        if (servicesRes.data && servicesRes.data.value) {
          servicesRes.data.value.forEach((cat: any) => {
            if (cat.items && Array.isArray(cat.items)) {
              cat.items.forEach((item: any) => {
                if (item.en) {
                  // Only add to filter if explicitly allowed (defaults to true if undefined)
                  if (item.showInFilter !== false) {
                    sSet.add(item.en);
                  }
                  if (item.zh) tMap[item.en] = item.zh;
                }
              });
            }
          });
        }
        
        if (industriesRes.data && industriesRes.data.value) {
          industriesRes.data.value.forEach((ind: any) => {
            if (ind.en) {
              // Only add to filter if explicitly allowed (defaults to true if undefined)
              if (ind.showInFilter !== false) {
                iSet.add(ind.en);
              } else {
                console.log("Excluding industry from filter:", ind.en);
              }
              if (ind.zh) tMap[ind.en] = ind.zh;
            }
          });
        }
        
        console.log("Loaded tags from Supabase:", { sSet: Array.from(sSet), iSet: Array.from(iSet) });
        setDynamicServices(Array.from(sSet).sort());
        setDynamicIndustries(Array.from(iSet).sort());
        setTranslationsMap(tMap);
      } catch (e) {
        console.error('Failed to load tags from settings for FilterBar', e);
      }
    }
    
    loadTagsFromSettings();
  }, []);

  // Use the dynamic services for the filter dropdown.
  // We no longer automatically merge project tags into the filter dropdown 
  // because the user wants explicit control via the Admin panel checkboxes.
  const { availableServices, availableIndustries } = useMemo(() => {
    // If the database has absolutely no tags configured yet, we can fallback to project tags.
    // Otherwise, we strictly use what is checked in the admin panel.
    const services = new Set<string>(dynamicServices);
    const industries = new Set<string>(dynamicIndustries);
    
    if (dynamicServices.length === 0 || dynamicIndustries.length === 0) {
      console.log("Falling back to project tags because dynamic tags are empty");
      projects.forEach(p => {
        const tags = parseProjectTags(p.category);
        if (dynamicServices.length === 0) tags.services.forEach(s => services.add(s));
        if (dynamicIndustries.length === 0) tags.industries.forEach(i => industries.add(i));
      });
    }
    
    return {
      availableServices: Array.from(services).sort(),
      availableIndustries: Array.from(industries).sort()
    };
  }, [projects, dynamicServices, dynamicIndustries]);

  // Filter projects based on selections
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const tags = parseProjectTags(p.category);
      const matchService = !selectedService || tags.services.includes(selectedService);
      const matchIndustry = !selectedIndustry || tags.industries.includes(selectedIndustry);
      return matchService && matchIndustry;
    });
  }, [projects, selectedService, selectedIndustry]);

  useEffect(() => {
    // TEMPORARY: Clear cache to force load new mock tags for testing
    sessionStorage.removeItem('behance_projects_cache');
    sessionStorage.removeItem('behance_projects_timestamp');

    const fetchSettings = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'hero_interaction')
        .single();
      
      if (data?.value) {
        setEnableClickSpawn(data.value.enable_click_spawn !== false);
        setEnableMachineGun(data.value.enable_machine_gun !== false);
        if (data.value.machine_gun_interval) {
          setMachineGunInterval(data.value.machine_gun_interval);
        }
      }
    };
    fetchSettings();
  }, []);

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
  const leftColumnProjects = filteredProjects.filter((_, i) => i % 2 === 0);
  const rightColumnProjects = filteredProjects.filter((_, i) => i % 2 !== 0);

  return (
    <Layout>
      <SEO 
        title={seoTitle}
        description={seoDesc}
        url={getCanonicalUrl('/')}
        keywords={['Brand Strategy', 'Creative Design', 'Visual Identity', 'Digital Marketing', 'Greater Bay Area', 'Up-Brands', '品牌咨询', '品牌策略', '创意视觉', '珠海品牌设计', '大湾区设计']}
      />

      {/* Keep one concise page-level H1 for crawlers and accessibility */}
      <h1 className="sr-only">
        Up-Brands 上游文创 | Brand Strategy and Creative Design
      </h1>

      {/* Interactive Hero Section */}
      <section  
        className="relative w-full h-[100dvh] px-4 md:px-8 flex flex-col justify-end overflow-hidden cursor-crosshair pb-20 sm:pb-24 md:pb-32 z-10"
      >
        {/* Interaction Layer (Background) */}
        <HeroInteraction 
          projects={projects} 
          enableClickSpawn={enableClickSpawn} 
          enableMachineGun={enableMachineGun}
          machineGunInterval={machineGunInterval}
        />

        {/* 
            DUAL LAYER STRATEGY:
            To ensure PERFECT alignment, we use a shared container div that holds both layers.
            Layer 1 (Bottom): z-0, Black Text.
            Layer 2 (Top): z-50, Overlay Blend Mode.
            
            By putting them in the SAME relative parent with absolute positioning on the children,
            they will always share the exact same coordinate space regardless of window resizing.
        */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-[95vw] sm:max-w-[90vw] md:max-w-[80vw] pointer-events-none"
        >
          {/* Layer 1: Bottom (Solid Black) - behind images */}
          <div className="relative z-0">
             <h2 className="text-[2.5rem] sm:text-[3.5rem] md:text-6xl lg:text-8xl xl:text-9xl font-black uppercase tracking-tighter leading-[0.9] text-black mb-4 sm:mb-6 md:mb-8">
               {t('home.tagline')}
             </h2>
             <div className="w-full h-px bg-black/20 mt-4 sm:mt-6 md:mt-16" />
          </div>

          {/* Layer 2: Top (Overlay Watermark) - on top of images */}
          {/* Absolute positioning relative to the parent container ensures pixel-perfect overlap */}
          <div className="absolute inset-0 z-50 mix-blend-overlay opacity-50 pointer-events-none">
             <h2 className="text-[2.5rem] sm:text-[3.5rem] md:text-6xl lg:text-8xl xl:text-9xl font-black uppercase tracking-tighter leading-[0.9] text-white mb-4 sm:mb-6 md:mb-8">
               {t('home.tagline')}
             </h2>
             {/* Divider not needed in overlay layer */}
          </div>
        </m.div>

        {/* Marquee Bar at the bottom of Hero Section */}
        <MarqueeBar />
      </section>

      {/* "We are Up-Brands" Section (Hybrid Design Style) */}
      <section className="w-full bg-[#1f2021] text-[#F3EFEA] py-32 md:py-48 relative overflow-hidden z-20">
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

      {/* Services Section */}
      <ServicesSection />

      {/* Filter Bar */}
      <FilterBar 
        services={availableServices}
        industries={availableIndustries}
        selectedService={selectedService}
        selectedIndustry={selectedIndustry}
        onServiceChange={setSelectedService}
        onIndustryChange={setSelectedIndustry}
        translationsMap={translationsMap}
      />

      {/* Projects Grid - Masonry Style */}
      <section className="w-full px-4 md:px-8 py-16 md:py-32 bg-white relative z-20">
        {loading ? (
          <div className="w-full h-96 flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 lg:gap-24 items-start w-full">
            {/* Left Column */}
            <div className="w-full flex flex-col">
              <AnimatePresence>
                {leftColumnProjects.map((project, i) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    index={i} 
                    onClick={handleProjectClick}
                    priority={i === 0}
                  />
                ))}
              </AnimatePresence>
            </div>
            
            {/* Right Column - Add top padding to create staggered/masonry effect */}
            <div className="w-full pt-0 md:pt-32 flex flex-col">
              <AnimatePresence>
                {rightColumnProjects.map((project, i) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    index={i} 
                    onClick={handleProjectClick}
                    priority={false}
                  />
                ))}
              </AnimatePresence>
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
