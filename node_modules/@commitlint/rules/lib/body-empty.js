import * as ensure from '@commitlint/ensure';
import message from '@commitlint/message';
export const bodyEmpty = (parsed, when = 'always') => {
    const negated = when === 'never';
    const notEmpty = ensure.notEmpty(parsed.body || '');
    return [
        negated ? notEmpty : !notEmpty,
        message(['body', negated ? 'may not' : 'must', 'be empty']),
    ];
};
//# sourceMappingURL=body-empty.js.map