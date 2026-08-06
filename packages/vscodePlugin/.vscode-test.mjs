import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'out/test/**/*.integration.js',
  extensionDevelopmentPath: '.',
  version: '1.131.0',
  useInstallation: process.env.CHERRY_VSCODE_TEST_EXECUTABLE
    ? { fromPath: process.env.CHERRY_VSCODE_TEST_EXECUTABLE }
    : undefined,
  launchArgs: ['--disable-extensions'],
  mocha: {
    timeout: 20_000,
  },
});
