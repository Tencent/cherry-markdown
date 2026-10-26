import { mergeConfig } from 'vite';

// Shared library output policy only. Entries, dependencies, runtime globals and
// format-specific compatibility remain with each package's build definition.
/**
 * @param {{ root: string, entry: string, file: string, format: 'es' | 'umd' | 'cjs', name?: string }} output
 * @param {import('vite').UserConfig} [overrides]
 * @returns {import('vite').UserConfig}
 */
export function createLibraryBuild({ root, entry, file, format, name }, overrides = {}) {
  return mergeConfig(
    {
      configFile: false,
      root,
      build: {
        emptyOutDir: false,
        target: 'es2015',
        minify: 'oxc',
        lib: { entry, formats: [format], fileName: () => file, name },
        rollupOptions: {
          output: { codeSplitting: false, manualChunks: undefined },
        },
      },
    },
    overrides,
  );
}
