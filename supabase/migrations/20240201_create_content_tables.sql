-- Create projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    link TEXT NOT NULL,
    "wechatLink" TEXT,
    "redNoteLink" TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title_en TEXT NOT NULL,
    title_zh TEXT NOT NULL,
    excerpt_en TEXT NOT NULL,
    excerpt_zh TEXT NOT NULL,
    content_en TEXT NOT NULL,
    content_zh TEXT NOT NULL,
    date TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    author TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access on projects"
    ON public.projects
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public read access on posts"
    ON public.posts
    FOR SELECT
    TO public
    USING (true);

-- Insert initial data for projects
INSERT INTO public.projects (title, category, "imageUrl", link, "wechatLink", "redNoteLink") VALUES
('Mysterium', 'Branding / Packaging', 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/774bba243138293.Y3JvcCw1NzA4LDQ0NjUsMTE0NCww.jpg', 'https://www.behance.net/gallery/243138293/Mysterium', NULL, NULL),
('LinCoffee', 'Strategy / Identity', 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/45d9fb210070345.Y3JvcCwxMDMxLDgwNiwwLDEyMg.jpg', 'https://www.behance.net/gallery/210070345/LinCoffee', 'https://mp.weixin.qq.com/s/example', 'https://xiaohongshu.com/example'),
('Mist Haven', 'Visual Identity', 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/c58765242739851.Y3JvcCwxMzQyLDEwNTAsMjksMA.jpg', 'https://www.behance.net/gallery/242739851/Mist-Haven', NULL, NULL),
('BiteJoy', 'Packaging / Illustration', 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/3cfb57204694821.Y3JvcCw0NTI5LDM1NDMsMTc5LDA.jpg', 'https://www.behance.net/gallery/204694821/BiteJoy', NULL, NULL),
('Vondara', 'Rebranding / B2B', 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/7a127e238487221.Y3JvcCw0NTI5LDM1NDMsMTAwLDA.jpg', 'https://www.behance.net/gallery/184872221/Vondara-Marble', NULL, NULL);

-- Insert initial data for posts
INSERT INTO public.posts (slug, title_en, title_zh, excerpt_en, excerpt_zh, content_en, content_zh, date, "imageUrl", author, tags) VALUES
(
    'lincoffee-oriental-aesthetics',
    'LinCoffee: Modern Interpretation of Oriental Aesthetics & Coffee Culture',
    'LinCoffee：東方美學與咖啡文化的現代演繹',
    'Exploring how LinCoffee integrates oriental garden elements into modern coffee experiences, creating a unique cultural consumption scene.',
    '探討 LinCoffee 如何將東方園林元素融入現代咖啡體驗，打造獨特的文化消費場景。',
    E'\n# LinCoffee: Modern Interpretation of Oriental Aesthetics & Coffee Culture\n\nCoffee culture has been in Asia for years, but how to differentiate? LinCoffee''s answer is: Return to the Orient.\n\n## Brand Philosophy\n\nLinCoffee is not just a cup of coffee, but an oriental philosophy of "slowing down". The visual inspiration comes from the "changing scenery with every step" of oriental gardens, symbolizing elements like landscapes, bamboo shadows, and window lattices.\n\n### Visual Identity System\n\nThe Logo we designed for LinCoffee uses simple lines to outline a shape similar to traditional Chinese window patterns. For colors, we chose deep "dark green" and warm "terracotta", retaining the attributes of coffee while conveying the calmness and elegance of oriental culture.\n\n## Spatial Experience\n\nIn terms of spatial design, we broke the open layout of traditional coffee shops and introduced the concepts of "screens" and "semi-partitions" to provide customers with a more private and quiet drinking space, as if they were in a hidden garden in the city.\n    ',
    E'\n# LinCoffee：東方美學與咖啡文化的現代演繹\n\n咖啡文化傳入亞洲多年，如何做出差異化？LinCoffee 給出的答案是：回歸東方。\n\n## 品牌理念\n\nLinCoffee 不僅僅是一杯咖啡，更是一種"慢下來"的東方生活哲學。品牌視覺靈感源自東方園林的"移步換景"，將山水、竹影、窗櫺等元素進行符號化提煉。\n\n### 視覺識別系統\n\n我們為 LinCoffee 設計的 Logo 採用了簡約的線條，勾勒出類似中式窗花的形態。色彩上，選用了深邃的"墨綠"與溫暖的"陶土色"，既保留了咖啡的屬性，又傳遞出東方文化的沉穩與雅致。\n\n## 空間體驗\n\n在空間設計上，我們打破了傳統咖啡店的開放式佈局，引入了"屏風"和"半隔斷"的概念，為顧客提供更私密、更安靜的品飲空間，彷彿置身於一處都市中的隱世庭院。\n    ',
    '2025-01-15',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/45d9fb210070345.Y3JvcCwxMDMxLDgwNiwwLDEyMg.jpg',
    'Up-Brands Strategy Team',
    ARRAY['Brand Upgrade', 'Visual Identity', 'Coffee Culture']
),
(
    'mysterium-wine-branding',
    'Mysterium: Branding for California Luxury Wine',
    'Mysterium：加州奢華紅酒的品牌塑造',
    'How to convey the mystery and prestige of red wine through packaging design? The Mysterium case demonstrates the power of minimalism in the high-end market.',
    '如何通過包裝設計傳遞紅酒的神秘與尊貴？Mysterium 的案例展示了極簡主義在高端市場的力量。',
    E'\n# Mysterium: Branding for California Luxury Wine\n\nMysterium is a top-tier red wine from California, targeting high-net-worth individuals who seek quality and unique experiences. The core concepts of the brand are "Mystery" and "Discovery".\n\n## Design Language: Night & Starlight\n\nThe packaging design boldly uses an all-black matte material, symbolizing the quiet night sky where grapes grow. The Logo uses gold foil stamping, like starlight twinkling in the night sky, guiding explorers to unveil its veil.\n\n### Tactile Experience\n\nLuxury is not just visual, but tactile. We specifically chose textured specialty paper so that when consumers touch the bottle, they can feel the vitality like soil. This attention to detail greatly enhances the product''s premium value.\n    ',
    E'\n# Mysterium：加州奢華紅酒的品牌塑造\n\nMysterium 是一款來自加州的頂級紅酒，目標客戶是追求品質與獨特體驗的高淨值人群。品牌的核心概念是"神秘"（Mystery）與"探索"（Discovery）。\n\n## 設計語言：暗夜與星光\n\n包裝設計大膽地採用了全黑色的磨砂材質，象徵著葡萄生長的靜謐夜空。Logo 則採用燙金工藝，如同夜空中閃爍的星光，引導著探索者去揭開它的面紗。\n\n### 觸感體驗\n\n奢華不僅僅是視覺，更是觸覺。我們特意選用了有肌理感的特種紙，讓消費者在觸摸瓶身時，能感受到如同土壤般的生命力。這種細節的打磨，極大提升了產品的溢價能力。\n    ',
    '2024-12-10',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/774bba243138293.Y3JvcCw1NzA4LDQ0NjUsMTE0NCww.jpg',
    'Up-Brands Design Lab',
    ARRAY['Wine Branding', 'Packaging Design', 'Luxury']
),
(
    'mist-haven-spa-identity',
    'Mist Haven: Creating a Spiritual Sanctuary in the City',
    'Mist Haven：打造都市中的心靈庇護所',
    'Mist Haven SPA Full Case Study: How to build a sense of relaxation and healing space using visual language.',
    'Mist Haven SPA 品牌全案解析：如何用視覺語言構建鬆弛感與療癒空間。',
    E'\n# Mist Haven: Creating a Spiritual Sanctuary in the City\n\nIn the anxiety-filled urban life, people long for a place to escape the hustle and bustle and return to themselves. Mist Haven was born for this.\n\n## Brand Metaphor: Mist & Haven\n\n"Mist" symbolizes mystery and isolation from outside distractions, while "Haven" symbolizes safety and belonging. Our design revolves around these two keywords.\n\n### Flowing Visuals\n\nThe Logo design uses flowing lines, like water, and like smoke, conveying a soft and inclusive brand temperament. The auxiliary graphics make extensive use of gradients to simulate the visual effect of morning mist, allowing people to feel physical and mental relaxation at first glance of the brand image.\n    ',
    E'\n# Mist Haven：打造都市中的心靈庇護所\n\n在焦慮蔓延的都市生活中，人們渴望一個可以逃離喧囂、回歸自我的地方。Mist Haven 正是為此而生。\n\n## 品牌隱喻：迷霧與港灣\n\n"Mist"（迷霧）象徵著神秘與隔絕外界紛擾，"Haven"（港灣）象徵著安全與歸屬。我們的設計圍繞這兩個關鍵詞展開。\n\n### 流動的視覺\n\nLogo 設計採用了流動的線條，如同水流，又如同煙霧，傳遞出柔軟、包容的品牌氣質。輔助圖形則大量運用了漸變色，模擬晨霧瀰漫的視覺效果，讓人在看到品牌形象的第一眼，就能感受到身心的放鬆。\n    ',
    '2024-11-20',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/c58765242739851.Y3JvcCwxMzQyLDEwNTAsMjksMA.jpg',
    'Up-Brands Lifestyle',
    ARRAY['SPA Branding', 'Visual Identity', 'Wellness']
),
(
    'bitejoy-pastry-branding',
    'BiteJoy: A Taste of Magic for Pure Happiness',
    'BiteJoy：一口快樂的味覺魔法',
    'How does a dessert brand break through homogenized competition? BiteJoy captured the hearts of young people through high-saturation colors and fun illustrations.',
    '甜品品牌如何突破同質化競爭？BiteJoy 通過高飽和度的色彩與趣味插畫，俘獲了年輕人的心。',
    E'\n# BiteJoy: A Taste of Magic for Pure Happiness\n\nDessert is a business of selling happiness. BiteJoy''s brand core is "Pure Joy".\n\n## Color Psychology\n\nWe abandoned the pastel colors commonly used in traditional dessert shops and boldly adopted high-saturation dopamine color schemes—bright yellow, bright orange, and electric blue. These colors can instantly stimulate the brain to secrete dopamine, making customers feel excited and happy the moment they enter the store.\n\n## Personified Illustrations\n\nTo increase the brand''s affinity, we created a set of "greedy mouth" illustration images. These pictures of wide-open mouths enjoying food are extremely infectious and have become BiteJoy''s most recognizable visual symbol.\n    ',
    E'\n# BiteJoy：一口快樂的味覺魔法\n\n甜品是販賣快樂的生意。BiteJoy 的品牌核心就是"純粹的快樂"（Pure Joy）。\n\n## 色彩心理學\n\n我們摒棄了傳統甜品店常用的粉嫩色系，大膽啟用了高飽和度的多巴胺配色——明黃、亮橙、電光藍。這些色彩能瞬間刺激大腦分泌多巴胺，讓顧客在進店的瞬間就感到興奮和愉悅。\n\n## 擬人化插畫\n\n為了增加品牌的親和力，我們創造了一組"貪吃嘴"的插畫形象。這些張大的嘴巴正在享受美食的畫面，極具感染力，也成為了 BiteJoy 最具辨識度的視覺符號。\n    ',
    '2024-10-05',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/3cfb57204694821.Y3JvcCw0NTI5LDM1NDMsMTc5LDA.jpg',
    'Up-Brands Creative',
    ARRAY['Food Branding', 'Illustration', 'Packaging']
),
(
    'vondara-marble-luxury',
    'Vondara Marble: Artistic Expression of Stone',
    'Vondara Marble：石材的藝術化表達',
    'When building materials become artworks: Vondara rebranding case study, exploring the aesthetic upgrade of B2B brands.',
    '當建築材料成為藝術品：Vondara 品牌重塑案例，探索 B2B 品牌的審美升級。',
    E'\n# Vondara Marble: Artistic Expression of Stone\n\nVondara is a brand focused on high-end engineered jade stone. In traditional concepts, the building materials industry often gives an impression of "rough" and "industrial". Vondara hopes to break this and position itself as a "Spatial Artist".\n\n## Texture is Soul\n\nThe most beautiful thing about stone lies in its natural, unreplicable texture. We extracted the microscopic texture of Vondara products as the core of the brand''s auxiliary graphics. These textures, processed artistically, are like abstract paintings, revealing the microscopic universe inside the stone.\n\n## Minimalism & White Space\n\nIn the brand brochure and website design, we made extensive use of white space, giving the stage entirely to the product itself. This gallery-style display method greatly enhanced the brand''s style and is deeply loved by designers and high-end owners.\n    ',
    E'\n# Vondara Marble：石材的藝術化表達\n\nVondara 是一家專注於高端人造玉石的品牌。在傳統觀念中，建材行業往往給人"粗獷"、"工業"的印象。Vondara 希望打破這一點，將自己定位為"空間藝術家"。\n\n## 紋理即靈魂\n\n石材最美的地方在於其天然、不可複製的紋理。我們將 Vondara 產品的顯微紋理提取出來，作為品牌輔助圖形的核心。這些紋理經過藝術化處理，如同抽象畫一般，展現了石材內部的微觀宇宙。\n\n## 極簡與留白\n\n在品牌畫冊和網站設計中，我們大量使用了留白，將舞台完全交給產品本身。這種畫廊式的展示方式，極大提升了品牌的格調，深受設計師和高端業主的喜愛。\n    ',
    '2024-09-15',
    'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/7a127e238487221.Y3JvcCw0NTI5LDM1NDMsMTAwLDA.jpg',
    'Up-Brands B2B Team',
    ARRAY['Material Branding', 'B2B Design', 'Luxury']
);
