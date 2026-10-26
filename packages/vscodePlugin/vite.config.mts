import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfig } from 'vite-plus';

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const webviewDist = path.resolve(packageRoot, 'web-resources/dist');

const extensionConfig: UserConfig = {
  resolve: {
    conditions: ['node'],
    mainFields: ['module', 'main'],
  },
  ssr: {
    target: 'node',
    noExternal: ['axios'],
  },
  build: {
    target: 'node16',
    outDir: path.resolve(packageRoot, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    minify: 'oxc',
    lib: {
      entry: path.resolve(packageRoot, 'src/extension.ts'),
      formats: ['cjs'],
      fileName: () => 'extension.js',
    },
    rolldownOptions: {
      external: (id) => id === 'vscode' || id.startsWith('node:') || builtinModules.includes(id),
      output: {
        codeSplitting: false,
      },
    },
  },
};

const webviewConfig: UserConfig = {
  base: './',
  resolve: {
    alias: [
      {
        find: /^cherry-markdown$/,
        replacement: path.resolve(packageRoot, '../cherry-markdown/dist/cherry-markdown.esm.js'),
      },
      {
        find: 'cherry-markdown/dist/cherry-markdown.min.css',
        replacement: path.resolve(packageRoot, '../cherry-markdown/dist/cherry-markdown.min.css'),
      },
    ],
  },
  build: {
    target: 'chrome102',
    outDir: webviewDist,
    emptyOutDir: true,
    sourcemap: false,
    minify: 'oxc',
    assetsInlineLimit: 0,
    rolldownOptions: {
      input: path.resolve(packageRoot, 'web-resources/scripts/index.ts'),
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: '[name].js',
        assetFileNames: ({ names }) => {
          const name = names[0] ?? '';
          if (name.endsWith('.css')) return 'index.css';
          if (/\.(?:eot|ttf|woff2?)$/i.test(name)) return 'fonts/[name][extname]';
          return 'assets/[name][extname]';
        },
        codeSplitting: {
          groups: [
            { name: 'mathjax', test: /\/mathjax\//, priority: 20 },
            { name: 'html-to-image', test: /\/html-to-image\//, priority: 10 },
          ],
        },
      },
    },
  },
};

export default defineConfig(({ mode }) => {
  if (mode === 'extension' || mode === 'development') return extensionConfig;
  if (mode === 'webview') return webviewConfig;
  throw new Error(`Unsupported VS Code plugin build mode: ${mode}`);
});
