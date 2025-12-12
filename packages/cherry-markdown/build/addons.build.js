import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import eslint from '@rollup/plugin-eslint';
import alias from '@rollup/plugin-alias';
import json from '@rollup/plugin-json';
import typescript from 'rollup-plugin-typescript2';

import { resolve as _resolve, join, dirname, basename, extname } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';

import glob from 'glob';

import { rollup as _rollup } from 'rollup';
import terser from '@rollup/plugin-terser';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT_PATH = _resolve(__dirname, '../');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

glob(
  'src/addons/**/*-plugin.js',
  {
    cwd: PROJECT_ROOT_PATH,
  },
  (error, matches) => {
    if (error) {
      throw error;
    }
    buildAddons(matches);
  },
);

/**
 *
 * @param {string[]} entries
 */
function buildAddons(entries) {
  entries.forEach(async (entry) => {
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

    const addonBundle = await _rollup({
      input: fullEntryPath,
      plugins: [
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
        // envReplacePlugin(),
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
            // outDir: declarationDir,
          },
        }),
        commonjs({
          include: [/node_modules/, /src[\\/]libs/], // Default: undefined
          extensions: ['.js'], // Default: [ '.js' ]
          ignoreGlobal: false, // Default: false
          sourceMap: !IS_PRODUCTION, // Default: true
          esmExternals: false, // 确保 UMD 格式正确处理 CommonJS
        }),
        babel({
          babelHelpers: 'runtime',
          exclude: [/node_modules[\\/](?!codemirror[\\/]src[\\/]|parse5)/],
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
    });

    console.log('[addons build] generating bundle %s', outputFile);

    // generate code and a sourcemap
    const { output: outputs } = await addonBundle.generate({
      // dir: declarationDir,
      file: outputFile,
      format: 'umd',
      name: camelCaseModuleName,
      plugins: [terser()],
    });

    // TODO: ts declaration 生成的目录不符合预期，以下为临时处理方案
    outputs.forEach((output) => {
      const fileNameOnly = basename(output.fileName);
      const targetPath = join(declarationDir, fileNameOnly);
      console.log('[addons build] writing %s %s', output.type, targetPath);
      mkdirSync(declarationDir, {
        recursive: true,
      });
      writeFileSync(targetPath, output.code || output.source || '', { encoding: 'utf-8' });
    });
  });
}
