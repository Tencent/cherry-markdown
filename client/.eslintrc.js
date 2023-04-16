module.exports = {
  env: {
    browser: true,
    es6: true,
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
  rules: {
    'prettier/prettier': 'error',
    // 不允许修改函数参数, 但允许修改函数参数中的属性
    'no-param-reassign': ['error', { props: false }],
    'no-unused-vars': [
      'warn',
      {
        args: 'none',
      },
    ],
  },
};
