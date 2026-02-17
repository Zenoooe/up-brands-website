import { useState, useRef, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Project } from '../../types';

// Helper: Process Image Proxy URL
function toWpImageProxyUrl(url: string) {
  const cleaned = url.replace(/^https?:\/\//, '');
  return `https://i0.wp.com/${cleaned}`;
}

// Hook: Handle Image Loading and Fallback
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
    onLoad: () => { loadedRef.current = true; },
    onError: () => { setSrc(proxySrc); },
  };
}

// Subcomponent: Render Single Image
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

interface SpawnedImage {
  id: number;
  x: number;
  y: number;
  src: string;
  rotation: number;
  scale: number;
  createdAt: number;
}

interface HeroInteractionProps {
  projects: Project[];
}

export const HeroInteraction = ({ projects }: HeroInteractionProps) => {
  const [spawnedImages, setSpawnedImages] = useState<SpawnedImage[]>([]);
  const lastSpawnPos = useRef({ x: 0, y: 0 });
  const imageIdCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-cleanup old images
  useEffect(() => {
    if (spawnedImages.length > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        setSpawnedImages(prev => prev.filter(img => now - img.createdAt < 1500));
      }, 200);
      return () => clearInterval(interval);
    }
  }, [spawnedImages]);

  const spawnImage = (x: number, y: number) => {
    // Distance detection
    const dist = Math.hypot(x - lastSpawnPos.current.x, y - lastSpawnPos.current.y);
    if (dist > 80) {
      const randomProject = projects[Math.floor(Math.random() * projects.length)];
      if (!randomProject) return;
      
      const newImage: SpawnedImage = {
        id: imageIdCounter.current++,
        x,
        y,
        src: randomProject.backup_image_url || randomProject.imageUrl,
        rotation: Math.random() * 40 - 20,
        scale: Math.random() * 0.3 + 0.8,
        createdAt: Date.now(),
      };

      setSpawnedImages(prev => {
        const newState = [...prev, newImage];
        // Limit max number to optimize performance
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
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    spawnImage(x, y);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className="absolute inset-0 z-10 cursor-crosshair" // This layer handles mouse events
    >
      <AnimatePresence>
        {spawnedImages.map((img) => (
          <m.div
            key={img.id}
            initial={{ opacity: 0, scale: 0.5, x: img.x - 150, y: img.y - 100 }}
            animate={{ opacity: 1, scale: img.scale, x: img.x - 150, y: img.y - 100 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="absolute w-[300px] h-[200px] shadow-2xl origin-center pointer-events-none"
            style={{ rotate: img.rotation }}
          >
            <SpawnedPreviewImage src={img.src} />
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
};