/**
 * A factory function that creates a function to check if the payload is one of the given types.
 *
 * @example
 *   import { isOneOf, isNull, isUndefined } from 'is-what'
 *
 *   const isNullOrUndefined = isOneOf(isNull, isUndefined)
 *
 *   isNullOrUndefined(null) // true
 *   isNullOrUndefined(undefined) // true
 *   isNullOrUndefined(123) // false
 */
export function isOneOf(a, b, c, d, e) {
    return (value) => a(value) || b(value) || (!!c && c(value)) || (!!d && d(value)) || (!!e && e(value));
}
