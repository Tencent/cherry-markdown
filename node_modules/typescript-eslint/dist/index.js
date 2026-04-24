"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = exports.parser = exports.configs = exports.config = void 0;
const eslint_plugin_1 = __importDefault(require("@typescript-eslint/eslint-plugin"));
const parserBase = __importStar(require("@typescript-eslint/parser"));
const config_helper_1 = require("./config-helper");
Object.defineProperty(exports, "config", { enumerable: true, get: function () { return config_helper_1.config; } });
const all_1 = __importDefault(require("./configs/all"));
const base_1 = __importDefault(require("./configs/base"));
const disable_type_checked_1 = __importDefault(require("./configs/disable-type-checked"));
const eslint_recommended_1 = __importDefault(require("./configs/eslint-recommended"));
const recommended_1 = __importDefault(require("./configs/recommended"));
const recommended_type_checked_1 = __importDefault(require("./configs/recommended-type-checked"));
const recommended_type_checked_only_1 = __importDefault(require("./configs/recommended-type-checked-only"));
const strict_1 = __importDefault(require("./configs/strict"));
const strict_type_checked_1 = __importDefault(require("./configs/strict-type-checked"));
const strict_type_checked_only_1 = __importDefault(require("./configs/strict-type-checked-only"));
const stylistic_1 = __importDefault(require("./configs/stylistic"));
const stylistic_type_checked_1 = __importDefault(require("./configs/stylistic-type-checked"));
const stylistic_type_checked_only_1 = __importDefault(require("./configs/stylistic-type-checked-only"));
const parser = {
    meta: parserBase.meta,
    parseForESLint: parserBase.parseForESLint,
};
exports.parser = parser;
/*
we could build a plugin object here without the `configs` key - but if we do
that then we create a situation in which
```
require('typescript-eslint').plugin !== require('@typescript-eslint/eslint-plugin')
```

This is bad because it means that 3rd party configs would be required to use
`typescript-eslint` or else they would break a user's config if the user either
used `tseslint.configs.recomended` et al or
```
{
  plugins: {
    '@typescript-eslint': tseslint.plugin,
  },
}
```

This might be something we could consider okay (eg 3rd party flat configs must
use our new package); however legacy configs consumed via `@eslint/eslintrc`
would never be able to satisfy this constraint and thus users would be blocked
from using them.
*/
const plugin = eslint_plugin_1.default;
exports.plugin = plugin;
const configs = {
    all: (0, all_1.default)(plugin, parser),
    base: (0, base_1.default)(plugin, parser),
    disableTypeChecked: (0, disable_type_checked_1.default)(plugin, parser),
    eslintRecommended: (0, eslint_recommended_1.default)(plugin, parser),
    recommended: (0, recommended_1.default)(plugin, parser),
    recommendedTypeChecked: (0, recommended_type_checked_1.default)(plugin, parser),
    recommendedTypeCheckedOnly: (0, recommended_type_checked_only_1.default)(plugin, parser),
    strict: (0, strict_1.default)(plugin, parser),
    strictTypeChecked: (0, strict_type_checked_1.default)(plugin, parser),
    strictTypeCheckedOnly: (0, strict_type_checked_only_1.default)(plugin, parser),
    stylistic: (0, stylistic_1.default)(plugin, parser),
    stylisticTypeChecked: (0, stylistic_type_checked_1.default)(plugin, parser),
    stylisticTypeCheckedOnly: (0, stylistic_type_checked_only_1.default)(plugin, parser),
};
exports.configs = configs;
/*
eslint-disable-next-line import/no-default-export --
we do both a default and named exports to allow people to use this package from
both CJS and ESM in very natural ways.

EG it means that all of the following are valid:

```ts
import tseslint from 'typescript-eslint';

export default tseslint.config(
  ...tseslint.configs.recommended,
);
```
```ts
import { config, parser, plugin } from 'typescript-eslint';

export default config(
  {
    languageOptions: { parser }
    plugins: { ts: plugin },
  }
);
```
```ts
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  ...tseslint.configs.recommended,
);
```
```ts
const { config, parser, plugin } = require('typescript-eslint');

module.exports = config(
  {
    languageOptions: { parser }
    plugins: { ts: plugin },
  }
);
```
*/
exports.default = {
    config: config_helper_1.config,
    configs,
    parser,
    plugin,
};
//# sourceMappingURL=index.js.map