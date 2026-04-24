"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIntersectMerge = generateIntersectMerge;
exports.generateSpreadMerge = generateSpreadMerge;
const index_1 = require("./index");
function* generateIntersectMerge(generates) {
    yield* generates[0];
    for (let i = 1; i < generates.length; i++) {
        yield ` & `;
        yield* generates[i];
    }
}
function* generateSpreadMerge(generates) {
    if (generates.length === 1) {
        yield* generates[0];
    }
    else {
        yield `{${index_1.newLine}`;
        for (const generate of generates) {
            yield `...`;
            yield* generate;
            yield `,${index_1.newLine}`;
        }
        yield `}`;
    }
}
//# sourceMappingURL=merge.js.map