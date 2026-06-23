import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const commonDisallows = ['/api/', '/_next/', '/admin/'];

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: commonDisallows,
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: commonDisallows,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: commonDisallows,
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: commonDisallows,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: commonDisallows,
      },
      {
        userAgent: 'Applebot-Extended',
        allow: '/',
        disallow: commonDisallows,
      },
    ],
    sitemap: 'https://abram.network/sitemap.xml',
  };
}
