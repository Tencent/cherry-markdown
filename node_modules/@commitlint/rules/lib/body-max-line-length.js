import { maxLineLength } from '@commitlint/ensure';
export const bodyMaxLineLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.body;
    if (!input) {
        return [true];
    }
    return [
        maxLineLength(input, value),
        `body's lines must not be longer than ${value} characters`,
    ];
};
//# sourceMappingURL=body-max-line-length.js.map