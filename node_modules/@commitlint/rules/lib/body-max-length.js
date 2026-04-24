import { maxLength } from '@commitlint/ensure';
export const bodyMaxLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.body;
    if (!input) {
        return [true];
    }
    return [
        maxLength(input, value),
        `body must not be longer than ${value} characters`,
    ];
};
//# sourceMappingURL=body-max-length.js.map