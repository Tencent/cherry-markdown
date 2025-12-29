import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';
import envReplacePlugin from './env.js';

import { resolve as _resolve, join, dirname, basename, extname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

import glob from 'glob';

import { rollup as _rollup } from 'rollup';
import terser from '@rollup/plugin-terser';
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = dirname(currentFilePath);
const PROJECT_ROOT_PATH = _resolve(currentDirPath, '../');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

glob(
  'src/addons/**/*-plugin.js',
  {
    cwd: PROJECT_ROOT_PATH,
  },
  async (error, matches) => {
    if (error) {
      throw error;
    }
    try {
      await buildAddons(matches);
    } catch (err) {
      console.error('[addons build] buildAddons failed:', err);
      process.exit(1);
    }
  },
);

/**
 *
 * @param {string[]} entries
 */
async function buildAddons(entries) {
  const ENABLE_PARALLEL = process.env.ENABLE_PARALLEL === 'true';

  async function buildOne(entry) {
    const fullEntryPath = _resolve(PROJECT_ROOT_PATH, entry);

    const outputFileName = fullEntryPath.replace(_resolve(PROJECT_ROOT_PATH, 'src/addons/'), '');
    const outputFile = join(PROJECT_ROOT_PATH, 'dist/addons', outputFileName);
    const declarationDir = dirname(outputFile);
    const inputFileName = basename(entry);
    const inputFileExt = extname(entry);
    const fileNameWithoutExt = inputFileName.replace(inputFileExt, ''); // 简单处理
    const camelCaseModuleName = fileNameWithoutExt
      .split('-')
      .map((segment) => segment.replace(/^./, (char) => char.toUpperCase()))
      .join('');

    // 创建基础插件配置
    const basePlugins = [
      ...(process.env.ENABLE_ESLINT === 'true'
        ? [
            eslint({
              exclude: ['**/node_modules/**', 'src/sass/**', 'src/libs/**'],
              throwOnError: false,
              throwOnWarning: false,
            }),
          ]
        : []),
      json(),
      envReplacePlugin(),
      alias({
        entries: [
          {
            find: '@',
            replacement: _resolve(PROJECT_ROOT_PATH, 'src'),
          },
        ],
      }),
      resolve({
        browser: true,
      }),
      typescript({
        include: ['*.js', '*.ts'],
        tsconfig: _resolve(PROJECT_ROOT_PATH, 'tsconfig.addons.json'),
        tsconfigOverride: {
          include: [fullEntryPath], // FIXME: 临时方案确保不会重复生成其他插件的 d.ts
          compilerOptions: {
            declaration: true,
            outDir: declarationDir,
          },
        },
      }),
    ];

    // 构建输出格式配置
    const formats = [
      {
        format: 'umd',
        file: outputFile,
        name: camelCaseModuleName,
        plugins: [
          ...basePlugins,
          commonjs({
            include: [/node_modules/, /src[\\/]libs/], // Default: undefined
            exclude: [/node_modules[\\/](lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/],
            extensions: ['.js'], // Default: [ '.js' ]
            ignoreGlobal: false, // Default: false
            sourceMap: !IS_PRODUCTION, // Default: true
            esmExternals: false, // 确保 UMD 格式正确处理 CommonJS
          }),
          babel({
            babelHelpers: 'runtime',
            exclude: [
              /node_modules[\\/](?!codemirror[\\/]src[\\/]|parse5|lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/,
            ],
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
          ...(IS_PRODUCTION ? [terser()] : []),
        ],
      },
      {
        format: 'es',
        file: outputFile.replace('.js', '.esm.js'),
        plugins: [
          ...basePlugins,
          commonjs({
            include: [/node_modules/, /src[\\/]libs/], // Default: undefined
            exclude: [/node_modules[\\/](lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/],
            extensions: ['.js'], // Default: [ '.js' ]
            ignoreGlobal: false, // Default: false
            sourceMap: !IS_PRODUCTION, // Default: true
            esmExternals: true, // ESM 格式应该使用 ES 模块外部依赖
          }),
          babel({
            babelHelpers: 'runtime',
            exclude: [
              /node_modules[\\/](?!codemirror[\\/]src[\\/]|parse5|lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/,
            ],
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
          ...(IS_PRODUCTION ? [terser()] : []),
        ],
      },
    ];

    // 生成多种格式的输出
    for (const formatConfig of formats) {
      console.log('[addons build] generating %s bundle %s', formatConfig.format, formatConfig.file);

      const rollupConfig = {
        input: fullEntryPath,
        plugins: formatConfig.plugins,
      };

      const addonBundle = await _rollup(rollupConfig);
      const { output: outputs } = await addonBundle.generate({
        format: formatConfig.format,
        file: formatConfig.file,
        name: formatConfig.name,
      });

      // 写入文件
      outputs.forEach((output) => {
        const fileNameOnly = basename(output.fileName);
        const targetDir = dirname(formatConfig.file);
        const targetPath = join(targetDir, fileNameOnly);

        console.log('[addons build] writing %s %s', output.type, targetPath);
        mkdirSync(targetDir, {
          recursive: true,
        });
        writeFileSync(targetPath, output.code || output.source || '', { encoding: 'utf-8' });
      });
    }

    // TODO: ts declaration 生成的目录不符合预期，以下为临时处理方案
    // 生成 TypeScript 声明文件（只生成一次，使用基础配置）
    try {
      const declarationRollupConfig = {
        input: fullEntryPath,
        plugins: [
          ...basePlugins,
          commonjs({
            include: [/node_modules/, /src[\\/]libs/],
            exclude: [/node_modules[\\/](lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/],
            extensions: ['.js'],
            ignoreGlobal: false,
            sourceMap: !IS_PRODUCTION,
            esmExternals: false,
          }),
          babel({
            babelHelpers: 'runtime',
            exclude: [
              /node_modules[\\/](?!codemirror[\\/]src[\\/]|parse5|lodash-es|d3-.*[\\/]src|d3[\\/]src|dagre-d3-es)/,
            ],
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
        ],
      };

      const declarationBundle = await _rollup(declarationRollupConfig);
      const { output: declarationOutputs } = await declarationBundle.generate({
        format: 'es',
        dir: declarationDir,
      });

      declarationOutputs.forEach((output) => {
        if (output.fileName.endsWith('.d.ts')) {
          const fileNameOnly = basename(output.fileName);
          const targetPath = join(declarationDir, fileNameOnly);
          console.log('[addons build] writing declaration %s', targetPath);
          mkdirSync(declarationDir, {
            recursive: true,
          });
          writeFileSync(targetPath, output.code || output.source || '', { encoding: 'utf-8' });
        }
      });
    } catch (error) {
      console.warn('[addons build] TypeScript declaration generation failed:', error.message);
    }
  }

  if (ENABLE_PARALLEL) {
    await Promise.all(entries.map((entry) => buildOne(entry)));
  } else {
    for (const entry of entries) {
      await buildOne(entry);
    }
  }
}
