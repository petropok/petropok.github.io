import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://petropok.github.io',
  base: '/',
  build: {
    format: 'directory',
  },
});
