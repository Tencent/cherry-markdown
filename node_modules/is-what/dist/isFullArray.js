import { isArray } from './isArray.js';
/** Returns whether the payload is a an array with at least 1 item */
export function isFullArray(payload) {
    return isArray(payload) && payload.length > 0;
}
