import { isInteger } from './isInteger.js';
/** Returns whether the payload is a negative Integer (but not 0) */
export function isNegativeInteger(payload) {
    return isInteger(payload) && payload < 0;
}
