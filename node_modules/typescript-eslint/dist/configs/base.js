"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (plugin, parser) => ({
    name: 'typescript-eslint/base',
    languageOptions: {
        parser,
        sourceType: 'module',
    },
    plugins: {
        '@typescript-eslint': plugin,
    },
});
//# sourceMappingURL=base.js.map