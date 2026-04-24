import { maxLineLength } from '@commitlint/ensure';
export const footerMaxLineLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.footer;
    if (!input) {
        return [true];
    }
    return [
        maxLineLength(input, value),
        `footer's lines must not be longer than ${value} characters`,
    ];
};
//# sourceMappingURL=footer-max-line-length.js.map