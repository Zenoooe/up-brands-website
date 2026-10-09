import { Layout } from '../components/layout/Layout';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useBehanceProjects } from '../hooks/useBehanceProjects';
import { SEO } from '../components/common/SEO';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getSupabaseUrl, getValidImageUrl } from '../utils/image';
import { ProjectInfo } from '../components/project/ProjectInfo';
import { ProjectGallery } from '../components/project/ProjectGallery';
import { ProjectSidebar } from '../components/project/ProjectSidebar';
import { ContactModal } from '../components/ui/ContactModal';
import { PlatformModal } from '../components/ui/PlatformModal';
import { getCanonicalUrl, getProjectImageAlt } from '../utils/seo';
import { getProjectDisplayCategory, getProjectDisplaySubtitle } from '../../shared/project-metadata';

export default function ProjectDetail() {
  const { t, i18n } = useTranslation();

  const { id } = useParams();
  
  const { projects, loading: listLoading } = useBehanceProjects();
  
  // All Hooks MUST be at the top level
  const [projectState, setProjectState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nextProject, setNextProject] = useState<any>(null);
  const [prevProject, setPrevProject] = useState<any>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [modalPosition, setModalPosition] = useState<{ x: number, y: number } | null>(null);

  const handleImageClick = (e: React.MouseEvent) => {
    const x = e.clientX;
    const y = e.clientY;
    const targetX = x - 40;
    const targetY = y - 26;
    const clampedX = Math.max(10, Math.min(window.innerWidth - 50, targetX));
    const clampedY = Math.max(10, Math.min(window.innerHeight - 50, targetY));
    setModalPosition({ x: clampedX, y: clampedY });
  };

  // CRITICAL FIX: Stale Data Protection
  // If the project in state doesn't match the current URL ID (slug or UUID), 
  // treat it as null immediately. This prevents showing the previous project 
  // while the new one is loading.
  const project = useMemo(() => {
    if (!projectState) return null;
    // Check if ID matches
    if (String(projectState.id) === id || projectState.slug === id) {
      return projectState;
    }
    return null;
  }, [projectState, id]);

  const relatedProjects = useMemo(() => {
    if (!projects || !project) return [];
    
    // Parse current project tags
    let currentTags: string[] = [];
    try {
      if (project.category && project.category.startsWith('{')) {
        const parsed = JSON.parse(project.category);
        currentTags = [...(Array.isArray(parsed.services) ? parsed.services : []), ...(Array.isArray(parsed.industries) ? parsed.industries : [])];
      } else if (project.category) {
        currentTags = [project.category];
      }
    } catch (e) {
      // ignore
    }

    const others = projects.filter(p => p.id !== project.id && p.is_visible !== false);

    // Score based on matching tags, and add a random tie-breaker
    const scored = others.map(p => {
      let score = 0;
      let pTags: string[] = [];
      try {
        if (p.category && p.category.startsWith('{')) {
          const parsed = JSON.parse(p.category);
          pTags = [...(Array.isArray(parsed.services) ? parsed.services : []), ...(Array.isArray(parsed.industries) ? parsed.industries : [])];
        } else if (p.category) {
          pTags = [p.category];
        }
      } catch (e) {}

      pTags.forEach(tag => {
        if (currentTags.includes(tag)) score++;
      });

      // Add a random weight for ties (between 0 and 0.5) so different projects show up each time
      const randomWeight = Math.random() * 0.5;
      return { project: p, score: score + randomWeight };
    });

    // Sort descending by score
    scored.sort((a, b) => b.score - a.score);

    // Return the top 10 most relevant projects to keep the carousel performant and focused
    return scored.slice(0, 10).map(s => s.project);
  }, [projects, project]);

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const isDragging = useRef(false);
  const rafRef = useRef<number | null>(null);

  // Scroll to top when project ID changes
  useEffect(() => {
    window.scrollTo(0, 0);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [id]);

  // Ensure isDragging is reset when component unmounts or id changes
  useEffect(() => {
    isDragging.current = false;
    isDown.current = false;
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
    
    const pageX = e.pageX;
    
    // Use requestAnimationFrame to throttle scroll updates
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    rafRef.current = requestAnimationFrame(() => {
      if (sliderRef.current) {
        const x = pageX - sliderRef.current.offsetLeft;
        const walk = (x - startX.current) * 1; 
        if (Math.abs(walk) > 5) isDragging.current = true;
        sliderRef.current.scrollLeft = scrollLeft.current - walk;
      }
    });
  };
  
  // Capture clicks to prevent navigation if dragging
  const onClickCapture = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  
  // Ensure we reset state immediately when ID changes
  // This is a layout effect equivalent pattern
  const prevIdRef = useRef(id);
  if (prevIdRef.current !== id) {
    prevIdRef.current = id;
    // Direct state mutation during render to force immediate reset
    // This is React pattern to avoid "flicker" of old data
    // However, calling setState during render is risky.
    // Better to use key={id} on the main container to force full remount.
  }
  
  // 1. Sync with list data first
  useEffect(() => {
    // If ID changed, immediately clear project
    // Actually, we don't want to clear if we are just hydrating. 
    // We only clear if we are switching to a completely new project.
    
    if (projects.length > 0 && id) {
      // Find by ID OR Slug
      const currentIndex = projects.findIndex(p => p.id === id || p.slug === id);
      if (currentIndex !== -1) {
        setProjectState(projects[currentIndex]);
        setPrevProject(currentIndex > 0 ? projects[currentIndex - 1] : null);
        setNextProject(currentIndex < projects.length - 1 ? projects[currentIndex + 1] : null);
        setLoading(false);
      } else {
        // If not found in list, we might be loading it directly
        setProjectState(null);
        setLoading(true);
      }
    }
  }, [id, projects]); // Dependencies: ID change triggers reset

  // 2. Fetch fresh data
  useEffect(() => {
    async function fetchProjectDetail() {
      if (!id) return;
      
      try {
        // Try fetching by ID first
        let { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        // If not found by ID, try fetching by slug
        if (error || !data) {
          const { data: slugData, error: slugError } = await supabase
            .from('projects')
            .select('*')
            .eq('slug', id)
            .single();
            
          if (slugData) {
            data = slugData;
            error = null;
          } else {
            error = slugError as any || new Error('Project not found');
          }
        }

        if (error) {
          console.error('Error fetching project:', error);
          setLoading(false);
          return;
        }

        if (data) {
          setProjectState(data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    }

    // Only fetch if we don't already have the correct project in state
    if (!projectState || (String(projectState.id) !== id && projectState.slug !== id)) {
       fetchProjectDetail();
    }
  }, [id, projectState]);
  
  // Append agency boilerplate for better SEO description length
  // Optimize: Memoize SEO description
  // Note: We use raw description here to avoid heavy processing on main thread. 
  // ProjectInfo component handles the display description with OpenCC.
  const seoDescription = useMemo(() => {
    const rawDesc = project?.description_en || project?.description || "Turning paper into possibility with an inspiring packaging collection.";
    // Simple strip tags just in case, but avoid heavy DOMPurify if possible or keep it light
    const stripped = rawDesc.replace(/<[^>]+>/g, '');
    
    return stripped.substring(0, 160) + 
    (i18n.language.startsWith('en') 
      ? " - Up-Brands: Greater Bay Area Brand Strategy & Design Agency." 
      : " - Up-Brands™上游文创：粤港澳大湾区领先的品牌策略与创意设计机构。");
  }, [project, i18n.language]);
  
  // SEO Keywords
  const seoKeywords = useMemo(() => {
    const categoryText = project ? getProjectDisplayCategory(project) : '';
    const subtitle = project ? getProjectDisplaySubtitle(project) : '';

    if (categoryText) {
      return categoryText.split(',').map((c: string) => c.trim()).filter(Boolean);
    }

    if (subtitle) {
      return subtitle.split('|').map((part: string) => part.trim()).filter(Boolean);
    }

    return ['Brand Strategy', 'Visual Identity', 'Packaging Design'];
  }, [project]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Determine if we are in a "switching" state (URL ID doesn't match State ID)
  // This happens immediately after navigation but before the effect has reset the state
  const isSwitching = projectState && (String(projectState.id) !== id && projectState.slug !== id);

  // Render loading state
  if ((loading || isSwitching) && !project) {
    return (
      <Layout>
        <div className="w-full h-screen flex items-center justify-center bg-[#F5F2EA]">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  // Render not found state
  // Only redirect if we are NOT loading, NOT switching, and project is null
  if (!project && !loading && !isSwitching) {
    return <Navigate to="/" replace />;
  }

  // If we are loading but have a project (e.g. background refresh), show it? 
  // Or if we passed the checks above, 'project' MUST be defined for the rest of the component.
  // Safety check to satisfy TypeScript
  if (!project) return null; 

  const currentUrl = getCanonicalUrl(`/project/${project.slug || project.id}`);
  const breadcrumbs = [
    { name: 'Home', url: getCanonicalUrl('/') },
    { name: 'Projects', url: getCanonicalUrl('/') },
    { name: project.title, url: currentUrl },
  ];
  
  // Optimize Hero Image
  let imageUrl = getValidImageUrl(project.backup_image_url, project.imageUrl);
  imageUrl = getSupabaseUrl(imageUrl, 1600);

  return (
    <Layout>
      <SEO
        title={project.title}
        description={seoDescription}
        image={imageUrl}
        type="website" // Change to website but let SEO component detect project URL
        url={currentUrl}
        keywords={seoKeywords}
        author="Up-Brands"
        breadcrumbs={breadcrumbs}
      />

      <article className="w-full bg-[#F5F2EA] min-h-screen text-[#1A1A1A] relative" key={id}>
        
        {/* Fixed Button (Desktop) */}
        <div className="hidden lg:block fixed top-24 right-8 z-[60]">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="bg-[#EAE8E3] hover:bg-[#E0DED9] text-[#1A1A1A] text-[15px] font-medium px-4 py-2 rounded transition-colors flex items-center gap-2"
          >
            About the project <span className="text-xl font-light leading-none mb-0.5">{isSidebarOpen ? '×' : '+'}</span>
          </button>
        </div>
        
        {/* Floating Button (Mobile) — bottom-left, vertically centred with the chat launcher (both h-14 / bottom-6) */}
        <div className="lg:hidden fixed bottom-6 left-6 z-[60]">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="h-14 bg-[#1A1A1A] text-white text-sm font-bold px-6 rounded-full shadow-lg flex items-center transition-transform hover:scale-105"
          >
            About the project {isSidebarOpen ? '×' : '+'}
          </button>
        </div>

        {/* Project Content & Sidebar Wrapper */}
        <div className="relative w-full">
          {/* Main Content Area that shrinks */}
          <div 
            className={`w-full transition-[padding] duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${
              isSidebarOpen ? 'lg:pr-[480px]' : 'pr-0'
            }`}
          >
            {/* Full Screen Hero Image */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="w-full h-screen relative"
            key={`hero-${id}`}
          >
            <img 
              src={imageUrl} 
              alt={getProjectImageAlt(project)}
              className="w-full h-full object-cover"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              sizes="100vw"
              referrerPolicy="no-referrer"
            />
          </motion.div>

          {/* Info Section (Header) */}
          <ProjectInfo project={project} />

          {/* Project Gallery - Configurable Layout */}
          <div className="w-full">
            <ProjectGallery 
              images={project.images} 
              layout={project.gallery_layout} 
              imageGap={project.image_gap} 
              title={project.title}
              onImageClick={handleImageClick}
            />
          </div>
        </div>

        {/* Sidebar - Scoped to the relative wrapper, stops before Related Work */}
        <ProjectSidebar 
          project={project} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      </div>

      {/* Related Work Section (Carousel Style) - Unaffected by padding */}
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
                                src={getValidImageUrl(p.backup_image_url, p.imageUrl)} 
                                alt={getProjectImageAlt(p)}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                draggable={false}
                                decoding="async"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                               <h4 className="text-xl md:text-2xl font-bold truncate pr-4">
                                 {p.title}
                               </h4>
                               <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest whitespace-nowrap">
                                 {getProjectDisplaySubtitle(p) || getProjectDisplayCategory(p) || 'Project'}
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
          <div className="bg-[#1A1A1A] py-12 w-full" />

      </article>
      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
      
      {/* Platform Modal on Image Click */}
      {modalPosition && project && (
        <PlatformModal
          project={project}
          position={modalPosition}
          onClose={() => setModalPosition(null)}
          mode="contact"
          onContactClick={() => setShowContactModal(true)}
        />
      )}
    </Layout>
  );
}
