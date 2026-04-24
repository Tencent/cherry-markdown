/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/AbstractMethodError.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import WebpackError from "./WebpackError";
/**
 * Error for abstract method
 * @example
 * class FooClass {
 *     abstractMethod() {
 *         throw new AbstractMethodError(); // error message: Abstract method FooClass.abstractMethod. Must be overridden.
 *     }
 * }
 *
 */
export declare class AbstractMethodError extends WebpackError {
    constructor();
}
