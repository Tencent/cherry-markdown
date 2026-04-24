module.exports = {
  extends: ['./index.js'],
  globals: {
    Prism: false,
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: ['./ts.js'],
      parserOptions: {
        sourceType: 'module',
        project: [
          './tsconfig.json',
        ],
        tsconfigRootDir: __dirname,
        ecmaVersion: 2018,
      },
    },
  ],
};
