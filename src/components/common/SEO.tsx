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

  // Allow overriding the title template completely if needed, otherwise append site name
  const fullTitle = title?.includes('Up-Brands') ? title : (title ? `${title} | Up-Brands` : siteTitle);

  // JSON-LD Structured Data
  const jsonLd = type === 'article' ? {
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
  } : {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    url: 'https://up-brands.com',
    logo: 'https://up-brands.com/favicon.svg',
    name: 'Up-Brands',
    description: 'Specializing in brand strategy and visual identity for cross-border success.',
    sameAs: [
      'https://www.behance.net/up-brands',
      'https://www.linkedin.com/company/up-brands'
    ]
  };

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}
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

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
