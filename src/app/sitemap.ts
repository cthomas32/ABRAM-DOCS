import type { MetadataRoute } from 'next';
import { getAllDocPages } from '@/utils/navigation';
import { supabase } from '@/utils/supabase/static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://abram.network';
  const pages = getAllDocPages();

  const DEFAULT_RELEASE_DATE = new Date('2026-06-23');

  // Track the latest overall modified date for the homepage and /docs index
  let latestModifiedOverall = new Date(DEFAULT_RELEASE_DATE);

  // 1. Fetch help_docs updated_at timestamps
  const docHelpMap: Record<string, string> = {};
  try {
    const { data: docList, error: docError } = await supabase
      .from('help_docs')
      .select('slug, updated_at');

    if (docError) {
      console.error('Error fetching help_docs for sitemap:', docError);
    } else if (docList) {
      docList.forEach((doc) => {
        if (doc.slug && doc.updated_at) {
          docHelpMap[doc.slug] = doc.updated_at;
        }
      });
    }
  } catch (err) {
    console.error('Failed to fetch help_docs for sitemap:', err);
  }

  // 2. Map documentation pages from navigation-data.json
  const docPages: MetadataRoute.Sitemap = pages
    .filter((page) => page.path)
    .map((page) => {
      const updatedAtStr = docHelpMap[page.path];
      const lastModDate = updatedAtStr ? new Date(updatedAtStr) : DEFAULT_RELEASE_DATE;

      if (lastModDate > latestModifiedOverall) {
        latestModifiedOverall = lastModDate;
      }

      return {
        url: `${baseUrl}/docs/${page.path}`,
        lastModified: lastModDate,
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      };
    });

  // 3. Fetch published blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  let maxBlogDate = new Date(DEFAULT_RELEASE_DATE);

  try {
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('status', 'published');

    if (postsError) {
      console.error('Error fetching blog posts for sitemap:', postsError);
    } else if (posts) {
      blogPages = posts.map((post) => {
        const dateVal = post.updated_at || post.published_at;
        const lastModDate = dateVal ? new Date(dateVal) : DEFAULT_RELEASE_DATE;

        if (lastModDate > latestModifiedOverall) {
          latestModifiedOverall = lastModDate;
        }
        if (lastModDate > maxBlogDate) {
          maxBlogDate = lastModDate;
        }

        return {
          url: `${baseUrl}/blog/${post.slug}`,
          lastModified: lastModDate,
          changeFrequency: 'weekly' as const,
          priority: 0.8,
        };
      });
    }
  } catch (err) {
    console.error('Failed to fetch blog posts for sitemap:', err);
  }

  // 4. Fetch published release notes
  let changelogPages: MetadataRoute.Sitemap = [];
  let maxChangelogDate = new Date(DEFAULT_RELEASE_DATE);

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
        const dateVal = release.updated_at || release.published_at;
        const lastModDate = dateVal ? new Date(dateVal) : DEFAULT_RELEASE_DATE;

        if (lastModDate > latestModifiedOverall) {
          latestModifiedOverall = lastModDate;
        }
        if (lastModDate > maxChangelogDate) {
          maxChangelogDate = lastModDate;
        }

        return {
          url: `${baseUrl}/changelog/${releaseSlug}`,
          lastModified: lastModDate,
          changeFrequency: 'monthly' as const,
          priority: 0.5,
        };
      });
    }
  } catch (err) {
    console.error('Failed to fetch release notes for sitemap:', err);
  }

  // 5. Calculate category-specific latest updated timestamps
  const getCategoryLatestDate = (slugs: string[], fallback: Date): Date => {
    let latest = new Date(fallback);
    for (const slug of slugs) {
      const updatedAt = docHelpMap[slug];
      if (updatedAt) {
        const date = new Date(updatedAt);
        if (date > latest) {
          latest = date;
        }
      }
    }
    return latest;
  };

  const filmProductionSlugs = [
    'user-guide/2.4-ai-script-breakdown',
    'user-guide/3.1-master-project-detail-overview',
    'user-guide/3.2-work-packages-and-milestones',
    'user-guide/3.3-work-orders-and-agreements',
    'user-guide/3.4-task-lists-and-tracking',
    'user-guide/3.5-equipment-and-resource-management',
  ];

  const agencySlugs = [
    'user-guide/1.3-organization-setup-and-custom-forms',
    'user-guide/2.3-custom-intake-forms',
    'user-guide/4.1-internal-talent-search',
    'user-guide/4.4-managing-your-utilization-calendar',
    'user-guide/4.6-team-management-dashboard',
  ];

  const intelligenceSlugs = [
    'user-guide/0.3-ai-capabilities-and-copilot',
    'user-guide/0.4-production-brain-and-workspace-memory',
    'user-guide/2.1-ai-brief-analyzer',
    'user-guide/4.2-ai-matchmaking-suggestions',
  ];

  const filmProdDate = getCategoryLatestDate(filmProductionSlugs, DEFAULT_RELEASE_DATE);
  const agencyDate = getCategoryLatestDate(agencySlugs, DEFAULT_RELEASE_DATE);
  const intelligenceDate = getCategoryLatestDate(intelligenceSlugs, DEFAULT_RELEASE_DATE);

  // 6. Build static pages with precise calculated timestamps
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: latestModifiedOverall,
      changeFrequency: 'monthly' as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: latestModifiedOverall,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/film-production`,
      lastModified: filmProdDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/film-production/scheduling-budgeting`,
      lastModified: filmProdDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/film-production/call-sheets`,
      lastModified: filmProdDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/film-production/script-breakdown`,
      lastModified: filmProdDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agency`,
      lastModified: agencyDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agency/client-intake`,
      lastModified: agencyDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agency/crew-roster`,
      lastModified: agencyDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agency/smart-scheduling`,
      lastModified: agencyDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/intelligence`,
      lastModified: intelligenceDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/intelligence/brain`,
      lastModified: intelligenceDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/intelligence/brief-intelligence`,
      lastModified: intelligenceDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/intelligence/crew-matchmaking`,
      lastModified: intelligenceDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/intelligence/creative-copilot`,
      lastModified: intelligenceDate,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: DEFAULT_RELEASE_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/alternatives/studiobinder`,
      lastModified: DEFAULT_RELEASE_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/alternatives/moviemagic`,
      lastModified: DEFAULT_RELEASE_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/alternatives/workfront`,
      lastModified: DEFAULT_RELEASE_DATE,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: maxBlogDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/changelog`,
      lastModified: maxChangelogDate,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: DEFAULT_RELEASE_DATE,
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/terms-of-use`,
      lastModified: DEFAULT_RELEASE_DATE,
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
    {
      url: `${baseUrl}/acceptable-use-policy`,
      lastModified: DEFAULT_RELEASE_DATE,
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    },
  ];

  return [
    ...staticPages,
    ...docPages,
    ...blogPages,
    ...changelogPages,
  ];
}

