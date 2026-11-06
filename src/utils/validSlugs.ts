import { slugify } from "./deviceUtils";

export const getSlugIfValid = (
  value: string,
  validSlugs: ReadonlySet<string>
): string | null => {
  const slug = slugify(value);

  return validSlugs.has(slug) ? slug : null;
};
