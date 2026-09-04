import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts', 'serverless.ts'],
  format: ['esm'],
  clean: true,
  sourcemap: true,
  outDir: 'dist'
});
