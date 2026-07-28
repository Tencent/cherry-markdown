import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import resolvePlugin from '@rollup/plugin-node-resolve';
import { rollup } from 'rollup';

const demoRoot = import.meta.dirname;
const root = resolve(demoRoot, '../..');
const outputFile = resolve(root, 'examples/miniProgram/miniprogram/pages/index/index.js');

mkdirSync(resolve(outputFile, '..'), { recursive: true });

const bundle = await rollup({
  input: resolve(demoRoot, 'src/pages/index/index.js'),
  plugins: [
    resolvePlugin({
      browser: true,
      preferBuiltins: false,
      exportConditions: ['browser', 'import', 'default'],
    }),
  ],
});

await bundle.write({
  file: outputFile,
  format: 'cjs',
  exports: 'named',
});

await bundle.close();
