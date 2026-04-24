import * as ensure from '@commitlint/ensure';
import message from '@commitlint/message';
export const footerEmpty = (parsed, when = 'always') => {
    const negated = when === 'never';
    const notEmpty = ensure.notEmpty(parsed.footer || '');
    return [
        negated ? notEmpty : !notEmpty,
        message(['footer', negated ? 'may not' : 'must', 'be empty']),
    ];
};
//# sourceMappingURL=footer-empty.js.map