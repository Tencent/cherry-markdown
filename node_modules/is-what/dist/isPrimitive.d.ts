/**
 * Returns whether the payload is a primitive type (eg. Boolean | Null | Undefined | Number | String
 *
 * | Symbol)
 */
export declare function isPrimitive(payload: unknown): payload is boolean | null | undefined | number | string | symbol | bigint;
