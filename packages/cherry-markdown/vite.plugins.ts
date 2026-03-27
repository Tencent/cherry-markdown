/**
 * Vite 开发模式插件集合
 *
 * 本文件包含为开发环境设计的 Vite 插件，用于：
 * 1. 虚拟模块处理：将对 dist 的请求重定向到源码
 * 2. 资源中间件：处理字体文件和资源路由
 * 3. HTML 转换：适配开发模式的 script 和 link 标签
 * 4. 链接打印：启动时显示所有可访问的页面链接
 *
 * 注意：这些插件仅在开发模式使用，生产环境不加载此文件
 */

import { Plugin } from 'vite';
import path from 'path';
import fs from 'fs';

/**
 * 打印可访问链接的插件
 * 在开发服务器启动后，打印所有可访问的 HTML 页面链接
 */
export function printLinksPlugin(examplesDir: string, htmlPages: string[]): Plugin {
  return {
    name: 'print-links',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const address = server.httpServer?.address();
        let port = 5173;
        const host = 'localhost';
        if (typeof address === 'object' && address) {
          port = address.port || port;
        }
        console.log('\n🍒 Cherry Markdown 开发服务器已启动');
        console.log('\n可访问页面链接:');
        htmlPages.forEach((p) => {
          const filePath = path.join(examplesDir, p);
          if (fs.existsSync(filePath)) {
            console.log(`  ✅ http://${host}:${port}${p}`);
          }
        });
        console.log('');
      });
    },
  };
}

/**
 * Cherry Markdown 开发模式插件
 *
 * 功能：
 * 1. 拦截对 dist/cherry-markdown.js 的请求，重定向到虚拟模块（源码）
 * 2. 拦截对 dist/cherry-markdown.css 的请求，重定向到虚拟模块（SCSS 源文件）
 * 3. 拦截字体文件请求，代理到 dist/fonts/ 目录
 * 4. 转换 HTML，将 link 标签转换为 JS 模块导入，将引用 dist 的 script 转换为 module 类型
 */
export function cherryDevPlugin(srcDir: string, cherryMarkdownDir: string): Plugin {
  // 虚拟模块 ID
  const virtualCherryJsId = 'virtual:cherry-markdown-js';
  const virtualCherryCssId = 'virtual:cherry-markdown-css';
  const resolvedVirtualCherryJsId = `\0${virtualCherryJsId}`;
  const resolvedVirtualCherryCssId = `\0${virtualCherryCssId}`;

  return {
    name: 'cherry-dev-redirect',
    enforce: 'pre',

    configureServer(server) {
      // 中间件：拦截请求并进行转发或代理
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // 匹配模式：/packages/cherry-markdown/dist/cherry-markdown*.js
        const jsPattern = /\/?\.{0,2}\/?packages\/cherry-markdown\/dist\/cherry-markdown[^/]*\.js/;
        const cssPattern = /\/?\.{0,2}\/?packages\/cherry-markdown\/dist\/cherry-markdown[^/]*\.css/;

        // 拦截 cherry-markdown.js 请求 → 虚拟模块
        if (jsPattern.test(url)) {
          req.url = `/@id/${virtualCherryJsId}`;
          return next();
        }

        // 拦截 cherry-markdown.css 请求 → 虚拟模块
        if (cssPattern.test(url)) {
          req.url = `/@id/${virtualCherryCssId}`;
          return next();
        }

        // 拦截字体文件请求，代理到 dist/fonts/
        // 情况1: src/sass/fonts/ 路径（Vite 处理 SCSS 时生成的绝对路径）
        // 情况2: /fonts/ 根路径（CSS 通过 JS 模块注入时，浏览器用页面 URL 解析相对路径 ./fonts/）
        const fontPatterns = [/\/packages\/cherry-markdown\/src\/sass\/fonts\/(.+)/, /^\/fonts\/(ch-icon\.[^?]+)/];
        const mimeTypes: Record<string, string> = {
          '.woff2': 'font/woff2',
          '.woff': 'font/woff',
          '.ttf': 'font/ttf',
          '.eot': 'application/vnd.ms-fontobject',
          '.svg': 'image/svg+xml',
        };

        for (const pattern of fontPatterns) {
          const fontMatch = url.match(pattern);
          if (fontMatch) {
            const fontFile = fontMatch[1].split('?')[0];
            const fontPath = path.join(cherryMarkdownDir, 'dist', 'fonts', fontFile);
            if (fs.existsSync(fontPath)) {
              const ext = path.extname(fontFile).toLowerCase();
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
              res.setHeader('Cache-Control', 'max-age=31536000');
              fs.createReadStream(fontPath).pipe(res);
              return;
            }
          }
        }

        next();
      });
    },

    resolveId(id) {
      if (id === virtualCherryJsId) {
        return resolvedVirtualCherryJsId;
      }
      if (id === virtualCherryCssId) {
        return resolvedVirtualCherryCssId;
      }
    },

    load(id) {
      // 加载虚拟 JS 模块 - 从源码导入并暴露到全局
      if (id === resolvedVirtualCherryJsId) {
        return `
import Cherry from '${srcDir.replace(/\\/g, '/')}/index.js';

// 暴露到全局，兼容 examples 中的用法
window.Cherry = Cherry;

export default Cherry;
export { Cherry };
`;
      }

      // 加载虚拟 CSS 模块 - 导入 SCSS 源文件
      if (id === resolvedVirtualCherryCssId) {
        return `import '${srcDir.replace(/\\/g, '/')}/sass/index.scss';`;
      }
    },

    // 转换 HTML，处理脚本类型和样式引入
    transformIndexHtml(html) {
      let result = html;

      // 1. 将引用 dist/cherry-markdown.css 的 link 标签转换为 JS 模块导入
      // 因为 Vite 处理 SCSS 需要通过 JS 模块
      result = result.replace(
        /<link[^>]*href=["']([^"']*\/packages\/cherry-markdown\/dist\/cherry-markdown[^"']*\.css)["'][^>]*\/?>/gi,
        (_match, href) => {
          return `<script type="module">import "${href}";</script>`;
        },
      );

      // 2. 将引用 dist/cherry-markdown.js 的普通 script 标签转换为 module 类型
      // 因为源码是 ES Module
      result = result.replace(
        /<script([^>]*)\s+src=["']([^"']*\/packages\/cherry-markdown\/dist\/cherry-markdown[^"']*)["']([^>]*)><\/script>/gi,
        (match, before, src, after) => {
          // 如果已经是 module 类型，不做处理
          if (/type\s*=\s*["']module["']/i.test(before + after)) {
            return match;
          }
          // 添加 type="module"
          return `<script type="module"${before} src="${src}"${after}></script>`;
        },
      );

      return result;
    },
  };
}
