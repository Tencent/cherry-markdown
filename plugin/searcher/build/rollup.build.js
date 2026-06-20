/**
 * 构建 @cherry-markdown/plugin-searcher（原生 ES Module，无 Babel 转译）
 */
import * as sass from 'sass';
import terser from '@rollup/plugin-terser';
import { rollup } from 'rollup';
import { mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { dirname, join, resolve as pathResolve } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = pathResolve(currentDir, '..');
const distDir = join(packageRoot, 'dist');
const inputFile = join(packageRoot, 'src/index.js');
const umdName = 'SearcherPanel';

async function build() {
  mkdirSync(distDir, { recursive: true });

  const bundle = await rollup({
    input: inputFile,
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

  writeFileSync(join(distDir, 'searcher.js'), umdOutput.output[0].code, 'utf-8');
  writeFileSync(join(distDir, 'searcher.esm.js'), esmOutput.output[0].code, 'utf-8');

  copyFileSync(join(packageRoot, 'types/index.d.ts'), join(distDir, 'index.d.ts'));
  copyFileSync(join(packageRoot, 'types/searcher.types.d.ts'), join(distDir, 'searcher.types.d.ts'));
  copyFileSync(join(packageRoot, 'types/styles.d.ts'), join(distDir, 'styles.d.ts'));

  const stylesDir = join(packageRoot, 'styles');
  mkdirSync(stylesDir, { recursive: true });
  copyFileSync(join(packageRoot, 'src/styles/searcher.scss'), join(stylesDir, 'searcher.scss'));

  const cssResult = sass.compile(join(packageRoot, 'src/styles/searcher.scss'), {
    loadPaths: [pathResolve(packageRoot, '../../node_modules')],
    style: 'expanded',
  });
  writeFileSync(join(distDir, 'searcher.css'), cssResult.css, 'utf-8');

  console.log('[plugin-searcher build] wrote dist/searcher.js (UMD)');
  console.log('[plugin-searcher build] wrote dist/searcher.esm.js (ESM)');
  console.log('[plugin-searcher build] wrote dist/index.d.ts');
  console.log('[plugin-searcher build] wrote dist/searcher.types.d.ts');
  console.log('[plugin-searcher build] wrote styles/searcher.scss');
  console.log('[plugin-searcher build] wrote dist/searcher.css');
}

build().catch((error) => {
  console.error('[plugin-searcher build] failed:', error);
  process.exit(1);
});
