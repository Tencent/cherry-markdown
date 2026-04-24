import { getType } from './getType.js';
/** Returns whether the payload is a Map */
export function isMap(payload) {
    return getType(payload) === 'Map';
}
