import { isPlainObject } from './isPlainObject.js';
/**
 * Returns whether the payload is a an empty object (excluding special classes or objects with other
 * prototypes)
 */
export function isFullObject(payload) {
    return isPlainObject(payload) && Object.keys(payload).length > 0;
}
