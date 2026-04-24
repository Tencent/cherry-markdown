"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBoundary = startBoundary;
exports.endBoundary = endBoundary;
function* startBoundary(source, startOffset, features) {
    const token = Symbol(source);
    yield ['', source, startOffset, { ...features, __combineToken: token }];
    return token;
}
function endBoundary(token, endOffset) {
    return ['', token.description, endOffset, { __combineToken: token }];
}
//# sourceMappingURL=boundary.js.map