import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    routes: {
      strategy: 'include',
      extend: {
        exclude: ['/1/*', '/_astro/*']
      }
    }
  }),
});
