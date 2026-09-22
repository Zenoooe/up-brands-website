import { getSupabaseUrl } from './src/utils/image.js';

const urls = [
  'https://fabrikbrands.com/wp-content/uploads/Examples-Of-Corporate-Branding-01-scaled.jpg',
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop'
];

for (const u of urls) {
  console.log(`Original: ${u}`);
  console.log(`Proxied : ${getSupabaseUrl(u, 800)}`);
  console.log('---');
}
