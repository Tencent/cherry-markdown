"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStringLiteralKey = generateStringLiteralKey;
const boundary_1 = require("./boundary");
function* generateStringLiteralKey(code, offset, info) {
    if (offset === undefined || !info) {
        yield `'${code}'`;
    }
    else {
        const token = yield* (0, boundary_1.startBoundary)('template', offset, info);
        yield `'`;
        yield [code, 'template', offset, { __combineToken: token }];
        yield `'`;
        yield (0, boundary_1.endBoundary)(token, offset + code.length);
    }
}
//# sourceMappingURL=stringLiteralKey.js.map