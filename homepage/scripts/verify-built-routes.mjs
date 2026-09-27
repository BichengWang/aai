import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = new URL("../dist/", import.meta.url);
const distPath = fileURLToPath(dist);
const index = readFileSync(new URL("index.html", dist), "utf8");
const fallback = readFileSync(new URL("404.html", dist), "utf8");

assert.equal(fallback, index, "Deep routes must serve the same app shell as /.");
assert.match(index, /src="\/assets\/[^\"]+\.js"/);
assert.match(index, /href="\/assets\/[^\"]+\.css"/);
assert.match(index, /href="\/favicon\.svg"/);

for (const [, assetPath] of index.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) {
  assert.ok(
    existsSync(join(distPath, assetPath.slice(1))),
    `Built asset is missing: ${assetPath}`
  );
}

console.log("Production app shell and deep-route assets verified.");
