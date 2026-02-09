import { Layout } from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useBehanceProjects } from '../hooks/useBehanceProjects';
import { SEO } from '../components/common/SEO';
import { Link, useParams, Navigate } from 'react-router-dom';
import { FaBehance, FaPinterest, FaTwitter, FaLink } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import * as OpenCC from 'opencc-js';
import DOMPurify from 'dompurify';

export default function ProjectDetail() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  
  // Initialize converters
  const cn2tw = useMemo(() => OpenCC.Converter({ from: 'cn', to: 'tw' }), []);
  const tw2cn = useMemo(() => OpenCC.Converter({ from: 'tw', to: 'cn' }), []);
  const { projects, loading: listLoading } = useBehanceProjects();
  
  // All Hooks MUST be at the top level
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nextProject, setNextProject] = useState<any>(null);
  const [prevProject, setPrevProject] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const relatedProjects = useMemo(() => {
    if (!projects) return [];
    return projects.filter(p => p.id !== project?.id && p.is_visible !== false);
  }, [projects, project]);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isDragging = useRef(false);

  // Scroll to top when project ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const onMouseDown = (e: React.MouseEvent) => {
    isDown.current = true;
    isDragging.current = false;
    if (sliderRef.current) {
      // Temporarily disable snap to allow smooth dragging
      sliderRef.current.style.scrollSnapType = 'none';
      sliderRef.current.style.scrollBehavior = 'auto'; // Force instant update for drag
      sliderRef.current.style.cursor = 'grabbing';
      startX.current = e.pageX - sliderRef.current.offsetLeft;
      scrollLeft.current = sliderRef.current.scrollLeft;
    }
  };

  const onMouseLeave = () => {
    isDown.current = false;
    if (sliderRef.current) {
      sliderRef.current.style.scrollSnapType = 'x mandatory';
      sliderRef.current.style.scrollBehavior = 'smooth';
      sliderRef.current.style.cursor = 'grab';
    }
  };

  const onMouseUp = () => {
    isDown.current = false;
    if (sliderRef.current) {
      sliderRef.current.style.scrollSnapType = 'x mandatory';
      sliderRef.current.style.scrollBehavior = 'smooth';
      sliderRef.current.style.cursor = 'grab';
    }
    // Small timeout to prevent triggering click if it was a drag
    setTimeout(() => {
      isDragging.current = false;
    }, 50);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current) return;
    e.preventDefault();
    if (sliderRef.current) {
      const x = e.pageX - sliderRef.current.offsetLeft;
      // 1:1 movement feels more natural than 1.5 or 2
      const walk = (x - startX.current) * 1; 
      // If moved significantly, mark as dragging to prevent link click
      if (Math.abs(walk) > 5) isDragging.current = true;
      sliderRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };
  
  // Capture clicks to prevent navigation if dragging
  const onClickCapture = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  // 1. Sync with list data first
  useEffect(() => {
    if (projects.length > 0 && id) {
      // Find by ID OR Slug
      const currentIndex = projects.findIndex(p => p.id === id || p.slug === id);
      if (currentIndex !== -1) {
        setProject(projects[currentIndex]);
        setPrevProject(currentIndex > 0 ? projects[currentIndex - 1] : null);
        setNextProject(currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null);
      }
    }
  }, [projects, id]);

  // 2. Fetch fresh data
  useEffect(() => {
    async function fetchProjectDetail() {
      if (!id) return;
      if (!project) setLoading(true);

      try {
        // Try fetching by ID first
        let { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        // If not found by ID, try fetching by SLUG
        if (!data) {
           const { data: slugData } = await supabase
            .from('projects')
            .select('*')
            .eq('slug', id) // The 'id' param from URL might actually be a slug
            .single();
           data = slugData;
        }

        if (data) {
          setProject(data);
        }
      } catch (e) {
        console.error('Error fetching project detail:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectDetail();
  }, [id]);
  
  // Render loading state
  if (loading && !project) {
    return (
      <Layout>
        <div className="w-full h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // Render not found state
  if (!project) {
    return <Navigate to="/" replace />;
  }

  const isHybridLayout = true; 
  const currentUrl = window.location.href;
  const imageUrl = project.backup_image_url || project.imageUrl;

  // Multi-language Description Logic
  const descriptionEn = project.description_en;
  const descriptionZh = project.description;
  
  // Logic:
  // 1. If English mode -> Show English (fallback to Chinese)
  // 2. If Traditional mode -> Convert Chinese to Traditional
  // 3. If Simplified mode -> Show Chinese (or Convert Traditional to Simplified if source was Trad)
  
  let description = descriptionZh || "Turning paper into possibility with an inspiring packaging collection.";

  if (i18n.language.startsWith('en') && descriptionEn) {
    description = descriptionEn;
  } else if (i18n.language.includes('TW') || i18n.language.includes('Hant') || i18n.language === 'zh-HK') {
    // Auto-convert to Traditional Chinese
    description = cn2tw(descriptionZh || "");
  } else {
    // Default / Simplified
    // Optional: if your source is actually Traditional, you could use tw2cn here
    // description = tw2cn(descriptionZh || "");
  }

  // Sanitize HTML
  const cleanDescription = DOMPurify.sanitize(description);
  // Estimate text length for collapse logic (strip tags)
  const textLength = cleanDescription.replace(/<[^>]+>/g, '').length;
  const isLongDescription = textLength > 150; 
  
  // SEO Keywords
  const seoKeywords = project.category 
    ? project.category.split(',').map((c: string) => c.trim()) 
    : ['Brand Strategy', 'Visual Identity', 'Packaging Design'];

  return (
    <Layout>
      <SEO
        title={project.title}
        description={cleanDescription.replace(/<[^>]+>/g, '').substring(0, 160)} // Truncate for SEO
        image={imageUrl}
        type="website" // Change to website but let SEO component detect project URL
        url={currentUrl}
        keywords={seoKeywords}
        author="Up-Brands"
      />

      <article className="w-full bg-[#F5F2EA] min-h-screen text-[#1A1A1A]">
        {/* Full Screen Hero Image */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full h-screen relative"
        >
          <img 
            src={imageUrl} 
            alt={project.title} 
            className="w-full h-full object-cover"
            loading="eager" // Hero image should load eagerly
            fetchPriority="high"
          />
        </motion.div>

        {/* Hybrid Design Info Section */}
        <div className="max-w-[1600px] mx-auto pt-24 pb-24 px-8 md:px-16 grid grid-cols-1 md:grid-cols-12 gap-12">
           {/* Left Column: Title */}
           <div className="md:col-span-7 relative">
             <div className="flex items-start gap-4">
               <h1 className="text-7xl md:text-9xl font-bold leading-[0.9] tracking-tighter">
                 {project.title.split(' ').map((word: string, i: number) => (
                   <span key={i} className="block">{word}</span>
                 ))}
               </h1>
               <div className="w-8 h-8 md:w-12 md:h-12 bg-[#1A1A1A] rounded-full mt-4 flex-shrink-0" />
             </div>
             
             {/* Tags/Category */}
             <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium uppercase tracking-wider text-gray-600">
               {project.category.split(',').map((tag: string) => (
                 <span key={tag} className="border-b border-transparent hover:border-gray-900 transition-colors cursor-default">
                   {tag.trim()}
                 </span>
               ))}
             </div>
           </div>

           {/* Right Column: Description & Credits */}
           <div className="md:col-span-5 flex flex-col justify-between">
              <div>
                <div className="mb-8">
                  <div 
                    className={`text-xl md:text-2xl font-medium leading-relaxed [&>p]:mb-6 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 ${
                      !isExpanded && isLongDescription ? 'line-clamp-3 overflow-hidden' : ''
                    }`}
                    dangerouslySetInnerHTML={{ __html: cleanDescription }}
                  />
                  
                  {isLongDescription && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="mt-2 text-sm font-bold uppercase tracking-widest border-b border-black pb-0.5 hover:opacity-60 transition-opacity"
                    >
                      {isExpanded ? 'Collapse' : 'Read More'}
                    </button>
                  )}
                </div>
                
                {/* Credits Grid */}
                <div className="grid grid-cols-2 gap-y-8 gap-x-4 mt-12">
                   {project.credits && Object.entries(project.credits).map(([role, name]) => (
                     <div key={role}>
                       <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">{role}</h3>
                       <p className="text-sm font-medium">{name as string}</p>
                     </div>
                   ))}
                </div>
              </div>
           </div>
        </div>

        {/* Project Gallery - Configurable Layout */}
        <div className={`w-full ${project.gallery_layout === 'centered' ? 'max-w-[1400px] mx-auto px-8' : ''}`}>
          {/* Project Detail Images */}
          {project.images && project.images.length > 0 && (
            <div 
              className={`w-full grid ${
                 project.gallery_layout === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 
                 project.gallery_layout === 'centered' ? 'grid-cols-1 gap-y-12' : 
                 'grid-cols-1 md:grid-cols-2' // Default 'full'
              }`}
              style={{ gap: project.image_gap ? `${project.image_gap}px` : '0px' }}
            >
              {project.images.map((img: string, index: number) => (
                <div 
                  key={index} 
                  className={`w-full relative ${
                    // Hybrid rhythm for 'full' layout: alternating 2-col vs 1-col
                    project.gallery_layout === 'full' && (index + 1) % 3 === 0 ? 'md:col-span-2' : 'h-full'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`${project.title} detail ${index + 1}`}
                    className={`w-full object-cover block ${
                       project.gallery_layout === 'full' && (index + 1) % 3 !== 0 ? 'h-full' : 'h-auto'
                    }`}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Related Work Section (Carousel Style) */}
        <div className="bg-[#F5F2EA] pt-32 pb-16 border-t border-gray-300 mt-0 overflow-hidden">
          {/* Constrain the entire content to the max-width container */}
          <div className="max-w-[1600px] mx-auto px-8 md:px-16 w-full">
            <div className="flex justify-between items-end mb-8 border-b border-gray-300 pb-4">
               <h3 className="text-xl font-medium">Related Work</h3>
               <Link to="/" className="text-sm font-medium hover:opacity-60 transition-opacity">
                 View All Projects ↗
               </Link>
            </div>
            
            <div 
               ref={sliderRef}
               // Removed px-8 md:px-16 from here because the parent container handles it
               // Added negative margin to allow full-bleed scroll effect if desired, but user wants "grid" look
               // So we keep it contained.
               className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-12 cursor-grab select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] scroll-smooth"
               onMouseDown={onMouseDown}
               onMouseLeave={onMouseLeave}
               onMouseUp={onMouseUp}
               onMouseMove={onMouseMove}
               onClickCapture={onClickCapture}
            >
               {relatedProjects.map(p => (
                 <div key={p.id} className="snap-center shrink-0 w-full lg:snap-start lg:w-[calc(50%-1rem)]">
                    <Link to={`/project/${p.slug || p.id}`} className="group block h-full" draggable={false}>
                       <div className="flex flex-col h-full">
                          <div className="aspect-[3/2] overflow-hidden bg-gray-200 mb-6">
                            <img 
                              src={p.backup_image_url || p.imageUrl} 
                              alt={p.title}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              draggable={false}
                            />
                          </div>
                          <div className="flex flex-col items-start gap-1">
                             <h4 className="text-xl md:text-2xl font-bold truncate pr-4">
                               {p.title}
                             </h4>
                             <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest whitespace-nowrap">
                               {(p.category || 'Branding').split(',')[0]}
                             </span>
                          </div>
                       </div>
                    </Link>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* Bottom Footer Area (Dark) */}
        <div className="bg-[#1A1A1A] py-12" />
      </article>
    </Layout>
  );
}
