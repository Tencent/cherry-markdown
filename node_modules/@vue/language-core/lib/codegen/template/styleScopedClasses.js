"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.references = void 0;
exports.generateStyleScopedClassReference = generateStyleScopedClassReference;
const codeFeatures_1 = require("../codeFeatures");
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const escaped_1 = require("../utils/escaped");
const classNameEscapeRegex = /([\\'])/;
// For language-service/lib/plugins/vue-scoped-class-links.ts usage
exports.references = new WeakMap();
function* generateStyleScopedClassReference(block, className, offset, fullStart = offset) {
    if (!className) {
        yield `/** @type {__VLS_StyleScopedClasses['`;
        yield ['', 'template', offset, codeFeatures_1.codeFeatures.completion];
        yield `']} */${utils_1.endOfLine}`;
        return;
    }
    const cache = exports.references.get(block);
    if (!cache || cache[0] !== block.content) {
        const arr = [];
        exports.references.set(block, [block.content, arr]);
        arr.push([className, offset]);
    }
    else {
        cache[1].push([className, offset]);
    }
    yield `/** @type {__VLS_StyleScopedClasses[`;
    const token = yield* (0, boundary_1.startBoundary)(block.name, fullStart, codeFeatures_1.codeFeatures.navigation);
    yield `'`;
    yield* (0, escaped_1.generateEscaped)(className, block.name, offset, codeFeatures_1.codeFeatures.navigationAndCompletion, classNameEscapeRegex);
    yield `'`;
    yield (0, boundary_1.endBoundary)(token, offset + className.length);
    yield `]} */${utils_1.endOfLine}`;
}
//# sourceMappingURL=styleScopedClasses.js.map