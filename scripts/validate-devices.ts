import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import { VALID_TYPES, VALID_BOARDS } from "../src/utils/validFrontmatter";

interface Frontmatter {
  title?: string;
  "date-published"?: string;
  board?: string | string[];
  type?: string;
  difficulty?: string | number;
  [key: string]: unknown;
}

const HELP_FOLDER =
  "See https://devices.esphome.io/devices/adding-devices#create-device-folder-and-markdown-file for help.";
const HELP_FRONTMATTER =
  "See https://devices.esphome.io/devices/adding-devices#yaml-front-matter for help.";

function fail(msg: string, help?: string): never {
  console.error(msg);
  if (help) console.error(help);
  process.exit(1);
}

function main(): void {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const devicesDir = path.join(__dirname, "..", "src", "docs", "devices");

  if (!fs.existsSync(devicesDir)) {
    console.warn(`Devices directory not found: ${devicesDir}`);
    return;
  }

  const deviceDirs = fs
    .readdirSync(devicesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log(`Validating ${deviceDirs.length} device directories…`);

  for (const deviceDir of deviceDirs) {
    if (!/^[a-zA-Z0-9_.+\-]+$/.test(deviceDir)) {
      fail(
        `Invalid device folder name: ${deviceDir}. Only a-z, A-Z, 0-9, _, ., -, + are allowed.`,
        HELP_FOLDER
      );
    }

    const deviceDirPath = path.join(devicesDir, deviceDir);
    const indexFile = path.join(deviceDirPath, "index.md");
    let targetFile: string;

    if (fs.existsSync(indexFile)) {
      targetFile = indexFile;
    } else {
      const mdFiles = fs
        .readdirSync(deviceDirPath, { withFileTypes: true })
        .filter((d) => d.isFile() && d.name.endsWith(".md"))
        .map((d) => d.name);

      if (mdFiles.length === 0) {
        console.warn(`No markdown files found for device ${deviceDir}`);
        continue;
      }
      if (mdFiles.length > 1) {
        console.warn(
          `Multiple markdown files for device ${deviceDir} (${mdFiles.join(
            ", "
          )}), skipping`
        );
        continue;
      }
      targetFile = path.join(deviceDirPath, mdFiles[0]);
    }

    const content = fs.readFileSync(targetFile, "utf8");
    let frontmatter: Frontmatter;
    try {
      frontmatter = matter(content).data as Frontmatter;
    } catch (err) {
      fail(
        `Failed to parse frontmatter in ${targetFile}: ${
          (err as Error).message
        }`,
        HELP_FRONTMATTER
      );
    }

    if (frontmatter["date-published"]) {
      const d = new Date(frontmatter["date-published"]);
      if (isNaN(d.getTime())) {
        fail(
          `Invalid date-published in ${targetFile}: ${frontmatter["date-published"]}`,
          HELP_FRONTMATTER
        );
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (d > today) {
        fail(
          `date-published in ${targetFile} is in the future: ${frontmatter["date-published"]}`,
          HELP_FRONTMATTER
        );
      }
    }

    if (frontmatter.type) {
      const t = frontmatter.type.toLowerCase();
      if (!VALID_TYPES.has(t)) {
        fail(
          `Invalid type in ${targetFile}: ${frontmatter.type}. Must be one of: ${Array.from(
            VALID_TYPES
          ).join(", ")}`,
          HELP_FRONTMATTER
        );
      }
    }

    if (frontmatter.board) {
      const raw = Array.isArray(frontmatter.board)
        ? frontmatter.board.join(",")
        : frontmatter.board;
      const boards = raw.split(",").map((b) => b.trim().toLowerCase());
      for (const b of boards) {
        if (!VALID_BOARDS.has(b)) {
          fail(
            `Invalid board in ${targetFile}: ${frontmatter.board}. Must be one of: ${Array.from(
              VALID_BOARDS
            ).join(", ")}`,
            HELP_FRONTMATTER
          );
        }
      }
    }

    if (frontmatter.difficulty !== undefined) {
      const n =
        typeof frontmatter.difficulty === "string"
          ? parseInt(frontmatter.difficulty, 10)
          : frontmatter.difficulty;
      if (isNaN(n) || n < 1 || n > 5) {
        fail(
          `Invalid difficulty in ${targetFile}: ${frontmatter.difficulty}. Must be 1-5.`,
          HELP_FRONTMATTER
        );
      }
    }
  }

  console.log(`Validated ${deviceDirs.length} devices successfully.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
