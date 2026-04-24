import { isPlainObject } from './isPlainObject.js';
/**
 * Returns whether the payload is a plain JavaScript object (excluding special classes or objects
 * with other prototypes)
 */
export function isObject(payload) {
    return isPlainObject(payload);
}
