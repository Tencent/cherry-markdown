import { getType } from './getType.js';
/** Returns whether the payload is a WeakSet */
export function isWeakSet(payload) {
    return getType(payload) === 'WeakSet';
}
