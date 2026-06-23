
// This script can be run to generate an updated sitemap
// Run with: node public/generate-sitemap.js

const fs = require('fs');
const path = require('path');

const baseUrl = 'https://pharmalens-drug-identify.vercel.app';
const currentDate = new Date().toISOString().split('T')[0];

const pages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/search', priority: '0.9', changefreq: 'weekly' },
  { url: '/identify', priority: '0.9', changefreq: 'weekly' },
  { url: '/about', priority: '0.7', changefreq: 'monthly' },
  { url: '/faq', priority: '0.7', changefreq: 'monthly' },
  { url: '/help', priority: '0.6', changefreq: 'monthly' },
  { url: '/contact', priority: '0.6', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  { url: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
  { url: '/profile', priority: '0.5', changefreq: 'weekly' },
  { url: '/history', priority: '0.5', changefreq: 'weekly' }
];

const generateSitemap = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemap);
  console.log('Sitemap generated successfully!');
};

generateSitemap();
