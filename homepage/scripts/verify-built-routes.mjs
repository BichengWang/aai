import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = new URL("../dist/", import.meta.url);
const distPath = fileURLToPath(dist);
const read = (path) => readFileSync(new URL(path, dist), "utf8");

function assertAppShell(file, html) {
  assert.match(html, /src="\/assets\/[^"]+\.js"/, `${file} loads no app script.`);
  assert.match(html, /href="\/assets\/[^"]+\.css"/, `${file} loads no stylesheet.`);
  assert.match(html, /href="\/favicon\.svg"/, `${file} has no favicon.`);
  for (const [, assetPath] of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)) {
    assert.ok(existsSync(join(distPath, assetPath.slice(1))), `Built asset is missing: ${assetPath}`);
  }
}

// Any path without its own file falls back to the empty shell, rendered in the browser.
const fallback = read("404.html");
assertAppShell("404.html", fallback);
assert.match(fallback, /<div id="root"><\/div>/, "404.html must be the empty app shell.");

// Every sitemap page is prerendered with its content and its own head.
const sitemap = read("sitemap.xml");
const pages = [...sitemap.matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)].map(([, path]) => path);
assert.ok(pages.includes("/") && pages.includes("/services"), "sitemap.xml is missing core pages.");
for (const path of pages) {
  const file = path === "/" ? "index.html" : `${path.slice(1)}.html`;
  const html = read(file);
  assertAppShell(file, html);
  assert.ok(html.includes(`<div id="root" data-prerendered="${path}">`), `${file} is not prerendered.`);
  assert.match(html, /<h1[ >]/, `${file} has no heading.`);
  assert.match(html, new RegExp(`<link rel="canonical" href="https?://[^/"]+${path}" />`), `${file} has no canonical URL.`);
  assert.equal(html.match(/<title>/g)?.length, 1, `${file} must have one <title>.`);
  assert.equal(html.match(/<meta name="description"/g)?.length, 1, `${file} must have one description.`);
}

const titles = pages.map((path) => read(path === "/" ? "index.html" : `${path.slice(1)}.html`).match(/<title>([^<]*)<\/title>/)[1]);
assert.equal(new Set(titles).size, titles.length, "Prerendered pages must have distinct titles.");
assert.ok(existsSync(join(distPath, "og-image.png")), "The social preview image is missing.");

console.log(`Verified the app shell and ${pages.length} prerendered pages.`);
