import { minLength } from '@commitlint/ensure';
export const scopeMinLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.scope;
    if (!input) {
        return [true];
    }
    return [
        minLength(input, value),
        `scope must not be shorter than ${value} characters`,
    ];
};
//# sourceMappingURL=scope-min-length.js.map