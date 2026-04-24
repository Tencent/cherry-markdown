import { getType } from './getType.js';
/** Returns whether the payload is a Blob */
export function isBlob(payload) {
    return getType(payload) === 'Blob';
}
