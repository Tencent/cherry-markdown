import { transformAsync } from '@babel/core';
import { createRequire } from 'node:module';
// Keep this static so Vite tracks language changes through the shared module.
import languages from './prism-languages.json' with { type: 'json' };

const require = createRequire(import.meta.url);
const prismPlugin = require.resolve('babel-plugin-prismjs');
const prismCore = require.resolve('prismjs/components/prism-core.js').replace(/\\/g, '/');

// Build-time transforms shared by Cherry's Vite adapter and Milkdown's generator.
// Callers choose the language entry; dependency ordering and aliases stay in Babel.
export async function transformPrismLanguages(code, filename) {
  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    plugins: [[prismPlugin, { languages, plugins: [], css: false }]],
  });
  return result?.code ? { code: result.code, map: result.map } : null;
}

// Publish Prism in environments without window or Node global. Restrict the
// rewrite to the resolved core file and references without a local binding.
export async function transformPrismCore(code, id) {
  const filename = id.split('?')[0].replace(/\\/g, '/');
  if (filename !== prismCore) return null;
  const result = await transformAsync(code, {
    filename,
    babelrc: false,
    configFile: false,
    sourceMaps: true,
    plugins: [
      ({ types }) => ({
        visitor: {
          ReferencedIdentifier(path) {
            if (path.node.name === 'global' && !path.scope.getBinding('global')) {
              path.replaceWith(types.identifier('globalThis'));
            }
          },
        },
      }),
    ],
  });
  return result?.code ? { code: result.code, map: result.map } : null;
}
