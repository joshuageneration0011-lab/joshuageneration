export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  imageUrl?: string;
  slug?: string;
  author?: string;
  datePublished?: string;
  type?: 'website' | 'article';
}

export function updatePageSEO(config: SEOConfig) {
  // Update document title
  document.title = `${config.title} | Joshua's Generation`;

  // Helper to create or update meta tags
  const setMetaTag = (attributeName: string, attributeValue: string, content: string) => {
    let element = document.querySelector(`meta[${attributeName}="${attributeValue}"]`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attributeName, attributeValue);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  // Update primary search metadata
  setMetaTag('name', 'description', config.description);
  if (config.keywords) {
    setMetaTag('name', 'keywords', config.keywords);
  }

  // Open Graph / Facebook Social Sharing Tags
  const currentUrl = window.location.origin + '/#blog/' + (config.slug || '');
  setMetaTag('property', 'og:title', config.title);
  setMetaTag('property', 'og:description', config.description);
  setMetaTag('property', 'og:url', currentUrl);
  setMetaTag('property', 'og:type', config.type || 'website');
  if (config.imageUrl) {
    setMetaTag('property', 'og:image', config.imageUrl);
  }

  // Twitter Social Sharing Cards
  setMetaTag('name', 'twitter:card', 'summary_large_image');
  setMetaTag('name', 'twitter:title', config.title);
  setMetaTag('name', 'twitter:description', config.description);
  if (config.imageUrl) {
    setMetaTag('name', 'twitter:image', config.imageUrl);
  }

  // Canonical Link
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', currentUrl);

  // Schema.org Structured Data (JSON-LD) for Search Rich Snippets
  let jsonLdScript = document.getElementById('json-ld-structured-data');
  if (jsonLdScript) {
    jsonLdScript.remove();
  }

  if (config.type === 'article') {
    jsonLdScript = document.createElement('script');
    jsonLdScript.id = 'json-ld-structured-data';
    jsonLdScript.setAttribute('type', 'application/ld+json');
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": config.title,
      "description": config.description,
      "image": config.imageUrl || '',
      "datePublished": config.datePublished || new Date().toISOString().split('T')[0],
      "author": {
        "@type": "Person",
        "name": config.author || "Joshua's Generation Pastoral Team"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Joshua's Generation",
        "logo": {
          "@type": "ImageObject",
          "url": window.location.origin + "/logo.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": currentUrl
      }
    };
    
    jsonLdScript.innerHTML = JSON.stringify(structuredData);
    document.head.appendChild(jsonLdScript);
  }
}
