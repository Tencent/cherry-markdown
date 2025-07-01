import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  prettierConfig,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: false,
      },
      globals: {
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
      'no-unused-vars': [
        'warn',
        {
          args: 'none',
        },
      ],
    },
  },
];