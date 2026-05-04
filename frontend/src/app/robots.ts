import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sentinelnexus.mayankiitj.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/settings/', '/oauth/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
