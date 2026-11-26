import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  resolve: {
    alias: {
      '@gradator/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
    },
  },
  pack: {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
