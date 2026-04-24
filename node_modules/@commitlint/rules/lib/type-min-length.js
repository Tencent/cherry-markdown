import { minLength } from '@commitlint/ensure';
export const typeMinLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.type;
    if (!input) {
        return [true];
    }
    return [
        minLength(input, value),
        `type must not be shorter than ${value} characters`,
    ];
};
//# sourceMappingURL=type-min-length.js.map