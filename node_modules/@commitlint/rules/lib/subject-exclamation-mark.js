import message from '@commitlint/message';
export const subjectExclamationMark = (parsed, when = 'always') => {
    const input = parsed.header;
    if (!input) {
        return [true, ''];
    }
    const negated = when === 'never';
    const hasExclamationMark = /!:/.test(input);
    return [
        negated ? !hasExclamationMark : hasExclamationMark,
        message([
            'subject',
            negated ? 'must not' : 'must',
            'have an exclamation mark in the subject to identify a breaking change',
        ]),
    ];
};
//# sourceMappingURL=subject-exclamation-mark.js.map