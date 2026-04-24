import type { PlainObject } from './isPlainObject.js';
/**
 * Returns whether the payload is an object like a type passed in < >
 *
 * Usage: isObjectLike<{id: any}>(payload) // will make sure it's an object and has an `id` prop.
 *
 * @template T This must be passed in < >
 */
export declare function isObjectLike<T extends PlainObject>(payload: unknown): payload is T;
