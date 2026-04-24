"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCamelized = generateCamelized;
const shared_1 = require("@vue/shared");
function* generateCamelized(code, source, offset, features) {
    const parts = code.split('-');
    const combineToken = features.__combineToken ?? Symbol();
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part !== '') {
            if (i === 0) {
                yield [
                    part,
                    source,
                    offset,
                    { ...features, __combineToken: combineToken },
                ];
            }
            else {
                yield [
                    (0, shared_1.capitalize)(part),
                    source,
                    offset,
                    { __combineToken: combineToken },
                ];
            }
        }
        offset += part.length + 1;
    }
}
//# sourceMappingURL=camelized.js.map