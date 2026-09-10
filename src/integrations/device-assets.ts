import type { AstroIntegration } from "astro";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Copy non-image, non-markdown files from src/docs/devices/<slug>/ into
 * dist/devices/<slug>/ so `<a href="./foo.pdf">` links resolve.
 *
 * Astro's image pipeline already handles inline markdown images. Other
 * asset types (PDFs, YAML, firmware blobs, SVG, etc.) are not copied
 * automatically; without this step any hyperlink to them 404s.
 */
export default function deviceAssets(): AstroIntegration {
  const passthrough = new Set([
    ".pdf",
    ".yaml",
    ".yml",
    ".uf2",
    ".bin",
    ".svg",
    ".zip",
    ".txt",
  ]);

  return {
    name: "esphome-devices:device-assets",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const projectRoot = path.dirname(fileURLToPath(import.meta.url));
        const devicesSrc = path.resolve(projectRoot, "../docs/devices");
        const devicesOut = path.join(fileURLToPath(dir), "devices");

        if (!fs.existsSync(devicesSrc)) return;

        let copied = 0;
        for (const slug of fs.readdirSync(devicesSrc)) {
          const slugPath = path.join(devicesSrc, slug);
          if (!fs.statSync(slugPath).isDirectory()) continue;
          copied += copyDir(
            slugPath,
            path.join(devicesOut, slug.toLowerCase()),
            passthrough
          );
        }

        logger.info(`Mirrored ${copied} device asset(s) to dist/devices/`);
      },
    },
  };
}

function copyDir(
  src: string,
  dest: string,
  allow: Set<string>
): number {
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      n += copyDir(s, d, allow);
    } else if (allow.has(path.extname(entry.name).toLowerCase())) {
      fs.mkdirSync(path.dirname(d), { recursive: true });
      fs.copyFileSync(s, d);
      n++;
    }
  }
  return n;
}
