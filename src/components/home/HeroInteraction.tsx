import { useState, useRef, useEffect } from 'react';
import { m, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Project } from '../../types';
import { getSupabaseUrl, getValidImageUrl } from '../../utils/image';

// Subcomponent: Render Single Image
const SpawnedPreviewImage = ({ src }: { src: string }) => {
  return (
    <img
      src={src}
      alt=""
      className="w-full h-full object-cover shadow-2xl block"
      referrerPolicy="no-referrer"
      loading="eager"
      decoding="async"
      draggable={false}
      style={{ 
        imageRendering: 'auto', 
        minWidth: '100%',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }} 
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
  isLarge?: boolean;
  driftX?: number;      // New: Pre-calculated X drift
  driftRotate?: number; // New: Pre-calculated rotation target
}

interface HeroInteractionProps {
  projects: Project[];
  enableClickSpawn?: boolean;
  enableMachineGun?: boolean;
  machineGunInterval?: number;
}

export const HeroInteraction = ({ projects, enableClickSpawn = true, enableMachineGun = true, machineGunInterval = 200 }: HeroInteractionProps) => {
  const [spawnedImages, setSpawnedImages] = useState<SpawnedImage[]>([]);
  const lastSpawnPos = useRef({ x: 0, y: 0 });
  const imageIdCounter = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Guided "Click" cursor ring (follows the mouse when no large image is on screen)
  const [showCursorRing, setShowCursorRing] = useState(false);
  const ringX = useMotionValue(-9999);
  const ringY = useMotionValue(-9999);
  const smoothRingX = useSpring(ringX, { stiffness: 500, damping: 40, mass: 0.4 });
  const smoothRingY = useSpring(ringY, { stiffness: 500, damping: 40, mass: 0.4 });
  
  // Audio Context for generating sound
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize AudioContext on first user interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('touchstart', initAudio, { once: true });
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };
  }, []);

  const playPopSound = () => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Savoir Faire style: Short, high-pitched "tick" / "pop"
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
    
    // Very short envelope
    gainNode.gain.setValueAtTime(0.15, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.start(t);
    osc.stop(t + 0.05);
  };

  // Auto-cleanup
  useEffect(() => {
    if (spawnedImages.length > 0) {
      const interval = setInterval(() => {
        const now = Date.now();
        setSpawnedImages(prev => {
          const nextState = prev.filter(img => {
            // Keep large images longer (8s)
            // Keep small images (1.5s)
            const lifeTime = img.isLarge ? 8000 : 1500;
            return now - img.createdAt < lifeTime;
          });
          
          // Optimization: If state hasn't effectively changed (same count), don't trigger re-render
          if (nextState.length === prev.length) return prev;
          return nextState;
        });
      }, 200); 
      return () => clearInterval(interval);
    }
  }, [spawnedImages]); // Dependency on spawnedImages might be causing re-renders that reset images?
  // No, dependency is correct for interval management.
  
  // WAIT - the issue might be key prop or re-renders causing image to detach and reload
  // The 'key={img.id}' is stable.
  // BUT the 'src' might be unstable if 'getSupabaseUrl' returns different strings (e.g. if CDN var changes or something)
  // Let's check SpawnedPreviewImage. It just renders <img src={src} />.
  // If the image is "turning white", it means the browser is unloading it or re-requesting it.
  
  // A common issue with framer-motion AnimatePresence is elements unmounting/remounting.
  // But here we are just filtering the array.
  
  // Let's look at SpawnedPreviewImage again.
  // It has loading="eager" and decoding="sync".
  // If the parent re-renders, React reconciles. 
  // If 'src' prop changes, it reloads.
  // 'src' comes from state. State is stable.
  
  // Maybe the 'bg-gray-100' is showing because the image failed to load or was evicted?
  // Let's remove the bg-gray-100 for small images to see if that's masking something.
  // Actually, let's revert 'decoding="sync"' for small images. Sync decoding blocks the main thread and might be causing issues if many images are present.


  // Keep actual Image objects in memory to prevent browser garbage collection clearing the cache
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const preloadedImagesRef = useRef<string[]>([]);
  const readyImagesRef = useRef<string[]>([]); // Track images that have actually finished loading

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const IMG_WIDTH = isMobile ? 420 : 900;
  const MAX_PRELOAD_COVERS = isMobile ? 4 : 6;
  const MAX_PRELOAD_DETAILS = isMobile ? 6 : 12;

  const getThumbnailUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('supabase.co')) {
        return url;
    }
    
    return getSupabaseUrl(url, IMG_WIDTH);
  };

  useEffect(() => {
    // Immediate backup for very first render
    if (projects.length > 0) {
      // Find the first valid image immediately to have SOMETHING ready
      for (const p of projects) {
        if (p.imageUrl) {
          const src = getThumbnailUrl(p.imageUrl);
          const img = new Image();
          img.src = src;
          // Store in global/ref immediately
          readyImagesRef.current.push(src);
          break; 
        }
      }
    }
  }, [projects]); // Run once when projects load

  useEffect(() => {
    if (projects.length === 0) return;
    
    preloadedImagesRef.current = [];
    readyImagesRef.current = [];
    imageCacheRef.current.clear();

    const coverImages = projects
      .map(p => getValidImageUrl(p.backup_image_url, p.imageUrl))
      .filter(Boolean)
      .map(src => getThumbnailUrl(src))
      .filter(Boolean)
      .slice(0, MAX_PRELOAD_COVERS);

    const detailImages: string[] = [];
    projects.forEach(p => {
      if (p.images && p.images.length > 0) {
        p.images.forEach(img => {
           if (!img.includes('<iframe') && (img.startsWith('http') || img.startsWith('/'))) {
             detailImages.push(getThumbnailUrl(img));
           }
        });
      }
    });

    const shuffledDetails = detailImages
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .filter(Boolean)
      .slice(0, MAX_PRELOAD_DETAILS);

    const warmupQueue = [...coverImages, ...shuffledDetails];
    const schedule =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (cb: () => void) => (window as Window & typeof globalThis & {
            requestIdleCallback: (callback: IdleRequestCallback) => number;
          }).requestIdleCallback(() => cb())
        : (cb: () => void) => window.setTimeout(cb, 250);

    schedule(() => {
      warmupQueue.forEach(src => {
        if (!src || imageCacheRef.current.has(src)) return;

        const img = new Image();
        img.src = src;
        img.decoding = 'async';
        imageCacheRef.current.set(src, img);
        preloadedImagesRef.current.push(src);

        img.onload = () => {
          readyImagesRef.current.push(src);
        };
      });
    });
  }, [projects]);

  const clickCountRef = useRef(0); // Track number of clicks
  const lastSuccessfulImageRef = useRef<string>(''); // Keep track of the last known good image

  const spawnImage = (x: number, y: number, force = false) => {
    const dist = Math.hypot(x - lastSpawnPos.current.x, y - lastSpawnPos.current.y);
    
    if (force || dist > 60) {
      let imgSrc = '';
      let isLarge = false;

      if (force) {
        isLarge = true;
        clickCountRef.current += 1;

        // SIMPLIFIED FAILSAFE LOGIC:
        // Always try to use a ready detail image first.
        // If not available, fall back to a random cover.
        
        // Only use ready details if we have a LOT of them (indicating good network)
        // Threshold increased to 5 to be safer
        if (readyImagesRef.current.length > 5 && clickCountRef.current > 10) {
           imgSrc = readyImagesRef.current[Math.floor(Math.random() * readyImagesRef.current.length)];
        } 
        
        // If no ready details OR early click OR failed to pick one -> FALLBACK TO COVER
        if (!imgSrc) {
            // Pick a random project to start
            const randomIdx = Math.floor(Math.random() * projects.length);
            const randomP = projects[randomIdx];
            const raw = randomP.imageUrl;
            
            if (raw) {
               imgSrc = getThumbnailUrl(raw);
            } else {
               // If that failed, linear search for ANY valid cover
               for (const p of projects) {
                  const r = p.imageUrl;
                  if (r) {
                     imgSrc = getThumbnailUrl(r);
                     break;
                  }
               }
            }
        }
        
        // SUPER EMERGENCY: If even that failed (or returned empty string), reuse the last known good image
        if (!imgSrc && lastSuccessfulImageRef.current) {
             imgSrc = lastSuccessfulImageRef.current;
        }

        // ULTIMATE FAILSAFE: If absolutely nothing found, don't play sound
        if (imgSrc) {
          playPopSound();
        } else {
           return; 
        }
      } else {
        // Drag logic remains same
        const randomProject = projects[Math.floor(Math.random() * projects.length)];
        if (!randomProject) return;
        
        // Priority: Image URL > First Image
        const rawSrc = randomProject.imageUrl || randomProject.images?.[0];
        if (rawSrc) {
           // EXTREMELY IMPORTANT:
           // This URL must be IDENTICAL to the one used in the first 10 clicks
           imgSrc = getThumbnailUrl(rawSrc);
        }
      }
      
      // Pre-calculate random drift values
      const isRotatePositive = Math.random() > 0.5;
      const rotationDrift = isRotatePositive ? (3 + Math.random() * 3) : (-3 - Math.random() * 3); 
      const xDrift = (Math.random() - 0.5) * 80;

      const newImage: SpawnedImage = {
        id: imageIdCounter.current++,
        x,
        y,
        src: imgSrc,
        rotation: Math.random() * 20 - 10,
        scale: 1, 
        createdAt: Date.now(),
        isLarge,
        driftX: xDrift,
        driftRotate: rotationDrift
      };
      
      // Store this successful image as a "safe fallback" for future clicks
      if (imgSrc) {
        lastSuccessfulImageRef.current = imgSrc;
      }
      
      // USE FUNCTIONAL UPDATE TO ENSURE STATE IS UPDATED RELIABLY
      setSpawnedImages(prev => {
        // Enforce strict limit to prevent memory issues (might cause flickering if too high)
        const limit = 50; 
        const newState = [...prev, newImage];
        if (newState.length > limit) return newState.slice(newState.length - limit);
        return newState;
      });

      lastSpawnPos.current = { x, y };
    }
  };

  const isPressingRef = useRef(false);
  const pressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPressPosRef = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enableClickSpawn || !containerRef.current || projects.length === 0) return;
    
    // Initial spawn
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    spawnImage(x, y, true);
    
    isPressingRef.current = true;
    lastPressPosRef.current = { x, y };

    // Start "machine gun" interval
    // 0.2s interval for much faster rapid fire (was 0.5s)
    if (enableMachineGun) {
      pressIntervalRef.current = setInterval(() => {
        if (isPressingRef.current) {
          spawnImage(lastPressPosRef.current.x, lastPressPosRef.current.y, true);
        }
      }, machineGunInterval); 
    }
  };

  const handlePointerUp = () => {
    isPressingRef.current = false;
    if (pressIntervalRef.current) {
      clearInterval(pressIntervalRef.current);
      pressIntervalRef.current = null;
    }
  };

  const handlePointerLeave = () => {
    handlePointerUp();
    setShowCursorRing(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current || projects.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Follow the mouse with the guided "Click" ring (mouse only, never touch/pen)
    if (e.pointerType === 'mouse') {
      ringX.set(x);
      ringY.set(y);
      setShowCursorRing(true);
    }

    // Update press position if holding down
    if (isPressingRef.current) {
       lastPressPosRef.current = { x, y };
    }

    // Handle normal drag trail
    spawnImage(x, y);
  };

  const hasLargeImage = spawnedImages.some(img => img.isLarge);
  // Hide the guided ring while a large image is on screen so it never covers it
  const showRing = showCursorRing && !hasLargeImage;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave} // Stop if leaving container
      onPointerMove={handlePointerMove}
      className={`absolute inset-0 z-10 overflow-hidden select-none ${
        showRing ? 'cursor-none' : 'cursor-crosshair'
      }`}
    >
      <AnimatePresence>
        {spawnedImages.map((img) => (
          <m.div
            key={img.id}
            // Position centering logic: 
            // We use transform: translate(-50%, -50%) via x/y percent in framer motion
            // BUT for the drag trail (small images), we want the top-left corner to follow the cursor (traditional trail effect)
            // For large images (click), we want the CENTER to be at the cursor
            style={{ 
              left: img.x, 
              top: img.y,
              rotate: img.rotation,
              translateX: img.isLarge ? '-50%' : '0%', // Center large images
              translateY: img.isLarge ? '-50%' : '0%', // Center large images
              userSelect: 'none', // Prevent selection
              WebkitUserSelect: 'none',
            }}
            initial={{ opacity: 0, scale: 0.5, y: 0, x: 0 }}
            animate={{ 
              // DYNAMIC OPACITY LOGIC:
              // If ANY large image is present, dim all small trail images to 5% to let the large image shine.
              // Otherwise, keep them at 100%.
              opacity: (!img.isLarge && hasLargeImage) ? 0.05 : 1, 
              scale: 1,
              // "Drift" animation logic:
              // Large images (click): 
              // 1. Drift UP (-150px)
              // 2. Drift SIDEWAYS (driftX)
              // 3. Rotate continuously in ONE direction (driftRotate)
              y: img.isLarge ? -150 : -60,
              x: img.isLarge ? (img.driftX || 0) : 0,
              rotate: img.isLarge ? img.rotation + (img.driftRotate || 0) : img.rotation,
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              // "Disappear" animation logic:
              // Continue drifting up and sideways
              y: img.isLarge ? -300 : -100, 
              x: img.isLarge ? (img.driftX || 0) * 1.5 : 0, // Continue X drift
              transition: { duration: 0.4, ease: "easeIn" } 
            }}
            transition={{ 
              // Appear animation - Tuned for "Extreme Smoothness"
              // Uses a custom bezier that starts fast but decelerates very gradually (silkier feel)
              opacity: { duration: 0.25, ease: "easeOut" },
              scale: { duration: 0.5, ease: [0.19, 1, 0.22, 1] }, // "Expo out" curve for ultra-smooth stop
              
              // Continuous drift animation
              y: { duration: img.isLarge ? 5 : 2, ease: "linear" }, 
              x: { duration: img.isLarge ? 5 : 2, ease: "linear" }, 
              rotate: { duration: 6, ease: "linear" } 
            }}
            className={`absolute pointer-events-none origin-center ${
              img.isLarge 
                ? 'w-[80vw] h-auto min-h-[300px] z-10'
                : 'w-[300px] h-[200px] z-20' 
            }`}
          >
            <SpawnedPreviewImage src={img.src} />
          </m.div>
        ))}
      </AnimatePresence>

      {/* Guided "Click" cursor ring — only visible while no large image is on screen */}
      <AnimatePresence>
        {showRing && (
          <m.div
            className="absolute z-30 pointer-events-none"
            style={{ left: smoothRingX, top: smoothRingY, translateX: '-50%', translateY: '-50%' }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <div className="relative flex items-center justify-center w-[84px] h-[84px] [filter:drop-shadow(0_0_4px_rgba(255,255,255,0.85))]">
              {/* Pulsing halo */}
              <m.span
                className="absolute inset-0 rounded-full border-2 border-[#1f2021]/30"
                animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              />
              {/* Rotating dashed line circle */}
              <svg
                className="absolute inset-0 w-full h-full animate-[spin_9s_linear_infinite]"
                viewBox="0 0 100 100"
                fill="none"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="48"
                  stroke="#1f2021"
                  strokeOpacity="0.75"
                  strokeWidth="1.5"
                  strokeDasharray="4 8"
                />
              </svg>
              {/* Solid inner ring */}
              <span className="absolute inset-[12px] rounded-full border border-[#1f2021]/80" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1f2021]">
                Click
              </span>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};
