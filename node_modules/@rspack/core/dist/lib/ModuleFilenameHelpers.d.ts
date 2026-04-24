/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/ModuleFilenameHelpers.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
type Matcher = string | RegExp | (string | RegExp)[];
/**
 * Returns a function that returns the string with the token replaced with the replacement
 * @example
 * ```js
 * const test = asRegExp("test");
 * test.test("test"); // true
 *
 * const test2 = asRegExp(/test/);
 * test2.test("test"); // true
 * ```
 */
export declare const asRegExp: (test: string | RegExp) => RegExp;
export declare const matchPart: (str: string, test: Matcher) => boolean;
export interface MatchObject {
    test?: Matcher;
    include?: Matcher;
    exclude?: Matcher;
}
/**
 * Tests if a string matches a match object. The match object can have the following properties:
 * - `test`: a RegExp or an array of RegExp
 * - `include`: a RegExp or an array of RegExp
 * - `exclude`: a RegExp or an array of RegExp
 *
 * The `test` property is tested first, then `include` and then `exclude`.
 *
 * @example
 * ```js
 * ModuleFilenameHelpers.matchObject({ test: "foo.js" }, "foo.js"); // true
 * ModuleFilenameHelpers.matchObject({ test: /^foo/ }, "foo.js"); // true
 * ModuleFilenameHelpers.matchObject({ test: [/^foo/, "bar"] }, "foo.js"); // true
 * ModuleFilenameHelpers.matchObject({ test: [/^foo/, "bar"] }, "baz.js"); // false
 * ModuleFilenameHelpers.matchObject({ include: "foo.js" }, "foo.js"); // true
 * ModuleFilenameHelpers.matchObject({ include: "foo.js" }, "bar.js"); // false
 * ModuleFilenameHelpers.matchObject({ include: /^foo/ }, "foo.js"); // true
 * ModuleFilenameHelpers.matchObject({ include: [/^foo/, "bar"] }, "foo.js"); // true
 * ModuleFilenameHelpers.matchObject({ include: [/^foo/, "bar"] }, "baz.js"); // false
 * ModuleFilenameHelpers.matchObject({ exclude: "foo.js" }, "foo.js"); // false
 * ModuleFilenameHelpers.matchObject({ exclude: [/^foo/, "bar"] }, "foo.js"); // false
 * ```
 */
export declare const matchObject: (obj: MatchObject, str: string) => boolean;
export {};
