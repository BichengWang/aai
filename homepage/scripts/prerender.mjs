// Writes static HTML for the built site (run by `npm run build` after the
// client and prerender bundles are built):
// - the public marketing pages with their content and their own <head>
//   (title, description, canonical URL, social preview, structured data),
//   hydrated by src/main.tsx;
// - copies of the empty app shell for browser-only routes, and 404.html as
//   the fallback for any other path;
// - sitemap.xml and robots.txt.
// Pages are written as /services.html, /services/<slug>.html, which Cloudflare
// Pages and Netlify both serve at the extensionless path.
import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dist = fileURLToPath(new URL("../dist/", import.meta.url));
const ssrDir = fileURLToPath(new URL("../dist-ssr/", import.meta.url));
const siteUrl = (process.env.SITE_URL?.trim() || "https://altairworld.com").replace(/\/+$/, "");
const ogImage = { path: "/og-image.png", width: 1200, height: 630, alt: "Altair — Applied AI for the services people rely on." };

const { render, prerenderedPaths, shellPaths, services } = await import(
  pathToFileURL(`${ssrDir}entry-prerender.js`).href
);

const template = readFileSync(`${dist}index.html`, "utf8");
const ROOT = '<div id="root"></div>';
assert.equal(template.split(ROOT).length, 2, "index.html must contain one empty #root.");

const escapeAttr = (value) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeText = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const absolute = (path) => `${siteUrl}${path === "/" ? "/" : path}`;

function replaceOnce(html, pattern, replacement, label) {
  let count = 0;
  const next = html.replace(pattern, () => {
    count += 1;
    return replacement;
  });
  assert.equal(count, 1, `Expected one ${label} in index.html, found ${count}.`);
  return next;
}

function setMeta(html, attr, key, value) {
  return replaceOnce(
    html,
    new RegExp(`<meta\\s+${attr}="${key}"\\s+content="[^"]*"\\s*/?>`, "g"),
    `<meta ${attr}="${key}" content="${escapeAttr(value)}" />`,
    `${attr}="${key}" meta tag`
  );
}

function jsonLd(data) {
  // "<" can't close the script element once escaped.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

const organization = {
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: "Altair AI LLC",
  url: absolute("/"),
  email: "qx@altairworld.com",
  description:
    "Applied AI lab in the San Francisco Bay Area building AI-guided intake, verification and matching for trusted local providers.",
  areaServed: { "@type": "Place", name: "San Francisco Bay Area" },
};

function structuredData(path) {
  if (path === "/") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organization,
        { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: "Altair", url: absolute("/"), publisher: { "@id": organization["@id"] } },
      ],
    };
  }
  const service = services.find((item) => path === `/services/${item.slug}`);
  if (!service) return null;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        name: service.title,
        description: service.description,
        url: absolute(path),
        provider: { "@id": organization["@id"] },
        areaServed: organization.areaServed,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
          { "@type": "ListItem", position: 2, name: "Services", item: absolute("/services") },
          { "@type": "ListItem", position: 3, name: service.title, item: absolute(path) },
        ],
      },
    ],
  };
}

function page({ path, title, description, body = "", indexable }) {
  let html = template;
  if (title) {
    html = replaceOnce(html, /<title>[^<]*<\/title>/g, `<title>${escapeText(title)}</title>`, "<title>");
    html = setMeta(html, "property", "og:title", title);
  }
  if (description) {
    html = setMeta(html, "name", "description", description);
    html = setMeta(html, "property", "og:description", description);
  }
  const head = [
    `<meta property="og:image" content="${absolute(ogImage.path)}" />`,
    `<meta property="og:image:width" content="${ogImage.width}" />`,
    `<meta property="og:image:height" content="${ogImage.height}" />`,
    `<meta property="og:image:alt" content="${escapeAttr(ogImage.alt)}" />`,
  ];
  if (indexable) {
    head.push(`<link rel="canonical" href="${absolute(path)}" />`, `<meta property="og:url" content="${absolute(path)}" />`);
    const data = structuredData(path);
    if (data) head.push(jsonLd(data));
  } else {
    head.push('<meta name="robots" content="noindex" />');
  }
  html = replaceOnce(html, /<\/head>/g, `  ${head.join("\n    ")}\n  </head>`, "</head>");
  if (body) {
    html = html.replace(ROOT, `<div id="root" data-prerendered="${escapeAttr(path)}">${body}</div>`);
  }
  return html;
}

function write(path, html) {
  const file = path === "/" ? `${dist}index.html` : `${dist}${path.slice(1)}.html`;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

// Any path without a file of its own: the empty shell, rendered by the browser.
writeFileSync(`${dist}404.html`, page({ path: "/404", indexable: false }));

for (const path of shellPaths) {
  write(path, page({ path, indexable: false }));
}

for (const path of prerenderedPaths) {
  const { html, title, description } = render(path);
  assert.ok(html.includes("<main"), `Prerendering ${path} produced no page.`);
  write(path, page({ path, title, description, body: html, indexable: true }));
}

writeFileSync(
  `${dist}sitemap.xml`,
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...prerenderedPaths.map((path) => `  <url><loc>${absolute(path)}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n")
);

writeFileSync(
  `${dist}robots.txt`,
  ["User-agent: *", "Allow: /", "", `Sitemap: ${siteUrl}/sitemap.xml`, ""].join("\n")
);

rmSync(ssrDir, { recursive: true, force: true });
console.log(
  `Prerendered ${prerenderedPaths.length} pages and ${shellPaths.length} app-shell routes for ${siteUrl}.`
);
