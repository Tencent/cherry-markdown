import { isInteger } from './isInteger.js';
/** Returns whether the payload is a positive Integer (but not 0) */
export function isPositiveInteger(payload) {
    return isInteger(payload) && payload > 0;
}
