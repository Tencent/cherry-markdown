import { getType } from './getType.js';
/** Returns whether the payload is a WeakMap */
export function isWeakMap(payload) {
    return getType(payload) === 'WeakMap';
}
