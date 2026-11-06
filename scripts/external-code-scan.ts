/**
 * Static scan for configs that would make `esphome config` run code from
 * outside the repo or outside the device folder. CI validates a page only
 * when this finds nothing.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import yaml from "js-yaml";

class Tagged {
  constructor(
    readonly tag: string,
    readonly value: unknown
  ) {}
}

const TAGS = [
  "!include", "!include_dir_list", "!include_dir_named", "!include_dir_merge_list",
  "!include_dir_merge_named", "!secret", "!lambda", "!env", "!env_var", "!extend",
  "!remove", "!force",
];

const SCAN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(
  TAGS.flatMap((tag) =>
    (["scalar", "sequence", "mapping"] as const).map(
      (kind) =>
        new yaml.Type(tag, {
          kind,
          construct: (data) => new Tagged(tag, data),
          instanceOf: Tagged,
        })
    )
  )
);

// Git sources ESPHome fetches packages and components from.
const GIT_SOURCE_RE = /^(github|gitlab|codeberg|git):\/\/|^git@|^git\+/i;
// Folder contents ESPHome can import as Python.
const CODE_DIRS = new Set(["custom_components", "components", "external_components"]);
const CODE_FILE_RE = /\.(py|pyc|so)$/i;

const isMapping = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v) && !(v instanceof Tagged);

function inside(root: string, target: string): boolean {
  const rel = path.relative(root, target);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

export interface ScanResult {
  /** Why validating could run code from outside the device folder. */
  external: string[];
  /** Why the page can't be validated as written (unreadable yaml, missing include, symlink). */
  broken: string[];
}

interface Reasons {
  external: Set<string>;
  broken: Set<string>;
}

/** Scan *files* of *deviceDir* (and what they include) before anything runs them. */
export function scanExternalCode(deviceDir: string, files: string[]): ScanResult {
  const reasons: Reasons = { external: new Set(), broken: new Set() };
  scanFolder(deviceDir, deviceDir, reasons);
  const seen = new Set<string>();
  for (const file of files) scanFile(deviceDir, path.join(deviceDir, file), reasons, seen);
  return { external: [...reasons.external].sort(), broken: [...reasons.broken].sort() };
}

function scanFolder(root: string, dir: string, reasons: Reasons): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    const rel = path.relative(root, p);
    if (entry.isSymbolicLink()) {
      reasons.broken.add(`\`${rel}\` is a symlink; device folders must hold plain files`);
    } else if (entry.isDirectory()) {
      if (CODE_DIRS.has(entry.name)) reasons.external.add(`the folder has a \`${rel}/\` directory`);
      else scanFolder(root, p, reasons);
    } else if (CODE_FILE_RE.test(entry.name)) {
      reasons.external.add(`the folder has a Python file (\`${rel}\`)`);
    }
  }
}

function scanFile(root: string, file: string, reasons: Reasons, seen: Set<string>): void {
  if (seen.has(file)) return;
  seen.add(file);
  const rel = path.relative(root, file);
  let tree: unknown;
  try {
    tree = yaml.load(fs.readFileSync(file, "utf8"), { schema: SCAN_SCHEMA });
  } catch {
    reasons.broken.add(`\`${rel}\` is missing or isn't valid YAML`);
    return;
  }
  if (isMapping(tree)) {
    if ("external_components" in tree) reasons.external.add(`\`${rel}\` uses \`external_components:\``);
    const packages = tree.packages;
    if (packages !== undefined) {
      const entries = Array.isArray(packages)
        ? packages
        : isMapping(packages)
          ? Object.values(packages)
          : [packages];
      for (const entry of entries) {
        if (!(entry instanceof Tagged && entry.tag === "!include")) {
          reasons.external.add(`\`${rel}\` has a \`packages:\` entry that is not a local \`!include\``);
        }
      }
    }
  }
  walk(tree, (node) => {
    if (isMapping(node) && typeof node.url === "string" && ("files" in node || "ref" in node)) {
      reasons.external.add(`\`${rel}\` has a remote package (\`url: ${node.url}\`)`);
    }
    if (typeof node === "string" && GIT_SOURCE_RE.test(node.trim())) {
      reasons.external.add(`\`${rel}\` references a git source (\`${node.trim()}\`)`);
    }
    if (!(node instanceof Tagged) || !node.tag.startsWith("!include")) return;
    const target = includeTarget(node);
    if (target === null) {
      reasons.external.add(`\`${rel}\` has an \`${node.tag}\` whose target cannot be read statically`);
      return;
    }
    const abs = path.resolve(path.dirname(file), target);
    if (target.includes("://") || !inside(root, abs)) {
      reasons.external.add(`\`${rel}\` includes \`${target}\`, outside the device folder`);
      return;
    }
    if (node.tag === "!include") {
      scanFile(root, abs, reasons, seen);
    } else if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      for (const f of yamlFilesUnder(abs)) scanFile(root, f, reasons, seen);
    } else {
      reasons.broken.add(`\`${rel}\` has an \`${node.tag}\` whose folder \`${target}\` does not exist`);
    }
  });
}

function includeTarget(node: Tagged): string | null {
  if (typeof node.value === "string") return node.value.trim();
  if (isMapping(node.value) && typeof node.value.file === "string") return node.value.file.trim();
  return null;
}

function yamlFilesUnder(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) return []; // scanFolder reports it
    if (e.isDirectory()) return yamlFilesUnder(p);
    return /\.ya?ml$/i.test(e.name) ? [p] : [];
  });
}

function walk(node: unknown, visit: (node: unknown) => void): void {
  visit(node);
  if (node instanceof Tagged) walk(node.value, visit);
  else if (Array.isArray(node)) node.forEach((n) => walk(n, visit));
  else if (isMapping(node)) Object.values(node).forEach((n) => walk(n, visit));
}
