import { isNumber } from './isNumber.js';
/** Returns whether the payload is a negative number (but not 0) */
export function isNegativeNumber(payload) {
    return isNumber(payload) && payload < 0;
}
