-- Drop existing table
DROP TABLE IF EXISTS public.projects;

-- Re-create table with id as TEXT
CREATE TABLE public.projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    link TEXT NOT NULL,
    "wechatLink" TEXT,
    "redNoteLink" TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Re-create policy
CREATE POLICY "Allow public read access on projects"
    ON public.projects
    FOR SELECT
    TO public
    USING (true);

-- Insert all 8 projects
INSERT INTO public.projects (id, title, category, "imageUrl", link, "wechatLink", "redNoteLink", sort_order) VALUES
(
    '243138293',
    'Mysterium',
    'California Luxury Wine Branding',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/774bba243138293.Y3JvcCw1NzA4LDQ0NjUsMTE0NCww.jpg',
    'https://www.behance.net/gallery/243138293/Mysterium-California-Luxury-Wine-Branding-Concept',
    'https://mp.weixin.qq.com/s/example_mysterium',
    'https://www.xiaohongshu.com/explore/example_mysterium',
    1
),
(
    '242739851',
    'Mist Haven',
    'Private Sanctuary & SPA',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/c58765242739851.Y3JvcCwxMzQyLDEwNTAsMjksMA.jpg',
    'https://www.behance.net/gallery/242739851/-Mist-Haven-Private-Sanctuary-SPA-Branding',
    'https://mp.weixin.qq.com/s/example_misthaven',
    'https://www.xiaohongshu.com/explore/example_misthaven',
    2
),
(
    '241141727',
    'VALROUGE',
    'Luxury Bordeaux Wine',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/cd8d8c241141727.Y3JvcCw5NjIsNzUyLDIxOSwxNDc.jpg',
    'https://www.behance.net/gallery/241141727/VALROUGE-Luxury-Bordeaux-Wine-Branding-Packaging',
    'https://mp.weixin.qq.com/s/example_valrouge',
    'https://www.xiaohongshu.com/explore/example_valrouge',
    3
),
(
    '239478067',
    'Luminelli',
    'Cosmetics Branding',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/678b9a239478067.Y3JvcCwxMzQyLDEwNTAsMjksMA.jpg',
    'https://www.behance.net/gallery/239478067/Luminelli-Cosmetics',
    'https://mp.weixin.qq.com/s/example_luminelli',
    'https://www.xiaohongshu.com/explore/example_luminelli',
    4
),
(
    '238487221',
    'Vondara Marble',
    'Engineered Jade Stone',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/7a127e238487221.Y3JvcCw0NTI5LDM1NDMsMTAwLDA.jpg',
    'https://www.behance.net/gallery/238487221/Vondara-Marble-Engineered-Jade-Stone-Brand-Design',
    'https://mp.weixin.qq.com/s/example_vondara',
    'https://www.xiaohongshu.com/explore/example_vondara',
    5
),
(
    '210070345',
    'LinCoffee',
    'Oriental Coffee & Tea',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/45d9fb210070345.Y3JvcCwxMDMxLDgwNiwwLDEyMg.jpg',
    'https://www.behance.net/gallery/210070345/LinCoffee-Oriental-Coffee-Tea',
    'https://mp.weixin.qq.com/s/example_lincoffee',
    'https://www.xiaohongshu.com/explore/example_lincoffee',
    6
),
(
    '204694821',
    'BiteJoy',
    'Macaron, Cake & Pastries',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/3cfb57204694821.Y3JvcCw0NTI5LDM1NDMsMTc5LDA.jpg',
    'https://www.behance.net/gallery/204694821/BiteJoy-Macaron-Cake-Pastries',
    'https://mp.weixin.qq.com/s/example_bitejoy',
    'https://www.xiaohongshu.com/explore/example_bitejoy',
    7
),
(
    '198813305',
    'Ferment Force',
    'Juice Branding',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/a0f6d4198813305.Y3JvcCwyNDI1LDE4OTYsMTE4OCw5Nzg.jpg',
    'https://www.behance.net/gallery/198813305/Ferment-Force-Juice-Branding',
    'https://mp.weixin.qq.com/s/example_fermentforce',
    'https://www.xiaohongshu.com/explore/example_fermentforce',
    8
);
