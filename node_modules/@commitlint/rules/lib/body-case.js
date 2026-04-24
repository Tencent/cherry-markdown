import { case as ensureCase } from '@commitlint/ensure';
import message from '@commitlint/message';
const negated = (when) => when === 'never';
export const bodyCase = (parsed, when = 'always', value = []) => {
    const { body } = parsed;
    if (!body) {
        return [true];
    }
    const checks = (Array.isArray(value) ? value : [value]).map((check) => {
        if (typeof check === 'string') {
            return {
                when: 'always',
                case: check,
            };
        }
        return check;
    });
    const result = checks.some((check) => {
        const r = ensureCase(body, check.case);
        return negated(check.when) ? !r : r;
    });
    const list = checks.map((c) => c.case).join(', ');
    return [
        negated(when) ? !result : result,
        message([`body must`, negated(when) ? `not` : null, `be ${list}`]),
    ];
};
//# sourceMappingURL=body-case.js.map