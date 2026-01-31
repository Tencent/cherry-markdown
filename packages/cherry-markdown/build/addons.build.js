import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import { resolve as _resolve, join, dirname, basename, extname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import glob from 'glob';
import { rollup as _rollup } from 'rollup';
import { createTerserPlugin } from './terser.config.js';
import os from 'os';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilePath);
const PROJECT_ROOT_PATH = _resolve(currentDir, '../');
const CPU_COUNT = os.cpus().length;

glob(
  'src/addons/**/*-plugin.js',
  {
    cwd: PROJECT_ROOT_PATH,
  },
  async (error, matches) => {
    if (error) throw error;
    await buildAddonsParallel(matches);
  },
);

// 优化：并行构建所有 addons，输出 ESM/UMD 两种格式，类型声明输出到 dist/addons/types
async function buildAddonsParallel(entries) {
  if (!entries.length) return;
  const limit = Math.min(entries.length, Math.max(2, CPU_COUNT));
  const errors = [];

  async function worker(queue) {
    for (const entry of queue) {
      try {
        await buildAddon(entry);
      } catch (error) {
        errors.push({ entry, error });
        console.error(`[addons build] Failed to build ${entry}:`, error);
      }
    }
  }

  const chunkSize = Math.ceil(entries.length / limit);
  const chunks = Array.from({ length: limit }, (_, i) => entries.slice(i * chunkSize, (i + 1) * chunkSize));

  await Promise.all(chunks.map((chunk) => worker(chunk)));

  if (errors.length) {
    throw new Error(`${errors.length} build(s) failed`);
  }
}

async function buildAddon(entry) {
  const fullEntryPath = _resolve(PROJECT_ROOT_PATH, entry);
  const outputFileName = fullEntryPath.replace(_resolve(PROJECT_ROOT_PATH, 'src/addons/'), '');
  const outputDir = join(PROJECT_ROOT_PATH, 'dist/addons', dirname(outputFileName));
  const inputFileName = basename(entry);
  const inputFileExt = extname(entry);
  const fileNameWithoutExt = inputFileName.replace(inputFileExt, '');
  const camelCaseModuleName = fileNameWithoutExt
    .split('-')
    .map((segment) => segment.replace(/^./, (char) => char.toUpperCase()))
    .join('');

  // 创建 terser 插件（UMD 和 ESM 使用不同配置）
  const terserUMD = createTerserPlugin({ isESM: false });
  const terserESM = createTerserPlugin({ isESM: true });

  const basePlugins = [
    json(),
    alias({
      entries: [
        {
          find: '@',
          replacement: _resolve(PROJECT_ROOT_PATH, 'src'),
        },
      ],
    }),
    resolve({ browser: true }),
    commonjs({
      include: [/node_modules/, /src[\\/]libs/],
      extensions: ['.js'],
      ignoreGlobal: false,
      sourceMap: false,
    }),
    babel({
      babelHelpers: 'runtime',
      exclude: /node_modules[\\/](?!(codemirror[\\/]src|parse5))/,
      babelrc: false,
      configFile: false,
      presets: [['@babel/preset-env', { modules: false }]],
      plugins: [
        ['@babel/plugin-transform-runtime', { corejs: 3 }],
        ['@babel/plugin-proposal-decorators', { legacy: true }],
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-nullish-coalescing-operator',
        '@babel/plugin-proposal-optional-chaining',
      ],
    }),
  ];

  // 输出 UMD 和 ESM 两种格式
  let bundle;
  try {
    bundle = await _rollup({
      input: fullEntryPath,
      plugins: basePlugins,
    });

    // UMD 格式 (.js)
    const umdFile = join(PROJECT_ROOT_PATH, 'dist/addons', outputFileName);
    const { output: umdOutputs } = await bundle.generate({
      file: umdFile,
      format: 'umd',
      name: camelCaseModuleName,
      sourcemap: true,
      plugins: [terserUMD],
    });
    await writeOutputs(umdOutputs, outputDir);

    // ESM 格式 (.esm.js)
    const esmFileName = outputFileName.replace(inputFileExt, '.esm.js');
    const esmFile = join(PROJECT_ROOT_PATH, 'dist/addons', esmFileName);
    const { output: esmOutputs } = await bundle.generate({
      file: esmFile,
      format: 'es',
      sourcemap: true,
      plugins: [terserESM],
    });
    await writeOutputs(esmOutputs, outputDir);
  } finally {
    if (bundle) await bundle.close();
  }
}

async function writeOutputs(outputs, outputDir) {
  if (outputs.length === 0) return;
  mkdirSync(outputDir, { recursive: true });

  outputs.forEach((output) => {
    if (!output.fileName) return;
    const fileNameOnly = basename(output.fileName);
    const targetPath = join(outputDir, fileNameOnly);
    writeFileSync(targetPath, output.code || output.source || '', { encoding: 'utf-8' });
    console.log('[addons build] writing %s %s', output.type, targetPath);
  });
}
