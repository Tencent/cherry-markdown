import { transformAsync } from '@babel/core';

/**
 * Preserve the ES5 syntax contract of the historical UMD browser bundles.
 *
 * Vite/esbuild no longer downlevels library output to ES5, so the final UMD
 * chunk receives a Babel pass. ESM output intentionally keeps modern syntax.
 */
export function legacyUmdPlugin() {
  return {
    name: 'cherry-legacy-umd',
    async generateBundle(outputOptions, bundle) {
      if (outputOptions.format !== 'umd') {
        return;
      }

      const babelOptions = {
        babelrc: false,
        configFile: false,
        comments: false,
        compact: true,
        sourceMaps: false,
        presets: [
          [
            '@babel/preset-env',
            {
              bugfixes: true,
              modules: false,
              targets: { ie: '11' },
            },
          ],
        ],
      };

      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') {
          continue;
        }

        const firstPass = await transformAsync(output.code, babelOptions);
        const result = firstPass?.code
          ? await transformAsync(firstPass.code, {
              babelrc: false,
              configFile: false,
              comments: false,
              compact: true,
              sourceMaps: false,
              plugins: [
                '@babel/plugin-transform-shorthand-properties',
                '@babel/plugin-transform-template-literals',
              ],
            })
          : null;

        if (result?.code) {
          output.code = result.code;
          output.map = null;
        }
      }
    },
  };
}
