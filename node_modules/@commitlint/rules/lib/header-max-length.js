import { maxLength } from '@commitlint/ensure';
export const headerMaxLength = (parsed, _when = undefined, value = 0) => {
    return [
        maxLength(parsed.header, value),
        `header must not be longer than ${value} characters, current length is ${parsed.header?.length}`,
    ];
};
//# sourceMappingURL=header-max-length.js.map