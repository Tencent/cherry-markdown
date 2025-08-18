module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['eslint-config-tencent', 'plugin:prettier/recommended'],
  globals: {
    BUILD_ENV: 'readonly',
    process: 'readonly',
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: '@typescript-eslint/parser',
      plugins: ['@typescript-eslint', 'prettier'],
      extends: ['eslint-config-tencent', 'plugin:prettier/recommended'],
      rules: {
        'prettier/prettier': 'error',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            args: 'none',
          },
        ],
        'no-unused-vars': 'off',
        camelcase: 'off',
        'no-underscore-dangle': 'off',
      },
    },
    {
      files: ['**/*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      plugins: ['@typescript-eslint', 'prettier'],
      extends: ['eslint-config-tencent', 'plugin:prettier/recommended'],
      rules: {
        'prettier/prettier': 'error',
        camelcase: 'off',
        'no-underscore-dangle': 'off',
      },
    },
  ],
  rules: {
    'prettier/prettier': 'error',
    // curly: 'error',
    // 'brace-style': ['error', '1tbs'],
    // 不允许修改函数参数, 但允许修改函数参数中的属性
    'no-param-reassign': ['error', { props: false }],
    // indent: ['error', 4],
    // // 'max-len': ['error', { code: 100 }],
    // 'linebreak-style': ['error', 'unix'],
    // quotes: ['error', 'single'],
    // semi: ['error', 'always'],
    'no-unused-vars': [
      'error',
      {
        args: 'none',
      },
    ],
    // 'comma-dangle': [
    //     'warn',
    //     {
    //         arrays: 'only-multiline',
    //         objects: 'only-multiline',
    //         imports: 'never',
    //         exports: 'never',
    //         functions: 'never',
    //     },
    // ],
  },
};
