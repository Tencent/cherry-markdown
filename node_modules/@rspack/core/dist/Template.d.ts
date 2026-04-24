/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/Template.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
declare class Template {
    /**
     *
     * @param fn a runtime function (.runtime.js) "template"
     * @returns the updated and normalized function string
     */
    static getFunctionContent(fn: Function): string;
    /**
     * @param str the string converted to identifier
     * @returns created identifier
     */
    static toIdentifier(str: any): string;
    /**
     *
     * @param str string to be converted to commented in bundle code
     * @returns returns a commented version of string
     */
    static toComment(str: string): string;
    /**
     *
     * @param str string to be converted to "normal comment"
     * @returns returns a commented version of string
     */
    static toNormalComment(str: string): string;
    /**
     * @param str string path to be normalized
     * @returns normalized bundle-safe path
     */
    static toPath(str: string): string;
    /**
     * @param num number to convert to ident
     * @returns returns single character ident
     */
    static numberToIdentifier(num: number): string;
    /**
     * @param num number to convert to ident
     * @returns returns single character ident
     */
    static numberToIdentifierContinuation(num: number): string;
    /**
     *
     * @param s string to convert to identity
     * @returns converted identity
     */
    static indent(s: string | string[]): string;
    /**
     *
     * @param s string to create prefix for
     * @param prefix prefix to compose
     * @returns returns new prefix string
     */
    static prefix(s: string | string[], prefix: string): string;
    /**
     *
     * @param str string or string collection
     * @returns returns a single string from array
     */
    static asString(str: string | string[]): string;
    /**
     * @param modules a collection of modules to get array bounds for
     * @returns returns the upper and lower array bounds
     * or false if not every module has a number based id
     */
    static getModulesArrayBounds(modules: {
        id: string | number;
    }[]): [number, number] | false;
}
export { Template };
