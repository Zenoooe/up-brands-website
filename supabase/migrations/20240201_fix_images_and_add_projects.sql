
-- 1. Fix broken images for the blog posts we just added
UPDATE public.posts 
SET "imageUrl" = 'https://images.unsplash.com/photo-1507679799938-d9ac035d16ef?q=80&w=2070&auto=format&fit=crop'
WHERE slug = 'brand-innovation-guide';

UPDATE public.posts 
SET "imageUrl" = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop'
WHERE slug = 'startup-branding-golden-time';

UPDATE public.posts 
SET "imageUrl" = 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop'
WHERE slug = 'avoiding-branding-mistakes';

UPDATE public.posts 
SET "imageUrl" = 'https://images.unsplash.com/photo-1561070791692-1c3209d85459?q=80&w=2070&auto=format&fit=crop'
WHERE slug = 'visual-language-power';


-- 2. Insert Projects from the original website
INSERT INTO public.projects (id, title, category, "imageUrl", link, sort_order)
VALUES
(
  'zhuhai-shopping-festival',
  'Zhuhai Shopping Festival IP | 珠海市購物節IP',
  'Branding | Rebranding',
  'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?q=80&w=2070&auto=format&fit=crop',
  'https://www.up-brands.com/projects',
  10
),
(
  'chichu-coffee',
  'CHICHU COFFEE | 彳亍咖啡',
  'Space Design | VI Upgrade',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2070&auto=format&fit=crop',
  'https://www.up-brands.com/projects',
  11
),
(
  'four-joy-tea',
  'Four Joy Tea House | 四喜茶肆',
  'Brand Identity | VI Rebranding',
  'https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=2070&auto=format&fit=crop',
  'https://www.up-brands.com/projects',
  12
),
(
  'taibang-finance',
  'Taibang Finance | 太邦金融',
  'Brand Rebranding | Image Update',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
  'https://www.up-brands.com/projects',
  13
),
(
  'xiaoman-handmade',
  'Xiaoman Handmade | 小滿手作',
  'Strategy Upgrade | Packaging',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2070&auto=format&fit=crop',
  'https://www.up-brands.com/projects',
  14
),
(
  'jinqi-education',
  'Jinqi International Education | 金旗國際教育',
  'Brand Rebranding | UI Design',
  'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop',
  'https://www.up-brands.com/projects',
  15
);
