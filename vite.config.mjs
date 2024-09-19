import { fileURLToPath, URL } from 'node:url';
// import { createHash } from 'crypto';
// import fs from 'fs';
// import path from 'path';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { VitePWA } from 'vite-plugin-pwa';

// const htmlTransform = () => ({
//   name: 'html-transform',
//   apply: 'build',
//   closeBundle() {
//     const indexPath = path.resolve(__dirname, 'dist', 'index.html');

//     const hash = createHash('md5')
//       .update(Date.now().toString())
//       .digest('hex')
//       .substring(0, 8);

//     let html = fs.readFileSync(indexPath, 'utf-8');

//     // Added the query string ?v=[hash] for CSS and JS only
//     html = html.replace(/(\/assets\/chats\.(js|css))/g, `$1?v=${hash}`);

//     fs.writeFileSync(indexPath, html);
//   },
// });

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logos/weni-512.png'],
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.js',
      manifest: {
        name: 'Weni Chats',
        short_name: 'Weni',
        theme_color: '#00A49F',
        icons: [
          {
            src: 'logos/weni-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
    // htmlTransform(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        additionalData: `
          @import '@weni/unnnic-system/src/assets/scss/unnnic.scss';
        `,
      },
    },
  },
  server: {
    port: 8080,
    fs: {
      cachedChecks: false,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // build: {
  //   rollupOptions: {
  //     output: {
  //       entryFileNames: 'assets/chats.js',
  //       chunkFileNames: 'assets/chats.js',
  //       assetFileNames: (assetInfo) => {
  //         if (assetInfo.name.endsWith('.css')) {
  //           return 'assets/chats.css';
  //         }
  //         return 'assets/' + assetInfo.name;
  //       },
  //     },
  //   },
  // },
});
