import { transformAsync } from '@babel/core';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
// A static import lets Vite reload the adapter when the supported languages change.
import languages from './prism-languages.json' with { type: 'json' };

const require = createRequire(import.meta.url);
const prismPlugin = require.resolve('babel-plugin-prismjs');
const codeBlockEntry = fileURLToPath(new URL('../src/core/hooks/CodeBlock.js', import.meta.url)).replace(/\\/g, '/');
const prismCore = require.resolve('prismjs/components/prism-core.js').replace(/\\/g, '/');

// Prism's language components need its core to publish a global instance even
// when neither window nor Node global exists. Limit this compatibility rewrite
// to the resolved core file and to references without a local binding.
function prismGlobalPlugin() {
  return {
    name: 'cherry-prism-global',
    async transform(code, id) {
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
    },
  };
}

// Share language injection across development, tests and all published bundles.
// Only CodeBlock and the Prism core are transformed; UMD syntax compatibility stays
// in legacyUmdPlugin and other source/dependency modules are left to Vite.
/** @returns {import('vite').Plugin} */
export function prismLanguagePlugin() {
  const globalPlugin = prismGlobalPlugin();
  return {
    name: 'cherry-prism-languages',
    enforce: 'pre',
    config() {
      // Dependency prebundling has its own plugin pipeline. Use the same scoped
      // transform there rather than defining global for every dependency.
      return { optimizeDeps: { rolldownOptions: { plugins: [prismGlobalPlugin()] } } };
    },
    async transform(code, id) {
      const filename = id.split('?')[0].replace(/\\/g, '/');
      if (filename !== codeBlockEntry) return globalPlugin.transform(code, id);
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
