import { fileURLToPath } from 'node:url';
import { transformPrismCore, transformPrismLanguages } from './prism.js';

const codeBlockEntry = fileURLToPath(new URL('../src/core/hooks/CodeBlock.js', import.meta.url)).replace(/\\/g, '/');

function prismGlobalPlugin() {
  return { name: 'cherry-prism-global', transform: transformPrismCore };
}

// Share language injection across development, tests and all published bundles.
// Only CodeBlock and the Prism core are transformed; UMD syntax compatibility stays
// in legacyUmdPlugin and other source/dependency modules are left to Vite.
/** @returns {import('vite').Plugin} */
export function prismLanguagePlugin() {
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
      if (filename !== codeBlockEntry) return transformPrismCore(code, id);
      return transformPrismLanguages(code, filename);
    },
  };
}
