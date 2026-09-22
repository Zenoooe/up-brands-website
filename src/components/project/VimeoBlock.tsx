import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useInView } from 'framer-motion';

export function VimeoBlock({ videoId }: { videoId: string }) {
  const [aspectRatio, setAspectRatio] = useState(16 / 9); // Default to 16:9
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null); // Type as any to avoid importing Player type eagerly
  const isInView = useInView(containerRef, { once: true, margin: "200px" });
  const [playerLoaded, setPlayerLoaded] = useState(false);

  // Fetch aspect ratio
  useEffect(() => {
    // Only fetch info if in view to save requests
    if (!isInView) return;

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
  }, [videoId, isInView]);

  // Initialize Vimeo Player lazily
  useEffect(() => {
    if (!isInView || !iframeRef.current || playerRef.current) return;

    let isMounted = true;

    // Dynamic import
    import('@vimeo/player').then(({ default: Player }) => {
      if (!isMounted || !iframeRef.current) return;

      const player = new Player(iframeRef.current);
      playerRef.current = player;
      setPlayerLoaded(true);

      player.on('volumechange', (data: { volume: number }) => {
        if (isMounted) setIsMuted(data.volume === 0);
      });
    }).catch(err => console.error("Failed to load Vimeo player", err));

    return () => {
      isMounted = false;
      if (playerRef.current) {
        playerRef.current.off('volumechange');
        playerRef.current.unload();
        playerRef.current = null;
      }
    };
  }, [videoId, isInView]);

  const toggleMute = async () => {
    if (!playerRef.current) return;
    
    try {
      if (isMuted) {
        await playerRef.current.setVolume(1);
        await playerRef.current.setMuted(false);
        setIsMuted(false);
      } else {
        await playerRef.current.setVolume(0);
        await playerRef.current.setMuted(true);
        setIsMuted(true);
      }
    } catch (e) {
      console.error("Error toggling mute", e);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="w-full bg-black relative group"
      style={{ aspectRatio: aspectRatio }}
    >
      {isInView ? (
        <>
          <iframe 
            ref={iframeRef}
            src={`https://player.vimeo.com/video/${videoId}?autoplay=1&loop=1&muted=1&controls=0&title=0&byline=0&portrait=0&playsinline=1`}
            className="absolute inset-0 w-full h-full pointer-events-none" 
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
          
          {/* Custom Mute Toggle Button - Only show if player is loaded */}
          {playerLoaded && (
            <button
              onClick={toggleMute}
              className="absolute bottom-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}
        </>
      ) : (
        /* Placeholder while out of view */
        <div className="absolute inset-0 bg-gray-900 animate-pulse" />
      )}
    </div>
  );
}
