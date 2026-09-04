import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm'],
  clean: true,
  sourcemap: true,
  outDir: 'dist',
  noExternal: [/(.*)/],
  external: [
    '@prisma/client', 
    'prisma', 
    'bcryptjs', 
    'cors', 
    'dotenv', 
    'express', 
    'jsonwebtoken', 
    'mongoose', 
    'multer', 
    'pg', 
    'xlsx', 
    'zod'
  ],
});
