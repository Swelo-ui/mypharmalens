/**
 * SEO Canonical Edge Function for PharmaLens
 * 
 * Purpose: Inject correct canonical Link HTTP header for all drug pages.
 * This runs at the CDN edge before JS executes, so Googlebot sees the
 * proper canonical even for SPA pages.
 * 
 * Fixes: "Alternate page with proper canonical tag" in Google Search Console
 * because the SPA shell (index.html) no longer has a static canonical tag.
 */
import type { Context } from "@netlify/edge-functions";

const BASE_URL = "https://pharmalens-drug-identify.vercel.app";

export default async function handler(req: Request, context: Context) {
  const url = new URL(req.url);

  if (url.pathname.startsWith('/drug/') && url.pathname.length > 6) {
    // Explicitly rewrite to index.html for the SPA fallback.
    // context.next() sometimes fails to trigger '/* -> /index.html 200' rules.
    const response = await context.rewrite("/index.html");
    const canonicalUrl = `${BASE_URL}${url.pathname}`;
    response.headers.set('Link', `<${canonicalUrl}>; rel="canonical"`);
    return response;
  }

  return context.next();
}

export const config = {
  path: "/drug/*",
};
