import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://pharmalens.tech';
const currentDate = new Date().toISOString().split('T')[0];

const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'weekly' },
    { url: '/search', priority: '0.9', changefreq: 'weekly' },
    { url: '/drugs', priority: '0.9', changefreq: 'weekly' },
    { url: '/identify', priority: '0.9', changefreq: 'weekly' },
    { url: '/about', priority: '0.8', changefreq: 'monthly' },
    { url: '/faq', priority: '0.7', changefreq: 'monthly' },
    { url: '/help', priority: '0.7', changefreq: 'monthly' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/disclaimer', priority: '0.3', changefreq: 'yearly' },
    { url: '/symptom-checker', priority: '0.8', changefreq: 'weekly' },
    { url: '/drug-interactions', priority: '0.8', changefreq: 'weekly' }
];

async function generateSitemap() {
    console.log('Generating authentic sitemap...');

    // 1. Read drug files from src/data directory
    const dataDir = path.join(__dirname, '..', 'src', 'data');
    const files = fs.readdirSync(dataDir).filter(f =>
        f.endsWith('.ts') &&
        !f.includes('DataLoader') &&
        !f.includes('Storage') &&
        !f.includes('Utils') &&
        !f.includes('mock')
    );

    const drugIds = new Set<string>();

    for (const file of files) {
        const filePath = path.join(dataDir, file);
        try {
            const content = fs.readFileSync(filePath, 'utf-8');

            // Extract IDs using regex. Format is typically id: 'CVD001' or id: "CVD001"
            // Looking specifically for objects with an id property that looks like a drug ID
            const regex = /id:\s*['"]([A-Za-z0-9_-]+)['"]/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                if (match[1] && typeof match[1] === 'string' && match[1].length > 0) {
                    // Avoid mapping categoryId or pure numeric IDs if they aren't real drugs
                    if (match[1] !== 'undefined' && match[1] !== 'null') {
                        drugIds.add(match[1]);
                    }
                }
            }
        } catch (err) {
            console.warn(`Could not read file ${file}`, err);
        }
    }

    console.log(`Extracted ${drugIds.size} authentic drug IDs from source data.`);

    // 2. Generate XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemap += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Add static pages
    for (const page of staticPages) {
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}${page.url}</loc>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
        sitemap += `    <priority>${page.priority}</priority>\n`;
        sitemap += `  </url>\n`;
    }

    // Add dynamic drug pages
    for (const id of Array.from(drugIds).sort()) {
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/drug/${id}</loc>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += `  </url>\n`;
    }

    sitemap += `</urlset>`;

    // 3. Write to public/sitemap.xml
    const outputPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(outputPath, sitemap);
    console.log(`Authentic sitemap successfully written to ${outputPath}`);
}

generateSitemap().catch(console.error);
