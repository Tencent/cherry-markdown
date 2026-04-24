import { getType } from './getType.js';
/** Returns whether the payload is a boolean */
export function isBoolean(payload) {
    return getType(payload) === 'Boolean';
}
