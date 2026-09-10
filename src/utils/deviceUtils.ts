export type RawDeviceMetadata = {
  title: string;
  "date-published"?: string;
  type?: string;
  standard?: string | string[];
  board?: string | string[];
  difficulty?: string | number;
  "made-for-esphome"?: string | boolean;
  [key: string]: unknown;
};

export const splitValues = (raw?: string | string[]): string[] => {
  if (!raw) {
    return [];
  }

  const value = Array.isArray(raw) ? raw.join(",") : raw;

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const slugify = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, "-");
