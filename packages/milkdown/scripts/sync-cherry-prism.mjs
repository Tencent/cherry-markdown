import { transformAsync } from '@babel/core';
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prismLanguagePlugin } from '../../cherry-markdown/build/prism.plugin.js';
import languages from '../../cherry-markdown/build/prism-languages.json' with { type: 'json' };

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cherryRoot = resolve(root, '../cherry-markdown');
const generated = resolve(root, 'src/generated');
const name = 'cherry-prism';

if (process.argv.includes('--dist')) {
  const destination = resolve(root, 'dist/generated');
  mkdirSync(destination, { recursive: true });
  for (const extension of ['js', 'd.ts'])
    copyFileSync(resolve(generated, `${name}.${extension}`), resolve(destination, `${name}.${extension}`));
} else {
  // Use Cherry's language source and the same dependency/alias loader, rather
  // than maintain a second list or manually order Prism component imports.
  const require = createRequire(new URL('../../cherry-markdown/package.json', import.meta.url));
  const entry = await transformAsync("import Prism from 'prismjs'; Prism.manual = true; export default Prism;", {
    filename: 'cherry-prism-entry.js',
    babelrc: false,
    configFile: false,
    plugins: [[require.resolve('babel-plugin-prismjs'), { languages, plugins: [], css: false }]],
  });
  if (!entry?.code) throw new Error('Cherry Prism language loading produced no entry.');
  const cherryPlugin = prismLanguagePlugin();
  const result = await build({
    absWorkingDir: root,
    stdin: { contents: entry.code, resolveDir: cherryRoot, sourcefile: 'cherry-prism-entry.js' },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    legalComments: 'inline',
    plugins: [
      {
        name: 'cherry-prism-runtime',
        setup(builder) {
          // Reuse Cherry's scoped globalThis compatibility transform. Nothing
          // from the Cherry editor or its build plugins enters the output.
          builder.onLoad({ filter: /[/\\]prism-core\.js$/ }, async ({ path }) => {
            const source = readFileSync(path, 'utf8');
            const transformed = await cherryPlugin.transform(source, path);
            return { contents: transformed?.code ?? source, loader: 'js' };
          });
        },
      },
    ],
  });
  mkdirSync(generated, { recursive: true });
  writeFileSync(
    resolve(generated, `${name}.js`),
    `// Generated from Cherry Prism configuration by sync-cherry-prism.mjs. Do not edit.
/*! PrismJS license:
${readFileSync(require.resolve('prismjs/LICENSE'), 'utf8')}
*/
${result.outputFiles[0].text}`,
  );
}
