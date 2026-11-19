import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  server: { allowedHosts: ['terminal.local'] },
  esbuild: { jsx: 'automatic' },
  plugins: [
    VitePWA({
      strategies: 'injectManifest', // we write our own service worker (src/sw.js) with Workbox modules
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt', // the user presses "Update" to activate a new version
      injectRegister: false, // registration happens in src/pwa/UpdatePrompt.jsx
      manifest: false, // public/manifest.json is used and linked in index.html
      base: './',
      scope: './',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,json,ico,woff2}'], // app shell, icons, offline.html
      },
      devOptions: { enabled: false },
    }),
  ],
});
