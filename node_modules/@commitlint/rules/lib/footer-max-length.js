import { maxLength } from '@commitlint/ensure';
export const footerMaxLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.footer;
    if (!input) {
        return [true];
    }
    return [
        maxLength(input, value),
        `footer must not be longer than ${value} characters`,
    ];
};
//# sourceMappingURL=footer-max-length.js.map