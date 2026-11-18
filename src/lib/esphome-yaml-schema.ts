/**
 * The js-yaml schema the yaml validator and the Made-for-ESPHome reviewer use
 * to parse ESPHome configs. Both must agree on what a secret reference is, so
 * this is the single copy.
 *
 * ESPHome's custom tags (`!secret`, `!lambda`, ...) parse to a string with the
 * tag stamped back on, so `password: !secret wifi_password` becomes
 * "!secret wifi_password" and the password checks can tell a reference from a
 * literal. A bare tag (`password: !secret`) becomes just the tag.
 *
 * On top of js-yaml 5's CORE_SCHEMA it adds the tags js-yaml 4's
 * DEFAULT_SCHEMA had (merge, timestamp, binary, omap, pairs, set), so `<<:`
 * merge keys and timestamps parse as they did before the upgrade.
 */
import * as yaml from "js-yaml";

export const ESPHOME_TAGS = ["!secret", "!lambda", "!include", "!env", "!env_var", "!extend", "!remove"] as const;

export const ESPHOME_SCHEMA = yaml.CORE_SCHEMA.withTags(
  yaml.mergeTag,
  yaml.timestampTag,
  yaml.binaryTag,
  yaml.omapTag,
  yaml.pairsTag,
  yaml.setTag,
  ESPHOME_TAGS.map((tag) =>
    yaml.defineScalarTag(tag, {
      resolve: (source) => (source === "" ? tag : `${tag} ${source}`),
      identify: () => false,
    })
  )
);
