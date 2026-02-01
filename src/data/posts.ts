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
  author: string;
  tags: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    slug: 'lincoffee-oriental-aesthetics',
    title_en: 'LinCoffee: Modern Interpretation of Oriental Aesthetics & Coffee Culture',
    title_zh: 'LinCoffee：東方美學與咖啡文化的現代演繹',
    excerpt_en: 'Exploring how LinCoffee integrates oriental garden elements into modern coffee experiences, creating a unique cultural consumption scene.',
    excerpt_zh: '探討 LinCoffee 如何將東方園林元素融入現代咖啡體驗，打造獨特的文化消費場景。',
    content_en: `
# LinCoffee: Modern Interpretation of Oriental Aesthetics & Coffee Culture

Coffee culture has been in Asia for years, but how to differentiate? LinCoffee's answer is: Return to the Orient.

## Brand Philosophy

LinCoffee is not just a cup of coffee, but an oriental philosophy of "slowing down". The visual inspiration comes from the "changing scenery with every step" of oriental gardens, symbolizing elements like landscapes, bamboo shadows, and window lattices.

### Visual Identity System

The Logo we designed for LinCoffee uses simple lines to outline a shape similar to traditional Chinese window patterns. For colors, we chose deep "dark green" and warm "terracotta", retaining the attributes of coffee while conveying the calmness and elegance of oriental culture.

## Spatial Experience

In terms of spatial design, we broke the open layout of traditional coffee shops and introduced the concepts of "screens" and "semi-partitions" to provide customers with a more private and quiet drinking space, as if they were in a hidden garden in the city.
    `,
    content_zh: `
# LinCoffee：東方美學與咖啡文化的現代演繹

咖啡文化傳入亞洲多年，如何做出差異化？LinCoffee 給出的答案是：回歸東方。

## 品牌理念

LinCoffee 不僅僅是一杯咖啡，更是一種"慢下來"的東方生活哲學。品牌視覺靈感源自東方園林的"移步換景"，將山水、竹影、窗櫺等元素進行符號化提煉。

### 視覺識別系統

我們為 LinCoffee 設計的 Logo 採用了簡約的線條，勾勒出類似中式窗花的形態。色彩上，選用了深邃的"墨綠"與溫暖的"陶土色"，既保留了咖啡的屬性，又傳遞出東方文化的沉穩與雅致。

## 空間體驗

在空間設計上，我們打破了傳統咖啡店的開放式佈局，引入了"屏風"和"半隔斷"的概念，為顧客提供更私密、更安靜的品飲空間，彷彿置身於一處都市中的隱世庭院。
    `,
    date: '2025-01-15',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/45d9fb210070345.Y3JvcCwxMDMxLDgwNiwwLDEyMg.jpg',
    author: 'Up-Brands Strategy Team',
    tags: ['Brand Upgrade', 'Visual Identity', 'Coffee Culture']
  },
  {
    id: '2',
    slug: 'mysterium-wine-branding',
    title_en: 'Mysterium: Branding for California Luxury Wine',
    title_zh: 'Mysterium：加州奢華紅酒的品牌塑造',
    excerpt_en: 'How to convey the mystery and prestige of red wine through packaging design? The Mysterium case demonstrates the power of minimalism in the high-end market.',
    excerpt_zh: '如何通過包裝設計傳遞紅酒的神秘與尊貴？Mysterium 的案例展示了極簡主義在高端市場的力量。',
    content_en: `
# Mysterium: Branding for California Luxury Wine

Mysterium is a top-tier red wine from California, targeting high-net-worth individuals who seek quality and unique experiences. The core concepts of the brand are "Mystery" and "Discovery".

## Design Language: Night & Starlight

The packaging design boldly uses an all-black matte material, symbolizing the quiet night sky where grapes grow. The Logo uses gold foil stamping, like starlight twinkling in the night sky, guiding explorers to unveil its veil.

### Tactile Experience

Luxury is not just visual, but tactile. We specifically chose textured specialty paper so that when consumers touch the bottle, they can feel the vitality like soil. This attention to detail greatly enhances the product's premium value.
    `,
    content_zh: `
# Mysterium：加州奢華紅酒的品牌塑造

Mysterium 是一款來自加州的頂級紅酒，目標客戶是追求品質與獨特體驗的高淨值人群。品牌的核心概念是"神秘"（Mystery）與"探索"（Discovery）。

## 設計語言：暗夜與星光

包裝設計大膽地採用了全黑色的磨砂材質，象徵著葡萄生長的靜謐夜空。Logo 則採用燙金工藝，如同夜空中閃爍的星光，引導著探索者去揭開它的面紗。

### 觸感體驗

奢華不僅僅是視覺，更是觸覺。我們特意選用了有肌理感的特種紙，讓消費者在觸摸瓶身時，能感受到如同土壤般的生命力。這種細節的打磨，極大提升了產品的溢價能力。
    `,
    date: '2024-12-10',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/774bba243138293.Y3JvcCw1NzA4LDQ0NjUsMTE0NCww.jpg',
    author: 'Up-Brands Design Lab',
    tags: ['Wine Branding', 'Packaging Design', 'Luxury']
  },
  {
    id: '3',
    slug: 'mist-haven-spa-identity',
    title_en: 'Mist Haven: Creating a Spiritual Sanctuary in the City',
    title_zh: 'Mist Haven：打造都市中的心靈庇護所',
    excerpt_en: 'Mist Haven SPA Full Case Study: How to build a sense of relaxation and healing space using visual language.',
    excerpt_zh: 'Mist Haven SPA 品牌全案解析：如何用視覺語言構建鬆弛感與療癒空間。',
    content_en: `
# Mist Haven: Creating a Spiritual Sanctuary in the City

In the anxiety-filled urban life, people long for a place to escape the hustle and bustle and return to themselves. Mist Haven was born for this.

## Brand Metaphor: Mist & Haven

"Mist" symbolizes mystery and isolation from outside distractions, while "Haven" symbolizes safety and belonging. Our design revolves around these two keywords.

### Flowing Visuals

The Logo design uses flowing lines, like water, and like smoke, conveying a soft and inclusive brand temperament. The auxiliary graphics make extensive use of gradients to simulate the visual effect of morning mist, allowing people to feel physical and mental relaxation at first glance of the brand image.
    `,
    content_zh: `
# Mist Haven：打造都市中的心靈庇護所

在焦慮蔓延的都市生活中，人們渴望一個可以逃離喧囂、回歸自我的地方。Mist Haven 正是為此而生。

## 品牌隱喻：迷霧與港灣

"Mist"（迷霧）象徵著神秘與隔絕外界紛擾，"Haven"（港灣）象徵著安全與歸屬。我們的設計圍繞這兩個關鍵詞展開。

### 流動的視覺

Logo 設計採用了流動的線條，如同水流，又如同煙霧，傳遞出柔軟、包容的品牌氣質。輔助圖形則大量運用了漸變色，模擬晨霧瀰漫的視覺效果，讓人在看到品牌形象的第一眼，就能感受到身心的放鬆。
    `,
    date: '2024-11-20',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/c58765242739851.Y3JvcCwxMzQyLDEwNTAsMjksMA.jpg',
    author: 'Up-Brands Lifestyle',
    tags: ['SPA Branding', 'Visual Identity', 'Wellness']
  },
  {
    id: '4',
    slug: 'bitejoy-pastry-branding',
    title_en: 'BiteJoy: A Taste of Magic for Pure Happiness',
    title_zh: 'BiteJoy：一口快樂的味覺魔法',
    excerpt_en: 'How does a dessert brand break through homogenized competition? BiteJoy captured the hearts of young people through high-saturation colors and fun illustrations.',
    excerpt_zh: '甜品品牌如何突破同質化競爭？BiteJoy 通過高飽和度的色彩與趣味插畫，俘獲了年輕人的心。',
    content_en: `
# BiteJoy: A Taste of Magic for Pure Happiness

Dessert is a business of selling happiness. BiteJoy's brand core is "Pure Joy".

## Color Psychology

We abandoned the pastel colors commonly used in traditional dessert shops and boldly adopted high-saturation dopamine color schemes—bright yellow, bright orange, and electric blue. These colors can instantly stimulate the brain to secrete dopamine, making customers feel excited and happy the moment they enter the store.

## Personified Illustrations

To increase the brand's affinity, we created a set of "greedy mouth" illustration images. These pictures of wide-open mouths enjoying food are extremely infectious and have become BiteJoy's most recognizable visual symbol.
    `,
    content_zh: `
# BiteJoy：一口快樂的味覺魔法

甜品是販賣快樂的生意。BiteJoy 的品牌核心就是"純粹的快樂"（Pure Joy）。

## 色彩心理學

我們摒棄了傳統甜品店常用的粉嫩色系，大膽啟用了高飽和度的多巴胺配色——明黃、亮橙、電光藍。這些色彩能瞬間刺激大腦分泌多巴胺，讓顧客在進店的瞬間就感到興奮和愉悅。

## 擬人化插畫

為了增加品牌的親和力，我們創造了一組"貪吃嘴"的插畫形象。這些張大的嘴巴正在享受美食的畫面，極具感染力，也成為了 BiteJoy 最具辨識度的視覺符號。
    `,
    date: '2024-10-05',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/3cfb57204694821.Y3JvcCw0NTI5LDM1NDMsMTc5LDA.jpg',
    author: 'Up-Brands Creative',
    tags: ['Food Branding', 'Illustration', 'Packaging']
  },
  {
    id: '5',
    slug: 'vondara-marble-luxury',
    title_en: 'Vondara Marble: Artistic Expression of Stone',
    title_zh: 'Vondara Marble：石材的藝術化表達',
    excerpt_en: 'When building materials become artworks: Vondara rebranding case study, exploring the aesthetic upgrade of B2B brands.',
    excerpt_zh: '當建築材料成為藝術品：Vondara 品牌重塑案例，探索 B2B 品牌的審美升級。',
    content_en: `
# Vondara Marble: Artistic Expression of Stone

Vondara is a brand focused on high-end engineered jade stone. In traditional concepts, the building materials industry often gives an impression of "rough" and "industrial". Vondara hopes to break this and position itself as a "Spatial Artist".

## Texture is Soul

The most beautiful thing about stone lies in its natural, unreplicable texture. We extracted the microscopic texture of Vondara products as the core of the brand's auxiliary graphics. These textures, processed artistically, are like abstract paintings, revealing the microscopic universe inside the stone.

## Minimalism & White Space

In the brand brochure and website design, we made extensive use of white space, giving the stage entirely to the product itself. This gallery-style display method greatly enhanced the brand's style and is deeply loved by designers and high-end owners.
    `,
    content_zh: `
# Vondara Marble：石材的藝術化表達

Vondara 是一家專注於高端人造玉石的品牌。在傳統觀念中，建材行業往往給人"粗獷"、"工業"的印象。Vondara 希望打破這一點，將自己定位為"空間藝術家"。

## 紋理即靈魂

石材最美的地方在於其天然、不可複製的紋理。我們將 Vondara 產品的顯微紋理提取出來，作為品牌輔助圖形的核心。這些紋理經過藝術化處理，如同抽象畫一般，展現了石材內部的微觀宇宙。

## 極簡與留白

在品牌畫冊和網站設計中，我們大量使用了留白，將舞台完全交給產品本身。這種畫廊式的展示方式，極大提升了品牌的格調，深受設計師和高端業主的喜愛。
    `,
    date: '2024-09-15',
    imageUrl: 'https://mir-s3-cdn-cf.behance.net/projects/max_808_webp/7a127e238487221.Y3JvcCw0NTI5LDM1NDMsMTAwLDA.jpg',
    author: 'Up-Brands B2B Team',
    tags: ['Material Branding', 'B2B Design', 'Luxury']
  }
];
