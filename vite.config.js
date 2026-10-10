import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Set to '/repository-name/' before Pages evaluation. No server-dependent routes.
const base = '/bab-example-madness/';
export default defineConfig(({ mode }) => ({
  root: mode === 'test' ? '.' : 'app',
  base: mode === 'test' ? '/' : base,
  server: { host: '127.0.0.1', strictPort: true },
  preview: { host: '127.0.0.1', strictPort: true },
  build: {
    outDir: '../dist', emptyOutDir: true,
    rolldownOptions: { input: { main: resolve(import.meta.dirname, 'app/index.html'), story: resolve(import.meta.dirname, 'app/build-story.html') } },
  },
}));
