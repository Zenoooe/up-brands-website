import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
  tags?: string[];
  keywords?: string[];
}

export function SEO({ 
  title, 
  description, 
  image = 'https://up-brands.com/og-image.jpg', // Default OG Image
  url,
  type = 'website',
  publishedTime,
  author,
  tags,
  keywords
}: SEOProps) {
  const { i18n } = useTranslation();
  const siteTitle = 'Up-Brands | Brand Strategy & Visual Identity';
  const currentUrl = url || window.location.href;
  const lang = i18n.language;

  const defaultKeywords = [
    'Up-Brands', 'Brand Strategy', 'Visual Identity', 'Packaging Design', 
    'Creative Agency', 'GBA Design', 'Shenzhen Design', 'Zhuhai Design',
    '上游文创', '视觉设计', '包装设计', '品牌设计', '品牌更新', '品牌升级', '品牌战略', '品牌策划', '珠海设计', '广州设计', '深圳设计', '大湾区设计', '珠海品牌设计', '广州品牌设计', '深圳品牌设计', '大湾区品牌设计'
  ];

  const metaKeywords = keywords && keywords.length > 0 
    ? [...keywords, ...defaultKeywords] 
    : defaultKeywords;

  // Allow overriding the title template completely if needed, otherwise append site name
  const fullTitle = title?.includes('Up-Brands') ? title : (title ? `${title} | Up-Brands` : siteTitle);

  // JSON-LD Structured Data
  let jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url: 'https://up-brands.com',
    logo: 'https://up-brands.com/favicon.svg',
    name: 'Up-Brands',
    alternateName: ['Up-Brands Agency', '上游文创', 'Up Brands'],
    description: 'Specializing in brand strategy and visual identity for cross-border success.',
    sameAs: [
      'https://www.behance.net/up-brands',
      'https://www.linkedin.com/company/up_brands/',
      'https://www.instagram.com/up.brands_/',
      'https://mp.weixin.qq.com/s/bSMmQyzfit5OIACx9uZ8kw',
      'https://www.xiaohongshu.com/user/profile/663a1f290000000007005cc2'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'up-brands@hotmail.com',
      contactType: 'customer service',
      availableLanguage: ['en', 'zh']
    }
  };

  if (type === 'article') {
    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      image: image ? [image] : [],
      datePublished: publishedTime,
      author: [{
        '@type': 'Person',
        name: author || 'Up-Brands Team',
      }],
      publisher: {
        '@type': 'Organization',
        name: 'Up-Brands',
        logo: {
          '@type': 'ImageObject',
          url: 'https://up-brands.com/favicon.svg'
        }
      },
      description: description
    };
  } else if (type === 'website' && url && url.includes('/project/')) {
     // Project Detail Schema
     jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: title,
      image: image,
      description: description,
      author: {
        '@type': 'Organization',
        name: 'Up-Brands'
      },
      provider: {
        '@type': 'Organization',
        name: 'Up-Brands',
        sameAs: 'https://up-brands.com'
      },
      genre: keywords?.join(', ') || 'Design',
      keywords: keywords?.join(', ')
    };
  }

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={metaKeywords.join(', ')} />
      <link rel="canonical" href={currentUrl} />
      <html lang={lang} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Up-Brands" />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {tags && tags.map(tag => <meta property="article:tag" content={tag} key={tag} />)}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* ByteDance (Toutiao) Time Factor */}
      {publishedTime && (
        <>
          <meta property="bytedance:published_time" content={new Date(publishedTime).toISOString()} />
          <meta property="bytedance:updated_time" content={new Date(publishedTime).toISOString()} />
          <meta property="bytedance:lrDate_time" content={new Date(publishedTime).toISOString()} />
        </>
      )}

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
