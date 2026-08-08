import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfig } from 'vite';

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
    minify: 'esbuild',
    lib: {
      entry: path.resolve(packageRoot, 'src/extension.ts'),
      formats: ['cjs'],
      fileName: () => 'extension.js',
    },
    rollupOptions: {
      external: (id) => id === 'vscode' || id.startsWith('node:') || builtinModules.includes(id),
      output: {
        inlineDynamicImports: true,
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
    minify: 'esbuild',
    assetsInlineLimit: 0,
    rollupOptions: {
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
        manualChunks: (id) => {
          if (id.includes('/mathjax/')) return 'mathjax';
          if (id.includes('/html-to-image/')) return 'html-to-image';
          return undefined;
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
