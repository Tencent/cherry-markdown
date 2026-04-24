import type { PlainObject } from './isPlainObject.js';
/**
 * Returns whether the payload is a an empty object (excluding special classes or objects with other
 * prototypes)
 */
export declare function isFullObject(payload: unknown): payload is PlainObject;
