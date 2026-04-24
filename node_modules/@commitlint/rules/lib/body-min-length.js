import { minLength } from '@commitlint/ensure';
export const bodyMinLength = (parsed, _when = undefined, value = 0) => {
    if (!parsed.body) {
        return [true];
    }
    return [
        minLength(parsed.body, value),
        `body must not be shorter than ${value} characters`,
    ];
};
//# sourceMappingURL=body-min-length.js.map