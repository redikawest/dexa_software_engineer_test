import { defineConfig } from 'vitest/config';
import { readAliases } from './test/aliases.js';

export default defineConfig({
  resolve: { alias: readAliases() },
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: true } },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
  },
});
