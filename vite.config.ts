import { defineConfig } from 'vite-plus';

export default defineConfig({
  check: {
    // Cherry Markdown intentionally keeps its existing Prettier/ESLint policy
    // during the Vite+ migration; Oxfmt would reformat the legacy codebase.
    fmt: false,
  },
  run: {
    cache: { scripts: false, tasks: true },
  },
  staged: {
    '*.{js,ts,tsx,vue,scss,css,json,md,mdx}': 'vp check --fix',
  },
});
