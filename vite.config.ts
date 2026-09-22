import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { parseBehanceRssXml } from './shared/behance';
import { extractProjectImagesFromHtml, isProjectPageUrl } from './shared/project-images';

const execFileAsync = promisify(execFile);
const behanceRssPythonScript = fileURLToPath(new URL('./scripts/fetch_behance_rss.py', import.meta.url));

function behanceDevPythonProxy() {
  const handleScriptRequest = async (
    res: any,
    scriptPath: string,
    args: string[],
    contentType: string,
    fallbackError: string,
  ) => {
    try {
      const { stdout } = await execFileAsync('python3', [scriptPath, ...args], {
        timeout: 15000,
        maxBuffer: 1024 * 1024 * 2,
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.end(stdout);
    } catch (error: any) {
      const details = error?.stderr?.trim() || error?.message || fallbackError;
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: fallbackError, details }));
    }
  };

  return {
    name: 'behance-dev-python-proxy',
    configureServer(server: any) {
      server.middlewares.use('/dev-api/behance-rss', async (req: any, res: any) => {
        const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        const username = requestUrl.searchParams.get('username');

        if (!username) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing username' }));
          return;
        }

        await handleScriptRequest(
          res,
          behanceRssPythonScript,
          [username],
          'application/xml; charset=utf-8',
          'Failed to fetch Behance feed',
        );
      });

      server.middlewares.use('/dev-api/behance-projects', async (req: any, res: any) => {
        const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        const username = requestUrl.searchParams.get('username');

        if (!username) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing username' }));
          return;
        }

        try {
          const { stdout } = await execFileAsync('python3', [behanceRssPythonScript, username], {
            timeout: 15000,
            maxBuffer: 1024 * 1024 * 2,
          });
          const result = parseBehanceRssXml(stdout);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.end(JSON.stringify({
            ...result,
            source: 'rss',
            warning: 'Local dev sync is using the Behance RSS feed, which only exposes the latest 12 items.',
          }));
        } catch (error: any) {
          const details = error?.stderr?.trim() || error?.message || 'Failed to fetch Behance projects';
          const statusCode = details.includes('429') || details.includes('Too many requests') ? 429 : 500;
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            error: statusCode === 429 
              ? 'Behance rate limit (429). Please wait 1-2 minutes before trying again.' 
              : 'Failed to fetch Behance projects', 
            details 
          }));
        }
      });
      server.middlewares.use('/dev-api/trigger-sitemap', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        try {
          const sitemapScript = fileURLToPath(new URL('./scripts/generate-sitemap-local.js', import.meta.url));
          await execFileAsync('node', [sitemapScript]);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
        } catch (error: any) {
          console.error('Failed to generate local sitemap:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to generate local sitemap' }));
        }
      });

      server.middlewares.use('/dev-api/extract-project-images', async (req: any, res: any) => {
        const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        const targetUrl = requestUrl.searchParams.get('url');

        if (!targetUrl) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        if (!isProjectPageUrl(targetUrl)) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Only Behance or ZCOOL project links are supported' }));
          return;
        }

        try {
          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Cache-Control': 'no-cache, no-store',
            },
          });

          const html = await response.text();
          if (!response.ok) {
            throw new Error(`Failed to fetch project page: ${response.status} ${response.statusText}`);
          }

          const images = extractProjectImagesFromHtml(html);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.end(JSON.stringify({ images, total: images.length }));
        } catch (error: any) {
          const details = error?.message || 'Failed to extract project images';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Failed to extract project images', details }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: 'hidden',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('react-quill') || id.includes('/quill/')) {
            return 'editor';
          }

          if (id.includes('opencc-js/dist/esm/t2cn.js')) {
            return 'opencc-t2cn';
          }

          if (id.includes('opencc-js/dist/esm/cn2t.js')) {
            return 'opencc-cn2t';
          }

          if (
            id.includes('react-beautiful-dnd') ||
            id.includes('@dnd-kit') ||
            id.includes('memoize-one') ||
            id.includes('raf-schd') ||
            id.includes('react-redux') ||
            id.includes('/redux/')
          ) {
            return 'admin-dnd';
          }

          if (
            id.includes('react-markdown') ||
            id.includes('remark-') ||
            id.includes('mdast-') ||
            id.includes('micromark')
          ) {
            return 'markdown';
          }

          if (
            id.includes('framer-motion') ||
            id.includes('motion-dom') ||
            id.includes('motion-utils') ||
            id.includes('/lenis/')
          ) {
            return 'motion';
          }

          if (
            id.includes('i18next') ||
            id.includes('react-i18next') ||
            id.includes('i18next-browser-languagedetector')
          ) {
            return 'i18n';
          }

          if (id.includes('@supabase')) {
            return 'supabase';
          }

          if (
            id.includes('react-hot-toast') ||
            id.includes('@vercel/analytics') ||
            id.includes('@vercel/speed-insights')
          ) {
            return 'app-shell';
          }

          if (
            id.includes('dompurify') ||
            id.includes('clsx') ||
            id.includes('tailwind-merge') ||
            id.includes('zustand') ||
            id.includes('lodash')
          ) {
            return 'utils';
          }

          if (id.includes('react-helmet-async')) {
            return 'seo';
          }

          if (id.includes('lucide-react') || id.includes('react-icons')) {
            return 'icons';
          }

          if (id.includes('@vimeo')) {
            return 'media';
          }

          if (
            id.includes('react-router') ||
            id.includes('@remix-run')
          ) {
            return 'router';
          }

          if (
            id.includes('/react-dom/') ||
            id.includes('/react/') ||
            id.includes('scheduler')
          ) {
            return 'react-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
  plugins: [
    behanceDevPythonProxy(),
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
