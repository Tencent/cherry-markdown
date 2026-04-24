"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactiveArray = reactiveArray;
exports.computedSet = computedSet;
exports.computedArray = computedArray;
const alien_signals_1 = require("alien-signals");
function reactiveArray(getArr, getGetter) {
    const arr = (0, alien_signals_1.computed)(getArr);
    const length = (0, alien_signals_1.computed)(() => arr().length);
    const keys = (0, alien_signals_1.computed)(() => {
        const l = length();
        const keys = new Array(l);
        for (let i = 0; i < l; i++) {
            keys.push(String(i));
        }
        return keys;
    });
    const items = (0, alien_signals_1.computed)(array => {
        array ??= [];
        while (array.length < length()) {
            const index = array.length;
            const item = (0, alien_signals_1.computed)(() => arr()[index]);
            array.push((0, alien_signals_1.computed)(getGetter(item, index)));
        }
        if (array.length > length()) {
            array.length = length();
        }
        return array;
    });
    return new Proxy({}, {
        get(_, p, receiver) {
            if (p === 'length') {
                return length();
            }
            if (typeof p === 'string' && !isNaN(Number(p))) {
                return items()[Number(p)]?.();
            }
            return Reflect.get(items(), p, receiver);
        },
        has(_, p) {
            return Reflect.has(items(), p);
        },
        ownKeys() {
            return keys();
        },
    });
}
function computedSet(source) {
    return (0, alien_signals_1.computed)(oldValue => {
        const newValue = source();
        if (oldValue?.size === newValue.size && [...oldValue].every(c => newValue.has(c))) {
            return oldValue;
        }
        return newValue;
    });
}
function computedArray(source, compareFn = (oldItem, newItem) => oldItem === newItem) {
    return (0, alien_signals_1.computed)(oldArr => {
        oldArr ??= [];
        const newArr = source();
        if (oldArr.length === newArr.length && oldArr.every((item, index) => compareFn(item, newArr[index]))) {
            return oldArr;
        }
        return newArr;
    });
}
//# sourceMappingURL=signals.js.map