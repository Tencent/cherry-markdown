import { getType } from './getType.js';
/** Returns whether the payload is a Promise */
export function isPromise(payload) {
    return getType(payload) === 'Promise';
}
