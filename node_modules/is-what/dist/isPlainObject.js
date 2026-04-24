import { getType } from './getType.js';
/**
 * Returns whether the payload is a plain JavaScript object (excluding special classes or objects
 * with other prototypes)
 */
export function isPlainObject(payload) {
    if (getType(payload) !== 'Object')
        return false;
    const prototype = Object.getPrototypeOf(payload);
    return !!prototype && prototype.constructor === Object && prototype === Object.prototype;
}
