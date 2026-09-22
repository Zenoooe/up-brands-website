
export interface Project {
  id: string;
  slug?: string; // Custom URL slug (optional, but recommended)
  title: string;
  subtitle?: string;
  category: string;
  imageUrl: string;
  backup_image_url?: string;
  link: string; // Behance Link
  wechatLink?: string; // WeChat Article Link
  redNoteLink?: string; // RedNote (Xiaohongshu) Link
  dribbbleLink?: string;
  zcoolLink?: string;
  gutianluLink?: string;
  instagramLink?: string;
  worldBrandSocietyLink?: string;
  packagingOfTheWorldLink?: string;
  images?: string[]; // Array of project detail images
  description?: string; // Full project description (Default/Chinese)
  description_tw?: string; // Traditional Chinese description
  description_en?: string; // English description
  credits?: Record<string, string>; // e.g. { "Production": "Calitho", "Photographer": "Rob" }
  gallery_layout?: 'full' | 'grid' | 'centered' | 'stack';
  image_gap?: number;
  sort_order?: number;
  is_visible?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_zh: string;
  excerpt_en: string;
  excerpt_zh: string;
  content_en: string; // Markdown or HTML
  content_zh: string; // Markdown or HTML
  date: string;
  imageUrl: string;
  backup_image_url?: string;
  author: string;
  tags: string[];
  sort_order?: number;
  is_visible?: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface Settings {
  key: string;
  value: any;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
