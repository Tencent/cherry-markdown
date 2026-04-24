import type { PlainObject } from './isPlainObject.js';
/**
 * Returns whether the payload is an any kind of object (including special classes or objects with
 * different prototypes)
 */
export declare function isAnyObject(payload: unknown): payload is PlainObject;
