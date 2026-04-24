import { maxLength } from '@commitlint/ensure';
export const scopeMaxLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.scope;
    if (!input) {
        return [true];
    }
    return [
        maxLength(input, value),
        `scope must not be longer than ${value} characters`,
    ];
};
//# sourceMappingURL=scope-max-length.js.map