/** Returns whether the payload is a function (regular or async) */
export function isFunction(payload) {
    return typeof payload === 'function';
}
