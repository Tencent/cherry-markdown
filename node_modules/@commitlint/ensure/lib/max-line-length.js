import ensure from './max-length.js';
export default (value, max) => typeof value === 'string' &&
    value.split(/\r?\n/).every((line) => ensure(line, max));
//# sourceMappingURL=max-line-length.js.map