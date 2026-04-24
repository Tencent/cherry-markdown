import { maxLength } from '@commitlint/ensure';
export const subjectMaxLength = (parsed, _when = undefined, value = 0) => {
    const input = parsed.subject;
    if (!input) {
        return [true];
    }
    return [
        maxLength(input, value),
        `subject must not be longer than ${value} characters`,
    ];
};
//# sourceMappingURL=subject-max-length.js.map