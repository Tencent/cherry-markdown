import message from '@commitlint/message';
export const headerFullStop = (parsed, when = 'always', value = '.') => {
    const { header } = parsed;
    const negated = when === 'never';
    const hasStop = header?.[header.length - 1] === value;
    return [
        negated ? !hasStop : hasStop,
        message(['header', negated ? 'may not' : 'must', 'end with full stop']),
    ];
};
//# sourceMappingURL=header-full-stop.js.map