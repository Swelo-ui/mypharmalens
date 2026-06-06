import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'https://pharmalens.netlify.app';
const currentDate = new Date().toISOString().split('T')[0];
const DRUGS_PER_SITEMAP = 500;

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

function buildUrlEntry(loc: string, lastmod: string, changefreq: string, priority: string): string {
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>\n`;
}

function wrapUrlset(entries: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}</urlset>`;
}

async function generateSitemap() {
    console.log('Generating sitemaps...');

    const publicDir = path.join(__dirname, '..', 'public');

    // ──────────────── 1. Extract drug IDs ────────────────
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
            const regex = /id:\s*['"]([A-Za-z0-9_-]+)['"]/g;
            let match;
            while ((match = regex.exec(content)) !== null) {
                if (match[1] && match[1] !== 'undefined' && match[1] !== 'null') {
                    drugIds.add(match[1]);
                }
            }
        } catch (err) {
            console.warn(`Could not read file ${file}`, err);
        }
    }
    console.log(`Extracted ${drugIds.size} authentic drug IDs from source data.`);

    // ──────────────── 2. Extract blog slugs ────────────────
    const blogSlugs: string[] = [];
    try {
        const blogContent = fs.readFileSync(path.join(dataDir, 'blogPosts.ts'), 'utf-8');
        const slugRegex = /slug:\s*["']([^"']+)["']/g;
        let slugMatch;
        while ((slugMatch = slugRegex.exec(blogContent)) !== null) {
            if (slugMatch[1]) {
                blogSlugs.push(slugMatch[1]);
            }
        }
        console.log(`Extracted ${blogSlugs.length} blog slugs.`);
    } catch (err) {
        console.warn('Could not read blogPosts.ts', err);
    }

    // ──────────────── 3. Generate sitemap-pages.xml ────────────────
    let pagesEntries = '';
    for (const page of staticPages) {
        pagesEntries += buildUrlEntry(`${baseUrl}${page.url}`, currentDate, page.changefreq, page.priority);
    }
    // Add blog index page
    pagesEntries += buildUrlEntry(`${baseUrl}/blog`, currentDate, 'daily', '0.9');
    // Add individual blog posts
    for (const slug of blogSlugs) {
        pagesEntries += buildUrlEntry(`${baseUrl}/blog/${slug}`, currentDate, 'weekly', '0.8');
    }
    fs.writeFileSync(path.join(publicDir, 'sitemap-pages.xml'), wrapUrlset(pagesEntries));
    console.log('Written sitemap-pages.xml');

    // ──────────────── 4. Generate sitemap-drugs-N.xml ────────────────
    const sortedDrugIds = Array.from(drugIds).sort();
    const totalChunks = Math.ceil(sortedDrugIds.length / DRUGS_PER_SITEMAP);
    const drugSitemapFiles: string[] = [];

    for (let i = 0; i < totalChunks; i++) {
        const chunk = sortedDrugIds.slice(i * DRUGS_PER_SITEMAP, (i + 1) * DRUGS_PER_SITEMAP);
        let drugEntries = '';
        for (const id of chunk) {
            drugEntries += buildUrlEntry(`${baseUrl}/drug/${id}`, currentDate, 'monthly', '0.8');
        }
        const filename = `sitemap-drugs-${i + 1}.xml`;
        fs.writeFileSync(path.join(publicDir, filename), wrapUrlset(drugEntries));
        drugSitemapFiles.push(filename);
        console.log(`Written ${filename} (${chunk.length} drugs)`);
    }

    // ──────────────── 5. Remove old drug sitemaps that are no longer needed ────────────────
    const existingSitemaps = fs.readdirSync(publicDir).filter(f => /^sitemap-drugs-\d+\.xml$/.test(f));
    for (const existing of existingSitemaps) {
        if (!drugSitemapFiles.includes(existing)) {
            fs.unlinkSync(path.join(publicDir, existing));
            console.log(`Removed stale ${existing}`);
        }
    }

    // ──────────────── 6. Generate sitemap.xml (sitemap index) ────────────────
    let sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapIndex += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    sitemapIndex += `  <sitemap>\n    <loc>${baseUrl}/sitemap-pages.xml</loc>\n    <lastmod>${currentDate}</lastmod>\n  </sitemap>\n`;
    for (const drugFile of drugSitemapFiles) {
        sitemapIndex += `  <sitemap>\n    <loc>${baseUrl}/${drugFile}</loc>\n    <lastmod>${currentDate}</lastmod>\n  </sitemap>\n`;
    }
    sitemapIndex += `</sitemapindex>`;
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapIndex);
    console.log('Written sitemap.xml (sitemap index)');

    console.log(`\nSitemap generation complete!`);
    console.log(`  - sitemap-pages.xml: ${staticPages.length + 1 + blogSlugs.length} URLs`);
    console.log(`  - ${drugSitemapFiles.length} drug sitemap(s): ${sortedDrugIds.length} drug URLs`);
    console.log(`  - Total URLs: ${staticPages.length + 1 + blogSlugs.length + sortedDrugIds.length}`);
}

generateSitemap().catch(console.error);
