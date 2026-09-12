import react from '@vitejs/plugin-react';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const packageRoot = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(packageRoot, '../..');
const examplesRoot = resolve(packageRoot, 'examples');
const sharedExamplesRoot = resolve(workspaceRoot, 'examples');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
};

function sharedDemoAssets() {
  return {
    name: 'cherry-milkdown-shared-demo-assets',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
        let file;
        if (pathname.startsWith('/assets/')) {
          file = resolve(sharedExamplesRoot, `.${pathname}`);
        } else if (pathname === '/images/demo-dog.png') {
          file = resolve(sharedExamplesRoot, 'assets/images/demo-dog.png');
        } else if (pathname === '/视频链接地址') {
          file = resolve(sharedExamplesRoot, 'assets/images/demo.mp4');
        } else if (pathname === '/drawio_demo.html') {
          file = resolve(sharedExamplesRoot, 'drawio_demo.html');
        } else {
          next();
          return;
        }

        if (relative(sharedExamplesRoot, file).startsWith('..')) {
          next();
          return;
        }
        try {
          if (!(await stat(file)).isFile()) {
            next();
            return;
          }
          response.statusCode = 200;
          response.setHeader('Content-Type', contentTypes[extname(file).toLowerCase()] ?? 'application/octet-stream');
          createReadStream(file).pipe(response);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  root: examplesRoot,
  base: './',
  plugins: [react(), sharedDemoAssets()],
  build: {
    outDir: resolve(packageRoot, 'preview'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(examplesRoot, 'index.html'),
        visual: resolve(examplesRoot, 'visual.html'),
      },
    },
  },
});
