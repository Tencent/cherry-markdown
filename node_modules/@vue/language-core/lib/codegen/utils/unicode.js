"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUnicode = generateUnicode;
const boundary_1 = require("./boundary");
function* generateUnicode(code, offset, info) {
    if (needToUnicode(code)) {
        const token = yield* (0, boundary_1.startBoundary)('template', offset, info);
        yield toUnicode(code);
        yield (0, boundary_1.endBoundary)(token, offset + code.length);
    }
    else {
        yield [code, 'template', offset, info];
    }
}
function needToUnicode(str) {
    return str.includes('\\') || str.includes('\n');
}
function toUnicode(str) {
    return str.split('').map(value => {
        const temp = value.charCodeAt(0).toString(16).padStart(4, '0');
        if (temp.length > 2) {
            return '\\u' + temp;
        }
        return value;
    }).join('');
}
//# sourceMappingURL=unicode.js.map