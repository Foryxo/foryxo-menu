import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Foryxo Menu — منوی دیجیتال فوریکسو",
    short_name: "Foryxo Menu",
    description: "Bilingual digital menus for cafés and restaurants.",
    start_url: "/fa",
    display: "standalone",
    background_color: "#fafbfd",
    theme_color: "#2347c8",
    lang: "fa",
    dir: "rtl",
    icons: [
      { src: "/logo.png", sizes: "1024x1024", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "1024x1024", type: "image/png", purpose: "maskable" },
    ],
  };
}
