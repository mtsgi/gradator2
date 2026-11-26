import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite-plus';

export default defineConfig({
  defaultPackage: {
    dev: './apps/web',
    build: './apps/web',
    preview: './apps/web',
  },
  resolve: {
    alias: {
      '@gradator/core': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)),
      '@gradator/css': fileURLToPath(new URL('./packages/css/src/index.ts', import.meta.url)),
    },
  },
  run: {
    cache: true,
  },
  lint: {
    plugins: ['typescript', 'unicorn', 'oxc'],
    ignorePatterns: ['dist/**', 'playwright-report/**', 'test-results/**'],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    overrides: [
      {
        files: ['apps/web/**'],
        plugins: ['vue'],
      },
      {
        files: ['**/*.test.ts', '**/*.spec.ts'],
        plugins: ['vitest'],
      },
    ],
  },
  fmt: {
    singleQuote: true,
    semi: true,
  },
  test: {
    include: ['packages/*/src/**/*.test.ts', 'apps/*/src/**/*.test.ts'],
  },
});
