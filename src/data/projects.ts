export interface Project {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  link: string; // Behance Link
  wechatLink?: string; // WeChat Article Link
  redNoteLink?: string; // RedNote (Xiaohongshu) Link
}

// Updated with exact Behance CDN images from your portfolio
export const projects: Project[] = [
  {
    id: '243138293',
    title: 'Mysterium',
    category: 'California Luxury Wine Branding',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/774bba243138293.Y3JvcCw1NzA4LDQ0NjUsMTE0NCww.jpg',
    link: 'https://www.behance.net/gallery/243138293/Mysterium-California-Luxury-Wine-Branding-Concept',
    wechatLink: 'https://mp.weixin.qq.com/s/example_mysterium',
    redNoteLink: 'https://www.xiaohongshu.com/explore/example_mysterium'
  },
  {
    id: '242739851',
    title: 'Mist Haven',
    category: 'Private Sanctuary & SPA',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/c58765242739851.Y3JvcCwxMzQyLDEwNTAsMjksMA.jpg',
    link: 'https://www.behance.net/gallery/242739851/-Mist-Haven-Private-Sanctuary-SPA-Branding',
    wechatLink: 'https://mp.weixin.qq.com/s/example_misthaven',
    redNoteLink: 'https://www.xiaohongshu.com/explore/example_misthaven'
  },
  {
    id: '241141727',
    title: 'VALROUGE',
    category: 'Luxury Bordeaux Wine',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/cd8d8c241141727.Y3JvcCw5NjIsNzUyLDIxOSwxNDc.jpg',
    link: 'https://www.behance.net/gallery/241141727/VALROUGE-Luxury-Bordeaux-Wine-Branding-Packaging',
    wechatLink: 'https://mp.weixin.qq.com/s/example_valrouge',
    redNoteLink: 'https://www.xiaohongshu.com/explore/example_valrouge'
  },
  {
    id: '239478067',
    title: 'Luminelli',
    category: 'Cosmetics Branding',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/678b9a239478067.Y3JvcCwxMzQyLDEwNTAsMjksMA.jpg',
    link: 'https://www.behance.net/gallery/239478067/Luminelli-Cosmetics',
    wechatLink: 'https://mp.weixin.qq.com/s/example_luminelli',
    redNoteLink: 'https://www.xiaohongshu.com/explore/example_luminelli'
  },
  {
    id: '238487221',
    title: 'Vondara Marble',
    category: 'Engineered Jade Stone',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/7a127e238487221.Y3JvcCw0NTI5LDM1NDMsMTAwLDA.jpg',
    link: 'https://www.behance.net/gallery/238487221/Vondara-Marble-Engineered-Jade-Stone-Brand-Design',
    wechatLink: 'https://mp.weixin.qq.com/s/example_vondara',
    redNoteLink: 'https://www.xiaohongshu.com/explore/example_vondara'
  },
  {
    id: '210070345',
    title: 'LinCoffee',
    category: 'Oriental Coffee & Tea',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/45d9fb210070345.Y3JvcCwxMDMxLDgwNiwwLDEyMg.jpg',
    link: 'https://www.behance.net/gallery/210070345/LinCoffee-Oriental-Coffee-Tea',
    wechatLink: 'https://mp.weixin.qq.com/s/example_lincoffee',
    redNoteLink: 'https://www.xiaohongshu.com/explore/example_lincoffee'
  },
  {
    id: '204694821',
    title: 'BiteJoy',
    category: 'Macaron, Cake & Pastries',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/3cfb57204694821.Y3JvcCw0NTI5LDM1NDMsMTc5LDA.jpg',
    link: 'https://www.behance.net/gallery/204694821/BiteJoy-Macaron-Cake-Pastries',
    wechatLink: 'https://mp.weixin.qq.com/s/example_bitejoy',
    redNoteLink: 'https://www.xiaohongshu.com/explore/example_bitejoy'
  },
  {
    id: '198813305',
    title: 'Ferment Force',
    category: 'Juice Branding',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/a0f6d4198813305.Y3JvcCwyNDI1LDE4OTYsMTE4OCw5Nzg.jpg',
    link: 'https://www.behance.net/gallery/198813305/Ferment-Force-Juice-Branding',
    wechatLink: 'https://mp.weixin.qq.com/s/example_fermentforce',
    redNoteLink: 'https://www.xiaohongshu.com/explore/example_fermentforce'
  }
];
