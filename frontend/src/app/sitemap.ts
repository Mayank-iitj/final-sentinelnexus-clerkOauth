import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sentinelnexus.mayankiitj.in';

  const routes = [
    '',
    '/features',
    '/pricing',
    '/docs',
    '/blog',
    '/changelog',
    '/about',
    '/contact',
    '/support',
    '/status',
    '/api-reference',
    '/login',
    '/signup',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: route === '' ? 'daily' : 'weekly' as any,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return routes;
}
