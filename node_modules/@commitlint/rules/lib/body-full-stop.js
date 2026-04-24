import message from '@commitlint/message';
export const bodyFullStop = (parsed, when = 'always', value = '.') => {
    const input = parsed.body;
    if (!input) {
        return [true];
    }
    const negated = when === 'never';
    const hasStop = input[input.length - 1] === value;
    return [
        negated ? !hasStop : hasStop,
        message(['body', negated ? 'may not' : 'must', 'end with full stop']),
    ];
};
//# sourceMappingURL=body-full-stop.js.map