import { isNull } from './isNull.js';
import { /* tree-shaking no-side-effects-when-called */ isOneOf } from './isOneOf.js';
import { isUndefined } from './isUndefined.js';
/** Returns true whether the payload is null or undefined */
export const isNullOrUndefined = isOneOf(isNull, isUndefined);
