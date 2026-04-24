import message from '@commitlint/message';
export const referencesEmpty = (parsed, when = 'never') => {
    const negated = when === 'always';
    const notEmpty = parsed.references.length > 0;
    return [
        negated ? !notEmpty : notEmpty,
        message(['references', negated ? 'must' : 'may not', 'be empty']),
    ];
};
//# sourceMappingURL=references-empty.js.map