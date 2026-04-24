import { getType } from './getType.js';
/**
 * Returns whether the payload is a number (but not NaN)
 *
 * This will return `false` for `NaN`!!
 */
export function isNumber(payload) {
    return getType(payload) === 'Number' && !Number.isNaN(payload);
}
