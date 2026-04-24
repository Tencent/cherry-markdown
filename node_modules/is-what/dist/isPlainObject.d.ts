export type PlainObject = {
    [key in string | number | symbol]: unknown;
};
/**
 * Returns whether the payload is a plain JavaScript object (excluding special classes or objects
 * with other prototypes)
 */
export declare function isPlainObject(payload: unknown): payload is PlainObject;
