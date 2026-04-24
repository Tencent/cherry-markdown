import { getType } from './getType.js';
/** Returns whether the payload is an array */
export function isArray(payload) {
    return getType(payload) === 'Array';
}
