import { getType } from './getType.js';
/** Returns whether the payload is a regular expression (RegExp) */
export function isRegExp(payload) {
    return getType(payload) === 'RegExp';
}
