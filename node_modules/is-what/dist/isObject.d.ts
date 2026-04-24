import type { PlainObject } from './isPlainObject.js';
/**
 * Returns whether the payload is a plain JavaScript object (excluding special classes or objects
 * with other prototypes)
 */
export declare function isObject(payload: unknown): payload is PlainObject;
