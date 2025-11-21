import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  outDir: 'dist',
  external: ['@babel/core', '@babel/types', 'change-case'],
  splitting: false,
});
