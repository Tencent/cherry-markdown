import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vite-plus';
import clientConfig from './vite.config';
import { prismLanguagePlugin } from '../cherry-markdown/build/prism.plugin.js';
import { transformPrismLanguages } from '../cherry-markdown/build/prism.js';

const workspace = resolve(import.meta.dirname, '../..');
export default defineConfig(async (env) => {
  const codeBlock = resolve(workspace, 'packages/cherry-markdown/src/core/hooks/CodeBlock.js');
  const transformed = await transformPrismLanguages(readFileSync(codeBlock, 'utf8'), codeBlock);
  const prismImports = Array.from(
    transformed?.code.matchAll(/['"](prismjs\/components\/[^'"]+)['"]/g) ?? [],
    (match) => match[1],
  );
  const cherryPackage = JSON.parse(readFileSync(resolve(workspace, 'packages/cherry-markdown/package.json'), 'utf8'));
  const codeMirrorDeps = Object.keys(cherryPackage.dependencies).filter((name) => name.startsWith('@codemirror/'));
  return mergeConfig(await (typeof clientConfig === 'function' ? clientConfig(env) : clientConfig), {
    plugins: [prismLanguagePlugin()],
    cacheDir: resolve(workspace, 'node_modules/.vite/client-e2e'),
    define: { BUILD_ENV: '"production"', 'process.env.BUILD_VERSION': '"client-e2e"' },
    // The scanner misses dependencies inside aliased Cherry source and the
    // Prism imports injected by its transform. Prebundle them before tests load.
    optimizeDeps: {
      entries: ['e2e/index.html'],
      include: [
        'mermaid',
        'pako',
        ...codeMirrorDeps,
        '@lezer/highlight',
        '@replit/codemirror-vim',
        'fast-diff',
        'virtual-dom/h',
        'virtual-dom/patch',
        'virtual-dom/diff',
        'htmlparser2',
        'mitt',
        'json5',
        'dompurify',
        ...prismImports,
      ],
    },
    resolve: {
      alias: [
        { find: /^cherry-markdown$/, replacement: resolve(workspace, 'packages/cherry-markdown/src/index.js') },
        { find: '@', replacement: resolve(workspace, 'packages/cherry-markdown/src') },
        { find: '@cherry', replacement: resolve(workspace, 'packages/cherry-markdown/src') },
      ],
    },
    server: {
      fs: {
        allow: [
          workspace,
          realpathSync(resolve(workspace, 'node_modules')),
          realpathSync(resolve(workspace, 'node_modules/cherry-markdown')),
        ],
      },
    },
  });
});
