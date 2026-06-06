import { MetadataRoute } from 'next';
import { TOOLS } from '../data/tools';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://imageslayer.com';

  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];

  TOOLS.forEach((tool) => {
    sitemapEntries.push({
      url: `${baseUrl}${tool.path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return sitemapEntries;
}
