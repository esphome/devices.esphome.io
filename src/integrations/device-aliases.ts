import type { AstroIntegration } from "astro";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import {
  buildAliasRedirects,
  parseAliases,
  type DeviceAliasRecord,
} from "../utils/deviceAliases";

/**
 * Turn `alias` frontmatter into Netlify redirect rules.
 *
 * Device pages can declare alternate names/URLs (see src/utils/deviceAliases.ts).
 * Each alias gets a 301 from `/devices/<alias>/` to the canonical page, appended
 * to the `_redirects` file that `public/_redirects` seeds. That keeps renames
 * and rebrands from needing a hand-maintained redirect line per page.
 *
 * The rules only take effect on the deployed (Netlify) site — `astro dev` and
 * `astro preview` serve from the filesystem and ignore `_redirects`.
 */
export default function deviceAliases(): AstroIntegration {
  return {
    name: "esphome-devices:device-aliases",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const projectRoot = path.dirname(fileURLToPath(import.meta.url));
        const devicesSrc = path.resolve(projectRoot, "../docs/devices");
        const count = writeAliasRedirects(devicesSrc, fileURLToPath(dir));

        logger.info(`Added ${count} device alias redirect(s) to _redirects`);
      },
    },
  };
}

/**
 * Append the alias rules for every device under `devicesDir` to
 * `<distDir>/_redirects`. Returns the number of rules written.
 */
export function writeAliasRedirects(
  devicesDir: string,
  distDir: string
): number {
  if (!fs.existsSync(devicesDir)) return 0;

  const lines = buildAliasRedirects(scanDeviceAliases(devicesDir));
  if (lines.length === 0) return 0;

  appendRedirects(path.join(distDir, "_redirects"), lines);
  return lines.length;
}

/** Read the `alias` frontmatter of every device folder under `devicesDir`. */
export function scanDeviceAliases(devicesDir: string): DeviceAliasRecord[] {
  const records: DeviceAliasRecord[] = [];

  for (const folder of fs.readdirSync(devicesDir).sort()) {
    const folderPath = path.join(devicesDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const file = deviceMarkdownFile(folderPath);
    if (file === null) continue;

    let data: Record<string, unknown>;
    try {
      data = matter(fs.readFileSync(file, "utf8")).data;
    } catch {
      // Unparseable frontmatter is reported by `npm run validate-devices`,
      // which runs before the build; nothing useful to emit here.
      continue;
    }

    const { aliases } = parseAliases(data.alias);
    if (aliases.length === 0) continue;

    records.push({ folder, file, aliases });
  }

  return records;
}

/**
 * The markdown file holding a device's frontmatter: `index.md`, or the single
 * `.md` file in the folder. Anything else is ambiguous and skipped, matching
 * how `validate-devices` resolves the same thing.
 */
function deviceMarkdownFile(folderPath: string): string | null {
  const index = path.join(folderPath, "index.md");
  if (fs.existsSync(index)) return index;

  const mdFiles = fs
    .readdirSync(folderPath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name);

  return mdFiles.length === 1 ? path.join(folderPath, mdFiles[0]) : null;
}

/** Append generated rules after whatever `public/_redirects` already wrote. */
export function appendRedirects(target: string, lines: string[]): void {
  const existing = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  const separator = existing === "" || existing.endsWith("\n") ? "" : "\n";
  const block = [
    "",
    "# Generated from device `alias` frontmatter",
    ...lines,
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, existing + separator + block);
}
