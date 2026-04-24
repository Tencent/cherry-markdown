import { getType } from './getType.js';
/** Returns whether the payload is a Symbol */
export function isSymbol(payload) {
    return getType(payload) === 'Symbol';
}
