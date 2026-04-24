import { getType } from './getType.js';
/** Returns whether the payload is literally the value `NaN` (it's `NaN` and also a `number`) */
export function isNaNValue(payload) {
    return getType(payload) === 'Number' && Number.isNaN(payload);
}
