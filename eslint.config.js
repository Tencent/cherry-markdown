import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import babelParser from '@babel/eslint-parser';
import globals from 'globals';

export default [
  // 忽略文件配置
  {
    ignores: [
      'dist/**',
      '**/dist/**',
      'node_modules/**',
      '**/node_modules/**',
      'src/sass/**',
      '**/*.css',
      'src/libs/*.js',
      'example-applications/**',
      'examples/**',
      'client/**',
      'vscodePlugin/**',
      'docs/**',
      'packages/cherry-markdown/src/libs/*.js',
    ],
  },
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        BUILD_ENV: 'readonly',
        process: 'readonly',
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
