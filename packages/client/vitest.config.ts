import { createBrowserTestConfig } from '../../build/test.mjs';

export default createBrowserTestConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
