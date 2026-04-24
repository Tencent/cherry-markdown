/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/cache/mergeEtags.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { Etag } from "../Cache";
/**
 * @param first first
 * @param second second
 * @returns result
 */
export declare const mergeEtags: (first: Etag, second: Etag) => Etag;
export default mergeEtags;
