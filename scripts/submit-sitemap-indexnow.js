// scripts/submit-sitemap-indexnow.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HOST = 'www.up-brands.com';
const PROTOCOL = 'https';
// Use existing key from public directory
const KEY = 'a3cd48afa2594bc6b12faaa904168506';

// Sitemap location (assuming npm run build or npm run sitemap:local has run)
const sitemapPath = path.join(__dirname, '../public/sitemap.xml');

if (!fs.existsSync(sitemapPath)) {
  console.error('Error: public/sitemap.xml not found. Please run "npm run sitemap:local" first.');
  process.exit(1);
}

const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');

// Simple regex to extract URLs
const urls = sitemapContent.match(/<loc>(.*?)<\/loc>/g)?.map(val => val.replace(/<\/?loc>/g, '')) || [];

if (urls.length === 0) {
  console.log('No URLs found in sitemap.');
  process.exit(0);
}

// Filter out non-production URLs if any (e.g. localhost)
const validUrls = urls.filter(url => url.includes(HOST));

console.log(`Found ${validUrls.length} valid URLs.`);
console.log('Submitting to IndexNow...');

const payload = {
  host: HOST,
  key: KEY,
  keyLocation: `${PROTOCOL}://${HOST}/${KEY}.txt`,
  urlList: validUrls
};

// Submit to IndexNow
fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
  },
  body: JSON.stringify(payload),
})
.then(async res => {
  if (res.ok) {
    console.log('✅ Successfully submitted URLs to IndexNow.');
  } else {
    console.error('❌ Failed to submit:', res.statusText);
    const text = await res.text();
    console.error('Response:', text);
  }
})
.catch(err => console.error('Error:', err));
