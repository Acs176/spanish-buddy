import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/spanish-buddy/" : "/", // GitHub Pages serves at /<repo>/
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Toro · Spanisch lernen",
        short_name: "Toro",
        lang: "de",
        display: "standalone",
        background_color: "#fbf3e4",
        theme_color: "#fbf3e4",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        // words.json changes nightly: try the network, fall back to cache when offline
        runtimeCaching: [{ urlPattern: /words\.json$/, handler: "NetworkFirst" }],
      },
    }),
  ],
}));
