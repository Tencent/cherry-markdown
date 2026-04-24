module.exports = {
  extends: 'eslint:recommended',
  parserOptions: {
    sourceType: 'script',
    modules: true,
  },
  env: {
    es6: true,
    node: true,
    jest: true,
    mocha: true,
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'error',
  },
};
