import { isAnyObject } from './isAnyObject.js';
/**
 * Returns whether the payload is an object like a type passed in < >
 *
 * Usage: isObjectLike<{id: any}>(payload) // will make sure it's an object and has an `id` prop.
 *
 * @template T This must be passed in < >
 */
export function isObjectLike(payload) {
    return isAnyObject(payload);
}
