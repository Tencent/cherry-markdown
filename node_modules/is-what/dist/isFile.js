import { getType } from './getType.js';
/** Returns whether the payload is a File */
export function isFile(payload) {
    return getType(payload) === 'File';
}
