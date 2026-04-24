import { getType } from './getType.js';
/** Returns whether the payload is null */
export function isNull(payload) {
    return getType(payload) === 'Null';
}
