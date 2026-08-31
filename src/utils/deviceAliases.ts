/**
 * `alias` frontmatter: alternate names and URLs a single device page answers to.
 *
 * Plenty of devices are sold under more than one brand (a rebadge), or have
 * been renamed after the page was written. Rather than duplicating the page,
 * the canonical page lists the other names in `alias`:
 *
 * ```yaml
 * alias:
 *   - title: Athom Smart Plug US V3 (PG03V3-US16A)
 *     slug: Athom-Smart-Plug-PG03V3-US16A
 * ```
 *
 * Each alias does two things:
 *
 * - `slug` gets a redirect to the canonical page, so an old (or alternate)
 *   `/devices/<slug>/` URL keeps working. When omitted it is derived from
 *   `title` the same way a device folder name would be.
 * - `title`, when present, adds a second row for the device to the browse
 *   listings so it can be found under either name. That row links straight to
 *   the canonical page rather than bouncing through the redirect.
 *
 * A bare string is shorthand for `{ slug: <string> }` — a redirect only, with
 * no extra listing row. That covers renames where the old URL should keep
 * working but the old name should not be advertised.
 */

export type DeviceAlias = {
  /** Folder-style name the alias URL is built from. */
  slug: string;
  /** Display name. When set, the device is also listed under this name. */
  title?: string;
};

export type AliasParseResult = {
  aliases: DeviceAlias[];
  errors: string[];
};

/** A device page and the aliases it claims, for cross-page checks. */
export type DeviceAliasRecord = {
  /** Device folder name, e.g. `IoTorero-Smart-Plug-PG03V3-US16A`. */
  folder: string;
  /** Markdown file the aliases came from, used in error messages. */
  file: string;
  aliases: DeviceAlias[];
};

/** The character set device folder names are held to by `validate-devices`. */
export const ALIAS_SLUG_PATTERN = /^[A-Za-z0-9_.+\-]+$/;

const ALIAS_KEYS = new Set(["slug", "title"]);

const CHARS_HELP = "Only a-z, A-Z, 0-9, _, ., -, + are allowed.";

/** Derive a folder-style slug from a display name. */
export const slugFromTitle = (title: string): string =>
  title
    .trim()
    .replace(/[^A-Za-z0-9_.+\-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

/** URL a folder name or alias slug resolves to. Device URLs are lowercased. */
export const devicePathFor = (slug: string): string =>
  `/devices/${slug.toLowerCase()}/`;

/**
 * Normalise the raw `alias` frontmatter value.
 *
 * Never throws: malformed entries are dropped and described in `errors`, so
 * callers can report every problem on a page in one pass.
 */
export function parseAliases(raw: unknown): AliasParseResult {
  const aliases: DeviceAlias[] = [];
  const errors: string[] = [];

  if (raw === undefined || raw === null) {
    return { aliases, errors };
  }

  const items = Array.isArray(raw) ? raw : [raw];
  const seen = new Set<string>();

  items.forEach((item, index) => {
    const where = `alias[${index}]`;
    let slug: string | undefined;
    let title: string | undefined;

    if (typeof item === "string") {
      slug = item.trim();
      if (!slug) {
        errors.push(`${where} is empty.`);
        return;
      }
    } else if (item !== null && typeof item === "object" && !Array.isArray(item)) {
      const entry = item as Record<string, unknown>;

      for (const key of Object.keys(entry)) {
        if (!ALIAS_KEYS.has(key)) {
          errors.push(
            `${where} has unknown key "${key}". Only "slug" and "title" are allowed.`
          );
          return;
        }
      }

      if (entry.title !== undefined) {
        if (typeof entry.title !== "string" || !entry.title.trim()) {
          errors.push(`${where}.title must be a non-empty string.`);
          return;
        }
        title = entry.title.trim();
      }

      if (entry.slug !== undefined) {
        if (typeof entry.slug !== "string" || !entry.slug.trim()) {
          errors.push(`${where}.slug must be a non-empty string.`);
          return;
        }
        slug = entry.slug.trim();
      } else if (title !== undefined) {
        slug = slugFromTitle(title);
        if (!slug) {
          errors.push(
            `${where} cannot derive a slug from title "${title}". Add an explicit slug. ${CHARS_HELP}`
          );
          return;
        }
      }

      if (slug === undefined) {
        errors.push(`${where} needs a "title", a "slug", or both.`);
        return;
      }
    } else {
      errors.push(
        `${where} must be a string, or a mapping with "slug" and/or "title".`
      );
      return;
    }

    if (!ALIAS_SLUG_PATTERN.test(slug)) {
      errors.push(`${where} slug "${slug}" is invalid. ${CHARS_HELP}`);
      return;
    }

    const key = slug.toLowerCase();
    if (seen.has(key)) {
      errors.push(`${where} repeats the alias slug "${slug}".`);
      return;
    }
    seen.add(key);

    aliases.push(title === undefined ? { slug } : { slug, title });
  });

  return { aliases, errors };
}

/**
 * Cross-page checks: an alias must not shadow a real device folder and must
 * not be claimed by two pages, or the redirect would be ambiguous (or dead).
 */
export function findAliasConflicts(
  devices: DeviceAliasRecord[],
  allFolders: string[] = devices.map((device) => device.folder)
): string[] {
  const errors: string[] = [];
  const folders = new Map<string, string>();
  for (const folder of allFolders) {
    folders.set(folder.toLowerCase(), folder);
  }

  const owners = new Map<string, DeviceAliasRecord>();
  for (const device of devices) {
    for (const alias of device.aliases) {
      const key = alias.slug.toLowerCase();

      const folder = folders.get(key);
      if (folder !== undefined) {
        errors.push(
          key === device.folder.toLowerCase()
            ? `Alias "${alias.slug}" in ${device.file} is the page's own folder name.`
            : `Alias "${alias.slug}" in ${device.file} collides with device folder ${folder}.`
        );
        continue;
      }

      const owner = owners.get(key);
      if (owner !== undefined) {
        errors.push(
          `Alias "${alias.slug}" in ${device.file} is already claimed by ${owner.file}.`
        );
        continue;
      }
      owners.set(key, device);
    }
  }

  return errors;
}

/** Netlify `_redirects` lines sending every alias URL at its canonical page. */
export function buildAliasRedirects(devices: DeviceAliasRecord[]): string[] {
  const lines: string[] = [];
  for (const device of devices) {
    for (const alias of device.aliases) {
      lines.push(
        `${devicePathFor(alias.slug)} ${devicePathFor(device.folder)} 301`
      );
    }
  }
  return lines;
}
