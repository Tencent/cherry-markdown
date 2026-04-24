import { getType } from './getType.js';
import { isType } from './isType.js';
export function isInstanceOf(value, classOrClassName) {
    if (typeof classOrClassName === 'function') {
        for (let p = value; p; p = Object.getPrototypeOf(p)) {
            if (isType(p, classOrClassName)) {
                return true;
            }
        }
    }
    else {
        for (let p = value; p; p = Object.getPrototypeOf(p)) {
            if (getType(p) === classOrClassName) {
                return true;
            }
        }
    }
    return false;
}
