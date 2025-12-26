// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  base: '/',
  build: {
    format: 'directory',
  },
  vite: {
    define: {
      'import.meta.env.BUILD_TIMESTAMP': JSON.stringify(process.env.BUILD_TIMESTAMP || new Date().toISOString()),
    },
  },
});
