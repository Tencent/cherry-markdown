// https://git.code.oa.com/standards/javascript/issues/73
module.exports = {
  rules: {
    // 降级为 推荐
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
    // 降级为 可选
    '@typescript-eslint/prefer-optional-chain': 'off',
    // 豁免
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-this-alias': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
    '@typescript-eslint/prefer-for-of': 'off',
    '@typescript-eslint/prefer-function-type': 'off',
  },
};
