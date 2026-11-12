import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/spanish-buddy/" : "/", // GitHub Pages serves at /<repo>/
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "Adrián · Spanisch lernen",
        short_name: "Adrián",
        lang: "de",
        display: "standalone",
        background_color: "#f6f1e7",
        theme_color: "#f6f1e7",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }, // more padding: Android crops to a circle
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
        importScripts: ["push-sw.js"], // notifications
        // words.json changes nightly: try the network, fall back to cache when offline
        // mp3 names change whenever the audio does, so a cached one is never stale
        runtimeCaching: [
          { urlPattern: /words\.json$/, handler: "NetworkFirst" },
          { urlPattern: /\/audio\/.*\.mp3$/, handler: "CacheFirst", options: { cacheName: "audio" } },
        ],
      },
    }),
  ],
}));
