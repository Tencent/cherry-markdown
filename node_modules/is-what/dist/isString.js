import { getType } from './getType.js';
/** Returns whether the payload is a string */
export function isString(payload) {
    return getType(payload) === 'String';
}
