import { defineConfig } from 'vitest/config';
import { readAliases } from './test/aliases.js';

export default defineConfig({
  resolve: { alias: readAliases() },
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: true } },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup-env.ts'],
    fileParallelism: false,
    testTimeout: 15_000,
  },
});
