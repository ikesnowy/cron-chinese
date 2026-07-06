import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  dts: true,
  globalName: 'CronChinese',
  outDir: 'dist',
  clean: true,
});
