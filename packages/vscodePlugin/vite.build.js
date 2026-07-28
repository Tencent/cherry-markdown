import { build } from 'vite';
import { resolve } from 'node:path';
import { rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const extensionDist = resolve(root, 'dist');
const webviewDist = resolve(root, 'web-resources/dist');

await build({
  configFile: false,
  root,
  build: {
    outDir: extensionDist,
    emptyOutDir: true,
    target: 'es2020',
    minify: process.env.NODE_ENV === 'production',
    lib: {
      entry: resolve(root, 'src/extension.ts'),
      formats: ['cjs'],
      fileName: () => 'extension.cjs',
    },
    rollupOptions: {
      external: ['vscode'],
      output: {
        format: 'cjs',
        entryFileNames: 'extension.cjs',
        codeSplitting: false,
        manualChunks: undefined,
        exports: 'auto',
      },
    },
    ssr: true,
  },
});

await build({
  configFile: false,
  root,
  resolve: {
    alias: [
      {
        find: 'cherry-markdown-core/dist/cherry-markdown.min.css',
        replacement: resolve(root, '../cherry-markdown/dist/cherry-markdown.min.css'),
      },
      { find: 'cherry-markdown-core', replacement: resolve(root, '../cherry-markdown/dist/cherry-markdown.esm.js') },
    ],
  },
  build: {
    outDir: webviewDist,
    emptyOutDir: true,
    target: 'es2015',
    minify: process.env.NODE_ENV === 'production',
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      input: resolve(root, 'web-resources/scripts/index.js'),
      external: [],
      output: {
        format: 'iife',
        name: 'CherryMarkdownWebview',
        entryFileNames: 'index.js',
        codeSplitting: false,
        manualChunks: undefined,
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});

await rename(resolve(webviewDist, 'assets/style.css'), resolve(webviewDist, 'index.css'));
