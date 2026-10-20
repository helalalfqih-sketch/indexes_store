import { build } from "esbuild";
import { readFileSync, readdirSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve("cloudflare-storefront");
const read = (directory, suffix) =>
  Object.fromEntries(
    readdirSync(`${root}/${directory}`)
      .filter((name) => name.endsWith(suffix))
      .map((name) => [
        name.replace(/\.liquid$/, ""),
        readFileSync(`${root}/${directory}/${name}`, "utf8"),
      ]),
  );
const resources = {
  templates: read("theme", ".liquid"),
  assets: { ...read("assets", ".css"), ...read("assets", ".js"), ...read("assets", ".svg") },
  translations: JSON.parse(readFileSync(`${root}/theme/translations.json`, "utf8")),
  settings: JSON.parse(readFileSync(`${root}/theme/settings.json`, "utf8")),
  brand: JSON.parse(readFileSync(`${root}/theme/brand.json`, "utf8")),
};
resources.revision = createHash("sha256")
  .update(JSON.stringify(resources))
  .digest("hex")
  .slice(0, 12);
mkdirSync(".tmp/storefront", { recursive: true });
await build({
  entryPoints: [`${root}/worker.mjs`],
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  minify: true,
  outfile: ".tmp/storefront/worker.mjs",
  plugins: [
    {
      name: "theme-resources",
      setup(build) {
        build.onResolve({ filter: /^storefront:resources$/ }, () => ({
          path: "resources",
          namespace: "theme",
        }));
        build.onLoad({ filter: /.*/, namespace: "theme" }, () => ({
          contents: Object.entries(resources)
            .map(([key, value]) => `export const ${key} = ${JSON.stringify(value)};`)
            .join("\n"),
          loader: "js",
        }));
      },
    },
  ],
});
console.log(`Storefront built: ${resources.revision}`);
