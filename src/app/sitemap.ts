import type { MetadataRoute } from 'next';
import { getAllDocPages } from '@/utils/navigation';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://docs.abram.network';
  const pages = getAllDocPages();

  const docPages: MetadataRoute.Sitemap = pages
    .filter((page) => page.path && page.path !== 'overview')
    .map((page) => ({
      url: `${baseUrl}/docs/${page.path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-use`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    ...docPages,
  ];
}
