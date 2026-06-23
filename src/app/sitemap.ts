import type { MetadataRoute } from 'next';
import { getAllDocPages } from '@/utils/navigation';
import { supabase } from '@/utils/supabase/static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://abram.network';
  const pages = getAllDocPages();

  // Map documentation pages from navigation-data.json
  const docPages: MetadataRoute.Sitemap = pages
    .filter((page) => page.path)
    .map((page) => ({
      url: `${baseUrl}/docs/${page.path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  let blogPages: MetadataRoute.Sitemap = [];
  let changelogPages: MetadataRoute.Sitemap = [];

  // Fetch published blog posts
  try {
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('status', 'published');

    if (postsError) {
      console.error('Error fetching blog posts for sitemap:', postsError);
    } else if (posts) {
      blogPages = posts.map((post) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.updated_at || post.published_at ? new Date(post.updated_at || post.published_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (err) {
    console.error('Failed to fetch blog posts for sitemap:', err);
  }

  // Fetch published release notes
  try {
    const { data: releases, error: releasesError } = await supabase
      .from('release_notes')
      .select('*')
      .eq('status', 'published');

    if (releasesError) {
      console.error('Error fetching release notes for sitemap:', releasesError);
    } else if (releases) {
      changelogPages = releases.map((release) => {
        const releaseSlug = release.slug || release.version?.toLowerCase().replace(/[^a-z0-9-_]+/g, '-') || 'undefined';
        return {
          url: `${baseUrl}/changelog/${releaseSlug}`,
          lastModified: release.updated_at || release.published_at ? new Date(release.updated_at || release.published_at) : new Date(),
          changeFrequency: 'monthly' as const,
          priority: 0.6,
        };
      });
    }
  } catch (err) {
    console.error('Failed to fetch release notes for sitemap:', err);
  }

  const staticPages: MetadataRoute.Sitemap = [
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
      url: `${baseUrl}/film-production`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/film-production/scheduling-budgeting`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/film-production/call-sheets`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/film-production/script-breakdown`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agency`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agency/client-intake`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agency/crew-roster`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agency/smart-scheduling`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/intelligence`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/intelligence/brain`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/intelligence/brief-intelligence`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/intelligence/crew-matchmaking`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/intelligence/creative-copilot`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
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
    {
      url: `${baseUrl}/acceptable-use-policy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];

  return [
    ...staticPages,
    ...docPages,
    ...blogPages,
    ...changelogPages,
  ];
}

