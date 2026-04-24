import { maxLength } from '@commitlint/ensure';
export const typeMaxLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.type;
    if (!input) {
        return [true];
    }
    return [
        maxLength(input, value),
        `type must not be longer than ${value} characters`,
    ];
};
//# sourceMappingURL=type-max-length.js.map