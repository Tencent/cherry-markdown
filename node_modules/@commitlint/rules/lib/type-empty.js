import * as ensure from '@commitlint/ensure';
import message from '@commitlint/message';
export const typeEmpty = (parsed, when = 'always') => {
    const negated = when === 'never';
    const notEmpty = ensure.notEmpty(parsed.type || '');
    return [
        negated ? notEmpty : !notEmpty,
        message(['type', negated ? 'may not' : 'must', 'be empty']),
    ];
};
//# sourceMappingURL=type-empty.js.map