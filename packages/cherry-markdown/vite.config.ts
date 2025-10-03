import { defineConfig } from 'vite';
import path from 'path';

const paths = [
  '/index',
  '/mobile',
  '/multiple',
  '/editor-without-toolbar',
  '/preview',
  '/xss',
  '/img',
  '/table',
  '/header-with-auto-num',
  // '/ai-chat-scenario',
  // '/vim-editing-mode',
  // '/mermaid',
];

function printLinks() {
  return {
    name: 'print-links',
    configureServer(server: any) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        let port = 5173;
        // 始终使用 localhost
        const host = 'localhost';
        if (typeof address === 'object' && address) {
          port = address.port || port;
        }
        console.log('\n可访问页面链接:');
        paths.forEach((p) => {
          console.log(`  http://${host}:${port}${p}`);
        });
        console.log('');
      });
    },
  };
}

export default defineConfig({
  root: process.cwd(),
  base: '/',
  publicDir: 'dist',
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
  },
  server: {
    port: 5173,
    open: false,
    fs: {
      allow: [path.resolve(__dirname), path.resolve(__dirname, 'dist'), path.resolve(__dirname, '..', '..')],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,
  },
  define: {
    'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  plugins: [printLinks()],
});
