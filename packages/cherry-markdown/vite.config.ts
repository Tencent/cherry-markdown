import { defineConfig } from 'vite';
import path from 'path';

const paths = [
  '/index.html',
  // '/basic.html',
  '/h5.html',
  '/multiple.html',
  '/notoolbar.html',
  '/preview_only.html',
  '/xss.html',
  // '/api.html',
  '/img.html',
  '/table.html',
  '/head_num.html',
  // '/ai_chat.html',
  // '/vim.html',
  // '/mermaid.html',
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
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@examples', replacement: path.resolve(__dirname, '../../examples') },
    ],
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
    __EXAMPLES_PATH__: JSON.stringify(path.resolve(__dirname, '../../examples').replace(/\\/g, '/')),
  },
  plugins: [printLinks()],
});
