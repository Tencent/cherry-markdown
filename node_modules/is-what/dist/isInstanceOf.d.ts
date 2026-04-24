import type { AnyClass } from './isType.js';
type GlobalClassName = {
    [K in keyof typeof globalThis]: (typeof globalThis)[K] extends AnyClass ? K : never;
}[keyof typeof globalThis];
/**
 * Checks if a value is an instance of a class or a class name. Useful when you want to check if a
 * value is an instance of a class that may not be defined in the current scope. For example, if you
 * want to check if a value is an `OffscreenCanvas` instance, you might not want to do the song and
 * dance of using `typeof OffscreenCanvas !== 'undefined'` and then shimming `OffscreenCanvas` if
 * the types aren't around.
 *
 * @example
 *   if (isInstanceOf(value, 'OffscreenCanvas')) {
 *     // value is an OffscreenCanvas
 *   }
 *
 * @param value The value to recursively check
 * @param class_ A string or class that the value should be an instance of
 */
export declare function isInstanceOf<T extends AnyClass>(value: unknown, class_: T): value is T;
export declare function isInstanceOf<K extends GlobalClassName>(value: unknown, className: K): value is (typeof globalThis)[K];
export declare function isInstanceOf(value: unknown, className: string): value is object;
export {};
