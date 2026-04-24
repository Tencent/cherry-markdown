"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePropertyAccess = generatePropertyAccess;
const utils_1 = require("../utils");
const stringLiteralKey_1 = require("../utils/stringLiteralKey");
const interpolation_1 = require("./interpolation");
function* generatePropertyAccess(options, ctx, code, offset, features) {
    if (code.startsWith('[') && code.endsWith(']')) {
        yield* (0, interpolation_1.generateInterpolation)(options, ctx, options.template, features, code, offset);
    }
    else if (utils_1.identifierRegex.test(code)) {
        yield `.`;
        yield [code, 'template', offset, features];
    }
    else {
        yield `[`;
        yield* (0, stringLiteralKey_1.generateStringLiteralKey)(code, offset, features);
        yield `]`;
    }
}
//# sourceMappingURL=propertyAccess.js.map