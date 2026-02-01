export interface Project {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
  backup_image_url?: string;
  link: string; // Behance Link
  wechatLink?: string; // WeChat Article Link
  redNoteLink?: string; // RedNote (Xiaohongshu) Link
  sort_order?: number;
  is_visible?: boolean;
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
