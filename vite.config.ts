import { defineConfig } from 'vite-plus';

export default defineConfig({
  check: {
    fmt: false,
  },
  run: {
    cache: { scripts: false, tasks: true },
  },
  staged: {
    '*.{js,ts,tsx,vue,scss,css,json,md,mdx}': 'vp check --fix',
  },
});
