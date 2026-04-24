import { getType } from './getType.js';
/** Returns whether the payload is a bigint */
export function isBigInt(payload) {
    return getType(payload) === 'BigInt';
}
