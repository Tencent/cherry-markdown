/**
 * 构建 @cherry-markdown/plugin-searcher 的 UMD / ESM 发版产物
 *
 * 将 @cherry/* 解析为 cherry-markdown 源码并打包，供 npm 发布使用。
 */
import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import { rollup } from 'rollup';
import { mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { dirname, join, resolve as pathResolve } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = pathResolve(currentDir, '..');
const cherrySrc = pathResolve(packageRoot, '../../packages/cherry-markdown/src');
const distDir = join(packageRoot, 'dist');
const inputFile = join(packageRoot, 'src/index.js');
const umdName = 'CherrySearcherPlugin';

async function build() {
  mkdirSync(distDir, { recursive: true });

  const bundle = await rollup({
    input: inputFile,
    plugins: [
      json(),
      alias({
        entries: [
          {
            find: '@',
            replacement: cherrySrc,
          },
          {
            find: '@cherry',
            replacement: cherrySrc,
          },
        ],
      }),
      resolve({ browser: true }),
      commonjs({
        include: [/node_modules/],
        extensions: ['.js'],
      }),
      babel({
        babelHelpers: 'runtime',
        babelrc: false,
        configFile: false,
        exclude: [/node_modules[\\/](?!lodash)/],
        presets: [['@babel/preset-env', { modules: false }]],
        plugins: [
          ['@babel/plugin-transform-runtime', { corejs: 3 }],
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          '@babel/plugin-proposal-class-properties',
          '@babel/plugin-proposal-nullish-coalescing-operator',
          '@babel/plugin-proposal-optional-chaining',
        ],
      }),
    ],
  });

  const umdOutput = await bundle.generate({
    format: 'umd',
    name: umdName,
    exports: 'named',
    plugins: [terser()],
  });

  const esmOutput = await bundle.generate({
    format: 'esm',
    plugins: [terser()],
  });

  writeFileSync(join(distDir, 'cherry-searcher-plugin.js'), umdOutput.output[0].code, 'utf-8');
  writeFileSync(join(distDir, 'cherry-searcher-plugin.esm.js'), esmOutput.output[0].code, 'utf-8');

  copyFileSync(join(packageRoot, 'types/index.d.ts'), join(distDir, 'index.d.ts'));

  console.log('[plugin-searcher build] wrote dist/cherry-searcher-plugin.js');
  console.log('[plugin-searcher build] wrote dist/cherry-searcher-plugin.esm.js');
  console.log('[plugin-searcher build] wrote dist/index.d.ts');
}

build().catch((error) => {
  console.error('[plugin-searcher build] failed:', error);
  process.exit(1);
});
