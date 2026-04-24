export type Options<T> = {
    props?: (keyof T)[];
    nonenumerable?: boolean;
};
/**
 * Copy (clone) an object and all its props recursively to get rid of any prop referenced of the
 * original object. Arrays are also cloned, however objects inside arrays are still linked.
 *
 * @param target Target can be anything
 * @param [options={}] See type {@link Options} for more details.
 *
 *   - `{ props: ['key1'] }` will only copy the `key1` property. When using this you will need to cast
 *       the return type manually (in order to keep the TS implementation in here simple I didn't
 *       built a complex auto resolved type for those few cases people want to use this option)
 *   - `{ nonenumerable: true }` will copy all non-enumerable properties. Default is `{}`
 *
 * @returns The target with replaced values
 */
export declare function copy<T>(target: T, options?: Options<T>): T;
