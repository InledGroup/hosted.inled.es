import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  // Eliminamos el adaptador de Cloudflare para que sea 100% estático
  // Cloudflare Pages servirá la carpeta dist/ automáticamente.
});
