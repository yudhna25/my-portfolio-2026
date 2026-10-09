import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

const __dirname = import.meta.dirname;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeManifestIcons: false,
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ["**/*.{js,css,html,woff2,webp,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => url.origin === self.location.origin && request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "stellar-images",
              expiration: { maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "stellar-font-styles",
              expiration: { maxEntries: 4, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: "CacheFirst",
            options: {
              cacheName: "stellar-fonts",
              expiration: { maxEntries: 16, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        id: "/",
        name: "Trần Vũ Anh Duy — Stellar Odyssey",
        short_name: "Anh Duy Portfolio",
        description: "Portfolio của Trần Vũ Anh Duy — UX/UI, Đồ họa & Motion Design.",
        lang: "vi",
        theme_color: "#050505",
        background_color: "#050505",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "pwa-maskable-192x192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
