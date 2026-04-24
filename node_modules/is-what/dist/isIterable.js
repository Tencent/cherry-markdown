/** Returns whether the payload is an iterable (regular or async) */
export function isIterable(payload) {
    // oxlint-disable-next-line no-typeof-undefined
    if (typeof Symbol === 'undefined' || typeof Symbol.iterator === 'undefined') {
        return false;
    }
    // oxlint-disable-next-line no-null
    if (payload === null || payload === undefined)
        return false;
    // Strings are iterable, even though they're primitives.
    if (typeof payload === 'string')
        return true;
    // For objects, arrays and functions, check if Symbol.iterator is a function.
    return ((typeof payload === 'object' || typeof payload === 'function') &&
        typeof payload[Symbol.iterator] === 'function');
}
