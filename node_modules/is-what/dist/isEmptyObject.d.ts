/**
 * Returns whether the payload is a an empty object (excluding special classes or objects with other
 * prototypes)
 */
export declare function isEmptyObject(payload: unknown): payload is {
    [K in string | symbol | number]: never;
};
