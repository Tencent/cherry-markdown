import { getType } from './getType.js';
/** Returns whether the payload is an integer number */
export function isInteger(payload) {
    return getType(payload) === 'Number' && Number.isInteger(payload);
}
