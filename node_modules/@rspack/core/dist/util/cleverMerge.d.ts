export declare const DELETE: unique symbol;
/**
 * Merges two given objects and caches the result to avoid computation if same objects passed as arguments again.
 * @example
 * // performs cleverMerge(first, second), stores the result in WeakMap and returns result
 * cachedCleverMerge({a: 1}, {a: 2})
 * {a: 2}
 *  // when same arguments passed, gets the result from WeakMap and returns it.
 * cachedCleverMerge({a: 1}, {a: 2})
 * {a: 2}
 * @param first first object
 * @param second second object
 * @returns  merged object of first and second object
 */
export declare const cachedCleverMerge: <First, Second>(first: First, second: Second) => First | Second | (First & Second);
/**
 * Merges two objects. Objects are deeply clever merged.
 * Arrays might reference the old value with "...".
 * Non-object values take preference over object values.
 * @param first first object
 * @param second second object
 * @returns merged object of first and second object
 */
export declare const cleverMerge: <First, Second>(first: First, second: Second) => First | Second | (First & Second);
