"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEscaped = generateEscaped;
function* generateEscaped(text, source, offset, features, escapeTarget) {
    const parts = text.split(escapeTarget);
    const combineToken = features.__combineToken ?? Symbol();
    let isEscapeTarget = false;
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (isEscapeTarget) {
            yield `\\`;
        }
        yield [
            part,
            source,
            offset,
            i === 0
                ? { ...features, __combineToken: combineToken }
                : { __combineToken: combineToken },
        ];
        offset += part.length;
        isEscapeTarget = !isEscapeTarget;
    }
}
//# sourceMappingURL=escaped.js.map