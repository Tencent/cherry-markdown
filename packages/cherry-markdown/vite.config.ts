import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';

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
  '/ai_chat.html',
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

function spaFallback() {
  return {
    name: 'spa-fallback',
    transformIndexHtml: (html: string, ctx: { path: string; filename?: string; server?: any }) => {
      const { path } = ctx;
      // 如果是配置的路径之一，注入脚本设置原始路径
      // 优化的路径匹配逻辑
      const isExactMatch = paths.includes(path);
      const isPathWithoutHtmlMatch = path.endsWith('.html') && paths.includes(path.slice(0, -5));
      let matchedPath: string | null = null;
      if (isExactMatch) {
        matchedPath = path;
      } else if (isPathWithoutHtmlMatch) {
        matchedPath = path.slice(0, -5);
      }

      if (matchedPath && matchedPath !== '/index.html') {
        // 转义路径中的特殊字符以防止XSS注入
        const escapedPath = matchedPath.replace(/['"\\]/g, '\\$&');
        const script = `<script>window.__ORIGINAL_PATH__ = '${escapedPath}';</script>`;
        return html.replace('</head>', `${script}\n  </head>`);
      }
      return html;
    },
  };
}

// 构建后复制 index.html 为多页面，并注入对应的 ORIGINAL_PATH
function duplicateHtmlForPaths() {
  return {
    name: 'duplicate-html-for-paths',
    apply: 'build' as const,
    writeBundle: async (options: { dir?: string }) => {
      try {
        const outDir = options.dir || path.resolve(__dirname, 'preview');
        const indexPath = path.join(outDir, 'index.html');
        if (!fs.existsSync(indexPath)) return;
        const indexHtml = await fsp.readFile(indexPath, 'utf-8');

        const targets = paths.filter((p) => p !== '/index.html');
        await Promise.all(
          targets.map(async (p) => {
            const fileName = p.replace(/^\//, '');
            const destPath = path.join(outDir, fileName);
            const escapedPath = p.replace(/['"\\]/g, '\\$&');
            const script = `<script>window.__ORIGINAL_PATH__ = '${escapedPath}';</script>`;
            const patched = indexHtml.replace('</head>', `${script}\n  </head>`);
            await fsp.writeFile(destPath, patched, 'utf-8');
          }),
        );
        // 打印一份产物访问提示
        // eslint-disable-next-line no-console
        console.log(`已生成多页面预览: ${['/index.html', ...targets].join(', ')}`);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('duplicate-html-for-paths 插件执行失败: ', e);
      }
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
    host: '0.0.0.0',
    port: 5173,
    open: false,
    allowedHosts: true,
    fs: {
      allow: [path.resolve(__dirname), path.resolve(__dirname, 'dist'), path.resolve(__dirname, '..', '..')],
    },
  },
  build: {
    outDir: 'preview-dist',
    emptyOutDir: false,
  },
  define: {
    'process.env.BUILD_VERSION': JSON.stringify(process.env.BUILD_VERSION || ''),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    BUILD_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
    __EXAMPLES_PATH__: JSON.stringify(path.resolve(__dirname, '../../examples').replace(/\\/g, '/')),
  },
  plugins: [spaFallback(), printLinks(), duplicateHtmlForPaths()],
});
