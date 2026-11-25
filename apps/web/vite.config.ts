import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@gradator/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      '@gradator/css': fileURLToPath(new URL('../../packages/css/src/index.ts', import.meta.url)),
    },
  },
});
