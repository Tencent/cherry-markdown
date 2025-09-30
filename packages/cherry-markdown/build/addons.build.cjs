const babel = require('@rollup/plugin-babel');
const resolve = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const eslint = require('@rollup/plugin-eslint');
const alias = require('@rollup/plugin-alias');
const json = require('@rollup/plugin-json');
const typescript = require('rollup-plugin-typescript2');

const { resolve: _resolve, join, dirname, basename, extname } = require('path');
const { mkdirSync, writeFileSync } = require('fs');

const glob = require('glob');

const { rollup: _rollup } = require('rollup');
const terser = require('@rollup/plugin-terser');
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
        eslint({
          exclude: ['**/node_modules/**', 'src/sass/**', 'src/libs/**'],
        }),
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
        }),
        babel({
          babelHelpers: 'runtime',
          exclude: [/node_modules[\\/](?!codemirror[\\/]src[\\/]|parse5)/],
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

