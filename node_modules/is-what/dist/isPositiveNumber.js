import { isNumber } from './isNumber.js';
/** Returns whether the payload is a positive number (but not 0) */
export function isPositiveNumber(payload) {
    return isNumber(payload) && payload > 0;
}
