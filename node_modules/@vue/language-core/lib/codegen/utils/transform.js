"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replace = replace;
exports.insert = insert;
exports.generateCodeWithTransforms = generateCodeWithTransforms;
function replace(start, end, replacement) {
    return {
        range: [start, end],
        generate: replacement,
    };
}
function insert(position, insertion) {
    return {
        range: [position, position],
        generate: insertion,
    };
}
function* generateCodeWithTransforms(start, end, transforms, section) {
    const sortedTransforms = transforms.sort((a, b) => a.range[0] - b.range[0]);
    for (const { range, generate } of sortedTransforms) {
        yield* section(start, range[0]);
        yield* generate();
        start = range[1];
    }
    yield* section(start, end);
}
//# sourceMappingURL=transform.js.map