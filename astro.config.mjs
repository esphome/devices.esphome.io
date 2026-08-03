import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import starlight from "@astrojs/starlight";
import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "url";
import path from "path";
import deviceAssets from "./src/integrations/device-assets";
import remarkYamlInclude from "./src/integrations/remark-yaml-include";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: "https://devices.esphome.io",
  vite: {
    resolve: {
      alias: {
        "@components": path.resolve(__dirname, "./src/components"),
      },
    },
  },
  image: {
    responsiveStyles: true,
  },
  markdown: {
    processor: unified({ remarkPlugins: [remarkYamlInclude] }),
  },
  integrations: [
    starlight({
      title: "ESPHome Devices",
      titleDelimiter: "-",
      description:
        "A repository of device configuration templates and setup guides for devices running ESPHome firmware.",
      favicon: "/img/favicon.png",
      pagination: false,
      logo: {
        src: "./src/assets/logo.svg",
        alt: "ESPHome Devices Logo",
        replacesTitle: false,
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/esphome/devices.esphome.io",
        },
        {
          icon: "discord",
          label: "Discord",
          href: "https://discord.gg/KhAMKrd",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/esphome/devices.esphome.io/edit/main/",
      },
      components: {
        MarkdownContent: "./src/components/MarkdownContent.astro",
        Footer: "./src/components/Footer.astro",
      },
      customCss: [
        "./src/styles/custom.css",
        "./src/styles/device-list.css",
        "./src/styles/remote-yaml.css",
      ],
      head: [
        {
          tag: "meta",
          attrs: { property: "og:image", content: "/img/social-card.svg" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:card", content: "summary_large_image" },
        },
        {
          tag: "script",
          attrs: { src: "/js/remote-yaml-include.js", defer: true },
        },
        {
          tag: "script",
          attrs: { src: "/js/yaml-include-action.js", defer: true },
        },
      ],
      sidebar: [
        {
          label: "Made for ESPHome",
          link: "/made-for-esphome",
        },
        {
          label: "Device Type",
          collapsed: false,
          items: [
            { label: "Dimmers", link: "/type/dimmer" },
            { label: "Lights & LEDs", link: "/type/light" },
            { label: "Miscellaneous Devices", link: "/type/misc" },
            { label: "Plugs & Sockets", link: "/type/plug" },
            { label: "Relays", link: "/type/relay" },
            { label: "Sensors", link: "/type/sensor" },
            { label: "Switches", link: "/type/switch" },
          ],
        },
        {
          label: "Electrical Standard",
          collapsed: false,
          items: [
            { label: "AU Devices", link: "/standards/au" },
            { label: "BR Devices", link: "/standards/br" },
            { label: "EU Devices", link: "/standards/eu" },
            { label: "Global Devices", link: "/standards/global" },
            { label: "IN Devices", link: "/standards/in" },
            { label: "UK Devices", link: "/standards/uk" },
            { label: "US Devices", link: "/standards/us" },
          ],
        },
        {
          label: "Microcontroller",
          collapsed: false,
          items: [
            { label: "BK72xx", link: "/board/bk72xx" },
            { label: "ESP32", link: "/board/esp32" },
            { label: "ESP8266", link: "/board/esp8266" },
            { label: "RP2040", link: "/board/rp2040" },
            { label: "RTL87xx", link: "/board/rtl87xx" },
          ],
        },
        {
          label: "Guides",
          collapsed: false,
          items: [
            { label: "Adding Devices", link: "/devices/adding-devices" },
            {
              label: "Prepare a device with tuya-convert",
              link: "/devices/tuya-convert",
            },
          ],
        },
        {
          label: "Hosted By",
          collapsed: false,
          items: [
            {
              label: "Netlify",
              link: "https://netlify.com/",
              attrs: { target: "_blank", rel: "noopener" },
            },
          ],
        },
      ],
    }),
    sitemap(),
    deviceAssets(),
  ],
});
