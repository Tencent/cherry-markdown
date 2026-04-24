"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalTypesGenerator = getLocalTypesGenerator;
const utils_1 = require("./utils");
function getLocalTypesGenerator(vueCompilerOptions) {
    const used = new Set();
    const WithDefaults = defineHelper(`__VLS_WithDefaults`, () => `
type __VLS_WithDefaults<P, D> = {
	[K in keyof Pick<P, keyof P>]: K extends keyof D
		? ${PrettifyLocal.name}<P[K] & { default: D[K] }>
		: P[K]
};
`.trimStart());
    const PrettifyLocal = defineHelper(`__VLS_PrettifyLocal`, () => `type __VLS_PrettifyLocal<T> = (T extends any ? { [K in keyof T]: T[K]; } : { [K in keyof T as K]: T[K]; }) & {}${utils_1.endOfLine}`);
    const WithSlots = defineHelper(`__VLS_WithSlots`, () => `
type __VLS_WithSlots<T, S> = T & {
	new(): {
		$slots: S;
	}
};
`.trimStart());
    const PropsChildren = defineHelper(`__VLS_PropsChildren`, () => `
type __VLS_PropsChildren<S> = {
	[K in keyof (
		boolean extends (
			// @ts-ignore
			JSX.ElementChildrenAttribute extends never
				? true
				: false
		)
			? never
			// @ts-ignore
			: JSX.ElementChildrenAttribute
	)]?: S;
};
`.trimStart());
    const TypePropsToOption = defineHelper(`__VLS_TypePropsToOption`, () => `
type __VLS_TypePropsToOption<T> = {
	[K in keyof T]-?: {} extends Pick<T, K>
		? { type: import('${vueCompilerOptions.lib}').PropType<Required<T>[K]> }
		: { type: import('${vueCompilerOptions.lib}').PropType<T[K]>, required: true }
};
`.trimStart());
    const OmitIndexSignature = defineHelper(`__VLS_OmitIndexSignature`, () => `type __VLS_OmitIndexSignature<T> = { [K in keyof T as {} extends Record<K, unknown> ? never : K]: T[K]; }${utils_1.endOfLine}`);
    const helpers = {
        [PrettifyLocal.name]: PrettifyLocal,
        [WithDefaults.name]: WithDefaults,
        [WithSlots.name]: WithSlots,
        [PropsChildren.name]: PropsChildren,
        [TypePropsToOption.name]: TypePropsToOption,
        [OmitIndexSignature.name]: OmitIndexSignature,
    };
    used.clear();
    return {
        generate,
        get PrettifyLocal() {
            return PrettifyLocal.name;
        },
        get WithDefaults() {
            return WithDefaults.name;
        },
        get WithSlots() {
            return WithSlots.name;
        },
        get PropsChildren() {
            return PropsChildren.name;
        },
        get TypePropsToOption() {
            return TypePropsToOption.name;
        },
        get OmitIndexSignature() {
            return OmitIndexSignature.name;
        },
    };
    function* generate() {
        for (const name of used) {
            yield helpers[name].generate();
        }
        used.clear();
    }
    function defineHelper(name, generate) {
        return {
            get name() {
                used.add(name);
                return name;
            },
            generate,
        };
    }
}
//# sourceMappingURL=localTypes.js.map