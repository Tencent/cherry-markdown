import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: process.cwd(),
  base: '/',
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
  server: {
    port: 5173,
    open: false,
    // serve from workspace root so index.html loads /packages/cherry-markdown/src
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      // keep default rollup options; production build will still use existing rollup scripts
    },
  },
  define: {
    // provide minimal process.env replacements for code that expects process in browser
    'process.env': {},
    'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
