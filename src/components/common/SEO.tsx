import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import type { BreadcrumbItem } from '../../utils/seo';
import { getBreadcrumbSchema, getLanguageAlternates, getLanguageTag, getLocalizedUrl } from '../../utils/seo';

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
  breadcrumbs?: BreadcrumbItem[];
  schemas?: Record<string, unknown>[];
  noIndex?: boolean;
}

export function SEO({ 
  title, 
  description = "Up-Brands is a premier brand strategy and visual design agency in the Greater Bay Area. 上游文创专注粤港澳大湾区品牌策略、VI包装设计与数字营销服务。", 
  image = 'https://www.up-brands.com/og-image.svg',
  url,
  type = 'website',
  publishedTime,
  author,
  tags,
  keywords,
  breadcrumbs,
  schemas = [],
  noIndex = false,
}: SEOProps) {
  const { i18n } = useTranslation();
  const siteTitle = 'Up-Brands™上游文创 | 国际品牌策略与创意设计';
  const resolvedUrl = url || window.location.href;
  const lang = getLanguageTag(i18n.language);
  const currentUrl = getLocalizedUrl(resolvedUrl, lang);
  const alternates = getLanguageAlternates(resolvedUrl);

  const defaultKeywords = [
    'Up-Brands', 'Brand Strategy', 'Visual Identity', 'Packaging Design', 
    'Creative Agency', 'GBA Design', 'Shenzhen Design', 'Zhuhai Design',
    '上游文创', '视觉设计', '包装设计', '品牌设计', '品牌更新', '品牌升级', '品牌战略', '品牌策划', '珠海设计', '广州设计', '深圳设计', '大湾区设计', '珠海品牌设计', '广州品牌设计', '深圳品牌设计', '大湾区品牌设计',
    // Common Misspellings & Variations
    'Up Brands', 'Up Brand', 'Up-Brand', 'Upstream Brands', 'Upstream Creative', 'UpBrand', 'UpBrands',
    '上游文传', '上游品牌', '上游设计', '上游广告', '珠海上游', '上游文化', '上游文旅'
  ];

  const metaKeywords = keywords && keywords.length > 0 
    ? [...keywords, ...defaultKeywords] 
    : defaultKeywords;

  // Allow overriding the title template completely if needed, otherwise append site name
  // Smart shortening: if the incoming title is already long, just use it or append a very short suffix
  let fullTitle = siteTitle;
  if (title) {
    if (title.includes('Up-Brands')) {
      fullTitle = title;
    } else {
      // If the title is very long (e.g., Project names like "Mysterium | California Luxury Wine | Branding"), don't append the long trademark
      fullTitle = title.length > 40 ? `${title} | Up-Brands` : `${title} | Up-Brands™上游文创`;
    }
  }

  // JSON-LD Structured Data
  let jsonLd: any = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url: 'https://up-brands.com',
    logo: 'https://up-brands.com/favicon.svg',
    name: 'Up-Brands™上游文创',
    alternateName: ['Up-Brands Agency', '上游文创', 'Up-Brands Design', 'Upstream Asia', 'Up Brands', 'Up Brand', '上游文传', '上游品牌'],
    description: 'Up-Brands is a premier brand strategy and visual design agency in the Greater Bay Area, specializing in cross-border branding and digital marketing success.',
    sameAs: [
      'https://www.behance.net/up-brands',
      'https://dribbble.com/up-brands',
      'https://www.linkedin.com/company/up_brands/',
      'https://www.instagram.com/upstream.asia/',
      'https://mp.weixin.qq.com/s/bSMmQyzfit5OIACx9uZ8kw',
      'https://www.xiaohongshu.com/user/profile/663a1f290000000007005cc2',
      'https://www.zcool.com.cn/u/15722034'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'up-brands@hotmail.com',
      contactType: 'customer service',
      availableLanguage: ['en', 'zh']
    },
    knowsAbout: [
      'Brand Strategy',
      'Visual Identity Design',
      'Packaging Design',
      'Digital Marketing',
      'GBA Market Entry',
      'Cross-border Branding'
    ]
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
        name: 'Up-Brands™上游文创',
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
        name: 'Up-Brands™上游文创'
      },
      provider: {
        '@type': 'Organization',
        name: 'Up-Brands™上游文创',
        sameAs: 'https://up-brands.com'
      },
      url: currentUrl,
      inLanguage: lang,
      genre: keywords?.join(', ') || 'Design',
      keywords: keywords?.join(', ')
    };
  }

  if (type === 'article') {
    jsonLd = {
      ...jsonLd,
      mainEntityOfPage: currentUrl,
      inLanguage: lang,
      url: currentUrl,
      keywords: keywords?.join(', '),
      articleSection: tags?.[0] || 'Brand Insights',
    };
  }

  const allSchemas = [jsonLd, ...schemas];
  const robotsContent = noIndex || title?.startsWith('404')
    ? 'noindex, follow'
    : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={metaKeywords.join(', ')} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={currentUrl} />
      <html lang={lang} />
      {alternates.map((alternate) => (
        <link
          key={`${alternate.hrefLang}-${alternate.href}`}
          rel="alternate"
          hrefLang={alternate.hrefLang}
          href={alternate.href}
        />
      ))}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:locale" content={lang} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={title || siteTitle} />
      <meta property="og:site_name" content="Up-Brands™上游文创" />
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
      {allSchemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(getBreadcrumbSchema(breadcrumbs))}
        </script>
      )}
    </Helmet>
  );
}
