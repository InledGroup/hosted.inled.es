import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    routes: {
      extend: {
        exclude: ['/1/*']
      }
    }
  }),
});
