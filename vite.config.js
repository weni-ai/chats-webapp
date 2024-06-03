import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import createVuePlugin from '@vitejs/plugin-vue';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      vue: '@vue/compat',
    },
  },
  plugins: [
    createVuePlugin({
      template: {
        compilerOptions: {
          compatConfig: {
            MODE: 3,
          },
        },
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `
          @import '@weni/unnnic-system/src/assets/scss/unnnic.scss';
        `,
      },
    },
  },
  server: {
    fs: {
      cachedChecks: false,
    },
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true }, // Change
  },
});
