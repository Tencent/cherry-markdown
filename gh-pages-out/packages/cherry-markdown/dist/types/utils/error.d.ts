export function $expectTarget(target: any, Constructor: any): boolean;
export function $expectInherit(target: any, parent: any): boolean;
export function $expectInstance(target: any): boolean;
export default class NestedError extends Error {
    constructor(message: any, nested: any);
    stack: any;
    buildStackTrace(nested: any): any;
}
