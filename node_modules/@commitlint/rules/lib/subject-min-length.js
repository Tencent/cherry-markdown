import { minLength } from '@commitlint/ensure';
export const subjectMinLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.subject;
    if (!input) {
        return [true];
    }
    return [
        minLength(input, value),
        `subject must not be shorter than ${value} characters`,
    ];
};
//# sourceMappingURL=subject-min-length.js.map