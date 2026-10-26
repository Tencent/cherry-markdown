import { mergeConfig } from 'vite';

// Browser-like unit tests share defaults; package paths, setup and coverage
// boundaries remain explicit in each package. Node extension tests stay separate.
/** @param {import('vite-plus').UserConfig} overrides */
export function createBrowserTestConfig(overrides) {
  return mergeConfig(
    {
      test: {
        globals: true,
        environment: 'jsdom',
        ...(overrides.test?.coverage ? { coverage: { reporter: ['text', 'json', 'html'] } } : {}),
      },
    },
    overrides,
  );
}
