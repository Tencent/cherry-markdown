module.exports = {
  env: {
    browser: true,
    es6: true,
    'jest/globals': true,
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
  plugins: ['prettier', 'jest'],
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
      'warn',
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
