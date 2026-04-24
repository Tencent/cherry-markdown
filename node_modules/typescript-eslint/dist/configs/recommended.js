"use strict";
// THIS CODE WAS AUTOMATICALLY GENERATED
// DO NOT EDIT THIS CODE BY HAND
// SEE https://typescript-eslint.io/users/configs
//
// For developers working in the typescript-eslint monorepo:
// You can regenerate it using `yarn generate:configs`
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = __importDefault(require("./base"));
const eslint_recommended_1 = __importDefault(require("./eslint-recommended"));
exports.default = (plugin, parser) => [
    (0, base_1.default)(plugin, parser),
    (0, eslint_recommended_1.default)(plugin, parser),
    {
        name: 'typescript-eslint/recommended',
        rules: {
            '@typescript-eslint/ban-ts-comment': 'error',
            '@typescript-eslint/ban-types': 'error',
            'no-array-constructor': 'off',
            '@typescript-eslint/no-array-constructor': 'error',
            '@typescript-eslint/no-duplicate-enum-values': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-extra-non-null-assertion': 'error',
            'no-loss-of-precision': 'off',
            '@typescript-eslint/no-loss-of-precision': 'error',
            '@typescript-eslint/no-misused-new': 'error',
            '@typescript-eslint/no-namespace': 'error',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
            '@typescript-eslint/no-this-alias': 'error',
            '@typescript-eslint/no-unnecessary-type-constraint': 'error',
            '@typescript-eslint/no-unsafe-declaration-merging': 'error',
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-var-requires': 'error',
            '@typescript-eslint/prefer-as-const': 'error',
            '@typescript-eslint/triple-slash-reference': 'error',
        },
    },
];
//# sourceMappingURL=recommended.js.map