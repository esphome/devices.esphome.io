import { getCollection, type CollectionEntry } from "astro:content";
import { splitValues, slugify, type RawDeviceMetadata } from "./deviceUtils";
import { parseAliases, type DeviceAlias } from "./deviceAliases";

export type DeviceEntry = {
  id: string;
  path: string;
  data: RawDeviceMetadata;
  /** Alternate names/URLs declared in `alias` frontmatter. */
  aliases: DeviceAlias[];
  /** Set on listing rows synthesised from an alias; id of the real device. */
  aliasOf?: string;
};

function entryToDevice(entry: CollectionEntry<"docs">): DeviceEntry {
  const id = entry.id.replace(/^devices\//, "");
  const data = entry.data as unknown as RawDeviceMetadata;
  return {
    id,
    path: `/devices/${id}/`,
    data,
    aliases: parseAliases(data.alias).aliases,
  };
}

/**
 * Expand a list for display: every alias that carries a `title` gets its own
 * row, so the device is findable under each of its names. The extra rows link
 * straight to the canonical page instead of via the alias redirect.
 */
export function withAliasEntries(devices: DeviceEntry[]): DeviceEntry[] {
  return devices.flatMap((device) => [
    device,
    ...device.aliases
      .filter((alias) => alias.title !== undefined)
      .map((alias) => ({
        id: `${device.id}--${alias.slug.toLowerCase()}`,
        path: device.path,
        data: { ...device.data, title: alias.title! },
        aliases: [],
        aliasOf: device.id,
      })),
  ]);
}

export async function getAllDevices(): Promise<DeviceEntry[]> {
  const entries = await getCollection("docs", (entry) =>
    entry.id.startsWith("devices/") &&
    entry.id !== "devices/adding-devices" &&
    entry.id !== "devices/tuya-convert"
  );
  return entries.map(entryToDevice);
}

type FilterType = "type" | "standards" | "board" | "made-for-esphome";

export function matchesFilter(
  device: RawDeviceMetadata,
  filterType: FilterType,
  filterValue: string
): boolean {
  const normalized = filterValue.toLowerCase();

  switch (filterType) {
    case "type":
      return (device.type ?? "").toLowerCase() === normalized;
    case "standards":
      return splitValues(device.standard).some(
        (entry) => slugify(entry) === normalized
      );
    case "board":
      return splitValues(device.board).some(
        (entry) => slugify(entry) === normalized
      );
    case "made-for-esphome":
      return (
        String(device["made-for-esphome"] ?? "").toLowerCase() === normalized
      );
    default:
      return false;
  }
}

export function sortDevices(
  devices: DeviceEntry[],
  sortBy: "title" | "date" = "title"
): DeviceEntry[] {
  return devices.slice().sort((a, b) => {
    if (sortBy === "title") {
      return a.data.title.localeCompare(b.data.title);
    }

    const dateA = new Date(a.data["date-published"] ?? "");
    const dateB = new Date(b.data["date-published"] ?? "");
    const isValidA = !isNaN(dateA.getTime());
    const isValidB = !isNaN(dateB.getTime());

    if (!isValidA && !isValidB) return 0;
    if (!isValidA) return 1;
    if (!isValidB) return -1;
    return dateB.getTime() - dateA.getTime();
  });
}
