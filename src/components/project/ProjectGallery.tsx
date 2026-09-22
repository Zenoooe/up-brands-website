import { memo, useMemo, useState, useEffect } from 'react';
import { getSupabaseUrl } from '../../utils/image';
import { getVimeoId } from '../../utils/video';
import { getProjectImageAlt } from '../../utils/seo';

interface ProjectGalleryProps {
  images: string[];
  layout?: string;
  imageGap?: number;
  title: string;
  onImageClick?: (e: React.MouseEvent) => void;
}

const INITIAL_COUNT = 20;

export const ProjectGallery = memo(({ images, layout = 'full', imageGap = 0, title, onImageClick }: ProjectGalleryProps) => {
  const [showAll, setShowAll] = useState(false);

  // Filter out iframe/embedded content that isn't a direct image or vimeo
  const validItems = useMemo(() => {
    if (!images) return [];
    return images.filter(img => {
      // Basic check: string and not an HTML iframe tag (unless we parse it later)
      // The current code handles vimeo ID extraction, so we assume valid strings
      return typeof img === 'string' && !img.includes('<iframe');
    });
  }, [images]);

  // Reset showAll when images change
  useEffect(() => {
    setShowAll(false);
  }, [validItems]);

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const imageWidth = isMobile ? 800 : 1600;

  // Preload remaining images
  useEffect(() => {
    if (validItems.length > INITIAL_COUNT && !showAll) {
      const remainingImages = validItems.slice(INITIAL_COUNT);
      // Add a slight delay to ensure initial images load first without network competition
      const timer = setTimeout(() => {
        remainingImages.forEach(img => {
          if (typeof img === 'string' && !getVimeoId(img)) {
            const image = new Image();
            image.src = getSupabaseUrl(img, imageWidth);
          }
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [validItems, showAll, imageWidth]);

  if (!images || images.length === 0) return null;

  const visibleItems = showAll ? validItems : validItems.slice(0, INITIAL_COUNT);

  const gallerySizes =
    layout === 'grid'
      ? '(max-width: 768px) 100vw, 33vw'
      : layout === 'full'
        ? '(max-width: 768px) 100vw, 50vw'
        : '100vw';

  const renderLoadMore = () => {
    if (showAll || validItems.length <= INITIAL_COUNT) return null;
    return (
      <div className="w-full mt-4 md:mt-8">
        <button
          onClick={() => setShowAll(true)}
          className="w-full bg-[#1A1A1A] text-white text-lg md:text-xl font-medium py-6 md:py-8 uppercase tracking-widest transition-opacity duration-300 hover:opacity-75"
        >
          Load More
        </button>
      </div>
    );
  };

  if (layout === 'stack') {
    return (
      <div className="w-full flex flex-col">
        {visibleItems.map((img: string, index: number) => {
          const vimeoId = getVimeoId(img);
          if (vimeoId) {
             return (
               <div key={index} className="w-full mb-8 last:mb-0">
                  <div className="w-full aspect-video bg-black">
                    <iframe
                      src={`https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0`}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={`${title} video ${index + 1}`}
                    />
                  </div>
               </div>
             );
          }

          return (
            <div 
              key={index} 
              className="w-full relative cursor-pointer" 
              style={{ marginBottom: imageGap ? `${imageGap}px` : '0px' }}
              onClick={onImageClick}
              onContextMenu={(e) => {
                e.preventDefault();
                if (onImageClick) onImageClick(e);
              }}
            >
              <img 
                src={getSupabaseUrl(img, imageWidth)} 
                alt={getProjectImageAlt({ title, category: '' }, index)}
                className="w-full h-auto block"
                loading="lazy"
                decoding="async"
                sizes="100vw"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            </div>
          );
        })}
        {renderLoadMore()}
      </div>
    );
  }

  // Default grid/full layouts
  return (
    <div className={`w-full ${layout === 'centered' ? 'max-w-[1400px] mx-auto px-4 md:px-8' : ''}`}>
      <div 
        className={`w-full grid ${
           layout === 'grid' ? 'grid-cols-2 md:grid-cols-3' : 
           layout === 'centered' ? 'grid-cols-1 gap-y-12' : 
           'grid-cols-1 md:grid-cols-2' // Default 'full'
        }`}
        style={{ gap: imageGap ? `${imageGap}px` : '0px' }}
      >
        {visibleItems.map((img: string, index: number) => {
          const vimeoId = getVimeoId(img);
          
          if (vimeoId) {
             return (
                <div key={index} className={`w-full aspect-video bg-black ${
                  layout === 'full' && (index + 1) % 3 === 0 ? 'md:col-span-2' : ''
                }`}>
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&byline=0&title=0`}
                    className="w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    title={`${title} video ${index + 1}`}
                  />
                </div>
             );
          }

          return (
            <div 
              key={index} 
              className={`w-full relative cursor-pointer ${
                // Hybrid rhythm for 'full' layout: alternating 2-col vs 1-col
                layout === 'full' && (index + 1) % 3 === 0 ? 'md:col-span-2' : ''
              }`}
              onClick={onImageClick}
              onContextMenu={(e) => {
                e.preventDefault();
                if (onImageClick) onImageClick(e);
              }}
            >
              <img 
                src={getSupabaseUrl(img, imageWidth)} 
                alt={getProjectImageAlt({ title, category: '' }, index)}
                className={`w-full block bg-gray-50 ${
                   layout === 'full' && (index + 1) % 3 !== 0 
                     ? 'h-full min-h-[300px] md:min-h-[400px] object-cover' 
                     : layout === 'centered' 
                        ? 'h-auto object-contain' // Do not force aspect ratio or cover for centered
                        : 'h-auto aspect-[4/3] object-cover'
                }`}
                loading="lazy"
                decoding="async"
                sizes={gallerySizes}
                draggable={false}
                referrerPolicy="no-referrer"
              />
            </div>
          );
        })}
      </div>
      {renderLoadMore()}
    </div>
  );
}, (prev, next) => {
  return prev.images === next.images && 
         prev.layout === next.layout && 
         prev.imageGap === next.imageGap && 
         prev.title === next.title;
});

ProjectGallery.displayName = 'ProjectGallery';
