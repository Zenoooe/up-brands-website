import { useState, useRef, useEffect } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface ResponsiveImageProps extends Omit<HTMLMotionProps<"img">, "src" | "srcSet"> {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

function toWpImageProxyUrl(url: string) {
  const cleaned = url.replace(/^https?:\/\//, '');
  return `https://i0.wp.com/${cleaned}`;
}

function getSupabaseUrl(url: string, width: number) {
  if (!url.includes('supabase.co')) return url;
  
  // Replace with custom CDN if configured (e.g. Cloudflare)
  const cdnUrl = import.meta.env.VITE_SUPABASE_CDN_URL;
  let optimizedUrl = url;
  
  if (cdnUrl) {
    // Replace the supabase project domain with CDN domain
    // Example: https://xyz.supabase.co -> https://cdn.up-brands.com
    const urlObj = new URL(url);
    optimizedUrl = `${cdnUrl}${urlObj.pathname}`;
  }

  const separator = optimizedUrl.includes('?') ? '&' : '?';
  return `${optimizedUrl}${separator}width=${width}&quality=80&format=webp`;
}

export const ResponsiveImage = ({ src: originalSrc, alt, className, priority = false, ...props }: ResponsiveImageProps) => {
  // Determine if it's a Supabase image
  const isSupabase = originalSrc.includes('supabase.co');

  // Generate srcSet for Supabase images
  const srcSet = isSupabase 
    ? `${getSupabaseUrl(originalSrc, 400)} 400w, ${getSupabaseUrl(originalSrc, 800)} 800w, ${getSupabaseUrl(originalSrc, 1200)} 1200w`
    : undefined;

  // Sizes attribute
  const sizes = "(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px";

  // Fallback / Proxy logic
  const proxySrc = toWpImageProxyUrl(originalSrc);
  const [currentSrc, setCurrentSrc] = useState(isSupabase ? getSupabaseUrl(originalSrc, 800) : originalSrc);
  const loadedRef = useRef(false);

  useEffect(() => {
    // If not supabase, use smart proxy fallback logic
    if (!isSupabase) {
      loadedRef.current = false;
      setCurrentSrc(originalSrc);
      const timeoutId = window.setTimeout(() => {
        if (!loadedRef.current) setCurrentSrc(proxySrc);
      }, 30000);
      return () => window.clearTimeout(timeoutId);
    }
  }, [originalSrc, proxySrc, isSupabase]);

  return (
    <motion.img
      src={currentSrc}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      onLoad={() => { loadedRef.current = true; }}
      onError={() => {
        if (!isSupabase) setCurrentSrc(proxySrc);
      }}
      loading={priority ? "eager" : "lazy"}
      // @ts-ignore
      fetchpriority={priority ? "high" : "auto"}
      {...props}
    />
  );
};
