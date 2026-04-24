import type { AnyFunction } from './isFunction.js';
export type AnyClass = new (...args: unknown[]) => unknown;
/**
 * Does a generic check to check that the given payload is of a given type. In cases like Number, it
 * will return true for NaN as NaN is a Number (thanks javascript!); It will, however, differentiate
 * between object and null
 *
 * @throws {TypeError} Will throw type error if type is an invalid type
 */
export declare function isType<T extends AnyFunction | AnyClass>(payload: unknown, type: T): payload is T;
