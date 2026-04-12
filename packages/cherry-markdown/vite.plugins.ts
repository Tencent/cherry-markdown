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
 * 1. 拦截对 dist/cherry-markdown.js 的请求，重定向到虚拟模块（源码入口 index.js）
 * 2. 拦截对 dist/cherry-markdown.core.js 的请求，重定向到虚拟模块（源码入口 index.core.js）
 * 3. 拦截对 dist/cherry-markdown.css 的请求，重定向到虚拟模块（SCSS 源文件）
 * 4. 拦截对 dist/addons/*.js 的请求，重定向到虚拟模块（src/addons/ 源码）
 * 5. 拦截字体文件请求，代理到 dist/fonts/ 目录
 * 6. 转换 HTML，将 link 标签转换为 JS 模块导入，将引用 dist 的 script 转换为 module 类型
 */
export function cherryDevPlugin(srcDir: string, cherryMarkdownDir: string): Plugin {
  // 虚拟模块 ID 前缀
  const VIRTUAL_PREFIX = 'virtual:cherry-';
  const RESOLVED_PREFIX = `\0${VIRTUAL_PREFIX}`;

  // 固定虚拟模块
  const virtualCherryJsId = `${VIRTUAL_PREFIX}full-js`;
  const virtualCherryCoreJsId = `${VIRTUAL_PREFIX}core-js`;
  const virtualCherryStreamJsId = `${VIRTUAL_PREFIX}stream-js`;
  const virtualCherryCssId = `${VIRTUAL_PREFIX}css`;
  const resolvedVirtualCherryJsId = `\0${virtualCherryJsId}`;
  const resolvedVirtualCherryCoreJsId = `\0${virtualCherryCoreJsId}`;
  const resolvedVirtualCherryStreamJsId = `\0${virtualCherryStreamJsId}`;
  const resolvedVirtualCherryCssId = `\0${virtualCherryCssId}`;

  /**
   * 将 addon 文件名转为 UMD 全局变量名（camelCase）
   * 例如：cherry-code-block-mermaid-plugin → CherryCodeBlockMermaidPlugin
   *
   * 这与 addons.build.js 中的命名逻辑保持一致，
   * 确保 HTML 中使用 window.CherryCodeBlockMermaidPlugin 能正确访问
   */
  function addonFileNameToGlobalName(fileName: string): string {
    const nameWithoutExt = fileName.replace(/\.js$/, '');
    return nameWithoutExt
      .split('-')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join('');
  }

  /**
   * 从请求 URL 中提取 addon 文件名
   * 匹配模式：.../dist/addons/<fileName>.js
   */
  function extractAddonFileName(url: string): string | null {
    const match = url.match(/\/packages\/cherry-markdown\/dist\/addons\/([^/?]+\.js)/);
    return match ? match[1] : null;
  }

  /**
   * 为 addon 生成虚拟模块 ID
   */
  function getAddonVirtualId(fileName: string): string {
    return `${VIRTUAL_PREFIX}addon-${fileName}`;
  }

  return {
    name: 'cherry-dev-redirect',
    enforce: 'pre',

    configureServer(server) {
      // 中间件：拦截请求并进行转发或代理
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        // 1. 拦截 addon JS 请求 → 虚拟模块
        // 必须在主包匹配之前，避免被 cherry-markdown*.js 的正则吃掉
        const addonFileName = extractAddonFileName(url);
        if (addonFileName) {
          // 检查对应源文件是否存在
          const srcPath = path.join(srcDir, 'addons', addonFileName);
          if (fs.existsSync(srcPath)) {
            req.url = `/@id/${getAddonVirtualId(addonFileName)}`;
            return next();
          }
        }

        // 2. 拦截 cherry-markdown.core.js 请求 → core 虚拟模块
        // 必须在通用的 cherry-markdown*.js 匹配之前
        const coreJsPattern = /\/?\.{0,2}\/?packages\/cherry-markdown\/dist\/cherry-markdown\.core[^/]*\.js/;
        if (coreJsPattern.test(url)) {
          req.url = `/@id/${virtualCherryCoreJsId}`;
          return next();
        }

        // 3. 拦截 cherry-markdown.stream.js 请求 → stream 虚拟模块
        // 必须在通用的 cherry-markdown*.js 匹配之前
        // stream 版本不包含 mermaid 等 addon 的 usePlugin 注册，按需手动加载
        const streamJsPattern = /\/?\.{0,2}\/?packages\/cherry-markdown\/dist\/cherry-markdown\.stream[^/]*\.js/;
        if (streamJsPattern.test(url)) {
          req.url = `/@id/${virtualCherryStreamJsId}`;
          return next();
        }

        // 4. 拦截 cherry-markdown.js（非 core、非 stream）请求 → full 虚拟模块
        const jsPattern = /\/?\.{0,2}\/?packages\/cherry-markdown\/dist\/cherry-markdown[^/]*\.js/;
        const cssPattern = /\/?\.{0,2}\/?packages\/cherry-markdown\/dist\/cherry-markdown[^/]*\.css/;

        if (jsPattern.test(url)) {
          req.url = `/@id/${virtualCherryJsId}`;
          return next();
        }

        // 5. 拦截 cherry-markdown.css 请求 → 虚拟模块
        if (cssPattern.test(url)) {
          req.url = `/@id/${virtualCherryCssId}`;
          return next();
        }

        // 6. 拦截字体文件请求，代理到 dist/fonts/
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
      if (id === virtualCherryJsId) return resolvedVirtualCherryJsId;
      if (id === virtualCherryCoreJsId) return resolvedVirtualCherryCoreJsId;
      if (id === virtualCherryStreamJsId) return resolvedVirtualCherryStreamJsId;
      if (id === virtualCherryCssId) return resolvedVirtualCherryCssId;

      // 动态 addon 虚拟模块
      if (id.startsWith(VIRTUAL_PREFIX + 'addon-')) {
        return `\0${id}`;
      }
    },

    load(id) {
      const srcDirNormalized = srcDir.replace(/\\/g, '/');

      // 加载 full bundle 虚拟模块 - 从 index.js 导入（包含 mermaid 等所有 addon）
      if (id === resolvedVirtualCherryJsId) {
        return `
import Cherry from '${srcDirNormalized}/index.js';

// 暴露到全局，兼容 examples 中的用法
window.Cherry = Cherry;

export default Cherry;
export { Cherry };
`;
      }

      // 加载 core 虚拟模块 - 从 index.core.js 导入（不含 addon，按需加载）
      if (id === resolvedVirtualCherryCoreJsId) {
        return `
import Cherry from '${srcDirNormalized}/index.core.js';

// 暴露到全局，兼容 examples 中的用法
window.Cherry = Cherry;

export default Cherry;
export { Cherry };
`;
      }

      // 加载 stream 虚拟模块 - 从 index.stream.js 导入
      // EChartsTableEngine 需通过 usePlugin 注册（注入 chartRenderEngine 到默认配置）
      // echarts 通过页面 <script> 全局加载，不需要动态开关
      if (id === resolvedVirtualCherryStreamJsId) {
        return `
import Cherry from '${srcDirNormalized}/index.stream.js';
import EChartsTableEngine from '${srcDirNormalized}/addons/advance/cherry-table-echarts-plugin';

if (typeof window !== 'undefined' && window.echarts) {
  Cherry.usePlugin(EChartsTableEngine);
}

// 暴露到全局，兼容 examples 中的用法
window.Cherry = Cherry;

export default Cherry;
export { Cherry };
`;
      }

      // 加载虚拟 CSS 模块 - 导入 SCSS 源文件
      if (id === resolvedVirtualCherryCssId) {
        return `import '${srcDirNormalized}/sass/index.scss';`;
      }

      // 加载 addon 虚拟模块 - 从 src/addons/ 导入并暴露为 UMD 风格的全局变量
      if (id.startsWith(RESOLVED_PREFIX + 'addon-')) {
        const fileName = id.replace(RESOLVED_PREFIX + 'addon-', '');
        const globalName = addonFileNameToGlobalName(fileName);
        return `
import AddonModule from '${srcDirNormalized}/addons/${fileName}';

// 暴露到全局，兼容 dist/addons/ UMD 构建中的全局变量命名
window.${globalName} = AddonModule;

export default AddonModule;
`;
      }
    },

    // 转换 HTML，处理脚本类型和样式引入
    //
    // 虚拟模块返回 ES module 代码（import/export），所以需要：
    // 1. CSS link → module script（Vite 处理 SCSS 需通过 JS 模块）
    // 2. cherry-markdown*.js → type="module"（虚拟模块是 ES module）
    // 3. dist/addons/*.js → type="module"（addon 虚拟模块也是 ES module）
    //
    // 注意：由于 module 脚本延迟执行，后续依赖 Cherry 的脚本
    // 必须也是 module 脚本或写在 <script type="module"> 内联块中，
    // 以保证按文档顺序执行。
    transformIndexHtml(html) {
      let result = html;

      // 1. CSS link → module script
      result = result.replace(
        /<link[^>]*href=["']([^"']*\/packages\/cherry-markdown\/dist\/cherry-markdown[^"']*\.css)["'][^>]*\/?>/gi,
        (_match, href) => {
          return `<script type="module">import "${href}";</script>`;
        },
      );

      // 2. cherry-markdown*.js（主包和 core）→ type="module"
      result = result.replace(
        /<script([^>]*)\s+src=["']([^"']*\/packages\/cherry-markdown\/dist\/cherry-markdown[^"']*)["']([^>]*)><\/script>/gi,
        (match, before, src, after) => {
          if (/type\s*=\s*["']module["']/i.test(before + after)) {
            return match;
          }
          return `<script type="module"${before} src="${src}"${after}></script>`;
        },
      );

      // 3. dist/addons/*.js → type="module"
      result = result.replace(
        /<script([^>]*)\s+src=["']([^"']*\/packages\/cherry-markdown\/dist\/addons\/[^"']*\.js)["']([^>]*)><\/script>/gi,
        (match, before, src, after) => {
          if (/type\s*=\s*["']module["']/i.test(before + after)) {
            return match;
          }
          return `<script type="module"${before} src="${src}"${after}></script>`;
        },
      );

      return result;
    },
  };
}
