/** Returns whether the payload is literally the value `NaN` (it's `NaN` and also a `number`) */
export declare function isNaNValue(payload: unknown): payload is typeof Number.NaN;
