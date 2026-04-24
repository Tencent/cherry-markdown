"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateClassProperty = generateClassProperty;
exports.generateStyleImports = generateStyleImports;
const codeFeatures_1 = require("../codeFeatures");
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
function* generateClassProperty(source, classNameWithDot, offset, propertyType) {
    yield `${utils_1.newLine} & { `;
    const token = yield* (0, boundary_1.startBoundary)(source, offset, codeFeatures_1.codeFeatures.navigation);
    yield `'`;
    yield [classNameWithDot.slice(1), source, offset + 1, { __combineToken: token }];
    yield `'`;
    yield (0, boundary_1.endBoundary)(token, offset + classNameWithDot.length);
    yield `: ${propertyType}`;
    yield ` }`;
}
function* generateStyleImports(style) {
    const features = {
        navigation: true,
        verification: true,
    };
    if (typeof style.src === 'object') {
        yield `${utils_1.newLine} & typeof import(`;
        const token = yield* (0, boundary_1.startBoundary)('main', style.src.offset, features);
        yield `'`;
        yield [style.src.text, 'main', style.src.offset, { __combineToken: token }];
        yield `'`;
        yield (0, boundary_1.endBoundary)(token, style.src.offset + style.src.text.length);
        yield `).default`;
    }
    for (const { text, offset } of style.imports) {
        yield `${utils_1.newLine} & typeof import('`;
        yield [
            text,
            style.name,
            offset,
            features,
        ];
        yield `').default`;
    }
}
//# sourceMappingURL=common.js.map