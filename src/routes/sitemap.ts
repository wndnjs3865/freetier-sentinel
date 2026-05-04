import type { Env } from "../index";
import { SUPPORTED_LOCALES, LOCALE_META } from "../i18n";

export async function handleSitemap(_req: Request, env: Env): Promise<Response> {
  const origin = env.APP_URL.replace(/\/$/, "");
  const lastmod = new Date().toISOString().split("T")[0];

  const locUrls = SUPPORTED_LOCALES.map((l) => {
    const url = `${origin}${l === "en" ? "/" : `/${l}`}`;
    const alts = SUPPORTED_LOCALES.map((alt) => {
      const altUrl = `${origin}${alt === "en" ? "/" : `/${alt}`}`;
      return `    <xhtml:link rel="alternate" hreflang="${LOCALE_META[alt].htmlLang}" href="${altUrl}"/>`;
    }).join("\n");
    return `  <url>
    <loc>${url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${l === "en" ? "1.0" : "0.9"}</priority>
${alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/"/>
  </url>`;
  }).join("\n");

  const staticUrls = ["/privacy", "/terms"]
    .map(
      (path) => `  <url>
    <loc>${origin}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${locUrls}
${staticUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#1e40af"/>
<stop offset="1" stop-color="#3b82f6"/>
</linearGradient>
</defs>
<rect width="32" height="32" rx="8" fill="url(#g)"/>
<text x="16" y="22" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="20" font-weight="800" fill="white">F</text>
</svg>`;

export async function handleFavicon(_req: Request, _env: Env): Promise<Response> {
  return new Response(FAVICON_SVG, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
