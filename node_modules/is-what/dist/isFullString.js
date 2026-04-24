import { isString } from './isString.js';
/** Returns whether the payload is a string, BUT returns false for '' */
export function isFullString(payload) {
    return isString(payload) && payload !== '';
}
