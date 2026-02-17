import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  plugins: [
    react({
      babel: {
        plugins: [],
      },
    }),
    tsconfigPaths(),
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 75 },
      webp: { quality: 80, lossless: true },
      avif: { quality: 70, lossless: true },
    }),
  ],
  server: {
    proxy: {
      '/behance-proxy': {
        target: 'https://www.behance.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/behance-proxy/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        },
        followRedirects: true
      },
      '/behance-cdn': {
        target: 'https://mir-s3-cdn-cf.behance.net',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/behance-cdn/, ''),
        headers: {
          'Referer': 'https://www.behance.net/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        }
      }
    }
  }
})
