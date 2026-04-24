import { minLength } from '@commitlint/ensure';
export const headerMinLength = (parsed, _when = undefined, value = 0) => {
    return [
        minLength(parsed.header, value),
        `header must not be shorter than ${value} characters, current length is ${parsed.header?.length}`,
    ];
};
//# sourceMappingURL=header-min-length.js.map