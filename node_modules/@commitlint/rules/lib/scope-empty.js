import * as ensure from '@commitlint/ensure';
import message from '@commitlint/message';
export const scopeEmpty = (parsed, when = 'never') => {
    const negated = when === 'always';
    const notEmpty = ensure.notEmpty(parsed.scope || '');
    return [
        negated ? !notEmpty : notEmpty,
        message(['scope', negated ? 'must' : 'may not', 'be empty']),
    ];
};
//# sourceMappingURL=scope-empty.js.map