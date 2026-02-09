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

import { Volume2, VolumeX } from 'lucide-react';
import Player from '@vimeo/player';

// Helper to extract Vimeo ID
function getVimeoId(url: string) {
  if (!url) return null;
  // Matches: vimeo.com/123456, player.vimeo.com/video/123456
  const match = url.match(/(?:vimeo\.com\/|video\/)(\d+)/);
  return match ? match[1] : null;
}

// Vimeo Component to handle aspect ratio fetching
function VimeoBlock({ videoId }: { videoId: string }) {
  const [aspectRatio, setAspectRatio] = useState(16 / 9); // Default to 16:9
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    async function fetchInfo() {
      try {
        // Use our serverless function to avoid CORS issues
        const res = await fetch(`/api/vimeo-info?id=${videoId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.width && data.height) {
          setAspectRatio(data.width / data.height);
        }
      } catch (e) {
        console.warn('Failed to fetch Vimeo info', e);
      }
    }
    fetchInfo();
  }, [videoId]);

  // Initialize Vimeo Player for custom control
  useEffect(() => {
    if (!iframeRef.current) return;

    const player = new Player(iframeRef.current);
    playerRef.current = player;

    player.on('volumechange', (data) => {
      setIsMuted(data.volume === 0);
    });

    return () => {
      player.off('volumechange');
      player.unload();
    };
  }, [videoId]);

  const toggleMute = async () => {
    if (!playerRef.current) return;
    
    if (isMuted) {
      await playerRef.current.setVolume(1);
      await playerRef.current.setMuted(false);
      setIsMuted(false);
    } else {
      await playerRef.current.setVolume(0);
      await playerRef.current.setMuted(true);
      setIsMuted(true);
    }
  };

  return (
    <div 
      className="w-full bg-black relative group"
      style={{ aspectRatio: aspectRatio }}
    >
      <iframe 
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&controls=0&title=0&byline=0&portrait=0&playsinline=1`}
        className="absolute inset-0 w-full h-full pointer-events-none" // Disable pointer events on iframe to let clicks pass through to our buttons if needed, BUT we need pointer events for the button. Actually pointer-events-none on iframe prevents pausing by click, which is good for background feel.
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
      
      {/* Custom Mute Toggle Button */}
      <button
        onClick={toggleMute}
        className="absolute bottom-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </button>
    </div>
  );
}

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
    if (!isDown.current) return;
    isDown.current = false;
    if (sliderRef.current) {
      sliderRef.current.style.scrollSnapType = 'x mandatory';
      sliderRef.current.style.scrollBehavior = 'smooth';
      sliderRef.current.style.cursor = 'grab';
    }
  };

  const onMouseUp = () => {
    if (!isDown.current) return;
    isDown.current = false;
    
    if (sliderRef.current) {
      // Logic: If dragged left (moveDistance > 0), snap to next item
      // If dragged right (moveDistance < 0), snap to prev item
      // We calculate manually because standard snap will bounce back if < 50% width
      const moveDistance = sliderRef.current.scrollLeft - scrollLeft.current;
      const firstChild = sliderRef.current.children[0] as HTMLElement;
      
      if (firstChild) {
          const itemWidth = firstChild.offsetWidth;
          // gap is 32px (gap-8)
          const gap = 32; 
          const fullItemWidth = itemWidth + gap;
          
          // Current index based on where we started
          const startIndex = Math.round(scrollLeft.current / fullItemWidth);
          let targetIndex = startIndex;
          
          // Threshold to trigger "next/prev" (e.g. 20px - small but intentional)
          const threshold = 20; 
          
          if (moveDistance > threshold) {
              // Scrolled Right (Dragged Left) -> Next Item
              targetIndex = startIndex + 1;
          } else if (moveDistance < -threshold) {
              // Scrolled Left (Dragged Right) -> Prev Item
              targetIndex = startIndex - 1;
          }
          
          // Clamp index
          const maxIndex = sliderRef.current.children.length - 1;
          targetIndex = Math.max(0, Math.min(targetIndex, maxIndex));
          
          // Manual Scroll to target
          sliderRef.current.scrollTo({
              left: targetIndex * fullItemWidth,
              behavior: 'smooth'
          });
      }

      // Re-enable snap after animation settles
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.style.scrollSnapType = 'x mandatory';
          sliderRef.current.style.scrollBehavior = 'smooth';
          sliderRef.current.style.cursor = 'grab';
        }
      }, 600);
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
      // Clear previous project to force "new page" feel
      setProject(null);
      setLoading(true);
      
      // Find by ID OR Slug
      const currentIndex = projects.findIndex(p => p.id === id || p.slug === id);
      if (currentIndex !== -1) {
        setProject(projects[currentIndex]);
        setPrevProject(currentIndex > 0 ? projects[currentIndex - 1] : null);
        setNextProject(currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null);
        setLoading(false);
      }
    }
  }, [projects, id]);

  // 2. Fetch fresh data
  useEffect(() => {
    async function fetchProjectDetail() {
      if (!id) return;
      // Force loading state if not already handled by list sync
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

      <article className="w-full bg-[#F5F2EA] min-h-screen text-[#1A1A1A]" key={id}>
        {/* Full Screen Hero Image */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="w-full h-screen relative"
          key={`hero-${id}`} // Force re-mount of hero section
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
               <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-bold leading-[0.9] tracking-tighter break-words hyphens-auto">
                 {project.title.split(' ').map((word: string, i: number) => (
                   <span key={i} className="block">{word}</span>
                 ))}
               </h1>
               <div className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-[#1A1A1A] rounded-full mt-2 sm:mt-3 md:mt-4 flex-shrink-0" />
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
                 project.gallery_layout === 'stack' ? 'grid-cols-1' :
                 'grid-cols-1 md:grid-cols-2' // Default 'full'
              }`}
              style={{ gap: project.image_gap ? `${project.image_gap}px` : '0px' }}
            >
              {project.images.map((img: string, index: number) => {
                const vimeoId = getVimeoId(img);
                return (
                  <div 
                    key={index} 
                    className={`w-full relative ${
                      // Hybrid rhythm for 'full' layout: alternating 2-col vs 1-col
                      project.gallery_layout === 'full' && (index + 1) % 3 === 0 ? 'md:col-span-2' : 'h-full'
                    }`}
                  >
                    {vimeoId ? (
                      <VimeoBlock videoId={vimeoId} />
                    ) : (
                      <img 
                        src={img} 
                        alt={`${project.title} detail ${index + 1}`}
                        className={`w-full object-cover block ${
                           project.gallery_layout === 'full' && (index + 1) % 3 !== 0 ? 'h-full' : 'h-auto'
                        }`}
                        loading="lazy"
                        draggable={false}
                      />
                    )}
                  </div>
                );
              })}
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
