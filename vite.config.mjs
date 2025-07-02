// vite.config.mjs
import { defineConfig } from 'vite';


export default defineConfig({
  base: './',       // relative paths so GitHub Pages works
  build: {
    outDir: 'docs', // where the static site will be emitted
    emptyOutDir: true
  },
  server: {
    open: true      // auto‑opens your browser on npm run dev
  }
});
