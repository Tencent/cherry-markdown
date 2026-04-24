/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/util/createHash.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import Hash from "./hash";
/**
 * Creates a hash by name or function
 * @param algorithm the algorithm name or a constructor creating a hash
 * @returns the hash
 */
export declare const createHash: (algorithm: "debug" | "xxhash64" | "md4" | "native-md4" | (string & {}) | (new () => Hash)) => Hash;
