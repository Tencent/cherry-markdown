import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, mergeConfig } from 'vite-plus';
import clientConfig from './vite.config';
import { prismLanguagePlugin } from '../cherry-markdown/build/prism.plugin.js';

const workspace = resolve(import.meta.dirname, '../..');
export default defineConfig(async (env) =>
  mergeConfig(await (typeof clientConfig === 'function' ? clientConfig(env) : clientConfig), {
    plugins: [prismLanguagePlugin()],
    define: { BUILD_ENV: '"production"', 'process.env.BUILD_VERSION': '"client-e2e"' },
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
  }),
);
