import { transformAsync } from '@babel/core';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
// A static import lets Vite reload the adapter when the supported languages change.
import languages from './prism-languages.json' with { type: 'json' };

const require = createRequire(import.meta.url);
const prismPlugin = require.resolve('babel-plugin-prismjs');
const prismEntry = fileURLToPath(new URL('../src/utils/prism.js', import.meta.url)).replace(/\\/g, '/');

// Share language injection across development, tests and all published bundles.
// Only the Prism entry needs this transform; UMD syntax compatibility stays in
// legacyUmdPlugin and other source/dependency modules are left to Vite.
/** @returns {import('vite').Plugin} */
export function prismLanguagePlugin() {
  return {
    name: 'cherry-prism-languages',
    enforce: 'pre',
    async transform(code, id) {
      const filename = id.split('?')[0].replace(/\\/g, '/');
      if (filename !== prismEntry) return null;
      const result = await transformAsync(code, {
        filename,
        babelrc: false,
        configFile: false,
        sourceMaps: true,
        plugins: [[prismPlugin, { languages, plugins: [], css: false }]],
      });
      return result?.code ? { code: result.code, map: result.map } : null;
    },
  };
}
