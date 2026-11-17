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
  build: {
    rollupOptions: {
      output: {
        // Long-lived vendor chunks: a content edit no longer re-downloads ~1.3 MB of
        // libraries, and the browser fetches them in parallel with the app code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/three\//.test(id)) return 'vendor-three';
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
          if (/node_modules\/(gsap|@gsap)\//.test(id)) return 'vendor-gsap';
          if (/node_modules\/(i18next|react-i18next)\//.test(id)) return 'vendor-i18n';
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
