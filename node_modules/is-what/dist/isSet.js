import { getType } from './getType.js';
/** Returns whether the payload is a Set */
export function isSet(payload) {
    return getType(payload) === 'Set';
}
