"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tsCodegen = void 0;
const shared_1 = require("@vue/shared");
const alien_signals_1 = require("alien-signals");
const path = __importStar(require("path-browserify"));
const script_1 = require("../codegen/script");
const style_1 = require("../codegen/style");
const template_1 = require("../codegen/template");
const compilerOptions_1 = require("../compilerOptions");
const scriptRanges_1 = require("../parsers/scriptRanges");
const scriptSetupRanges_1 = require("../parsers/scriptSetupRanges");
const vueCompilerOptions_1 = require("../parsers/vueCompilerOptions");
const signals_1 = require("../utils/signals");
exports.tsCodegen = new WeakMap();
const validLangs = new Set(['js', 'jsx', 'ts', 'tsx']);
const plugin = ({ modules: { typescript: ts }, vueCompilerOptions, }) => {
    return {
        version: 2.2,
        getEmbeddedCodes(_fileName, sfc) {
            const lang = computeLang(sfc);
            return [{ lang, id: 'script_' + lang }];
        },
        resolveEmbeddedCode(fileName, sfc, embeddedFile) {
            if (/script_(js|jsx|ts|tsx)/.test(embeddedFile.id)) {
                let codegen = exports.tsCodegen.get(sfc);
                if (!codegen) {
                    exports.tsCodegen.set(sfc, codegen = useCodegen(ts, vueCompilerOptions, fileName, sfc));
                }
                const generatedScript = codegen.getGeneratedScript();
                embeddedFile.content = [...generatedScript.codes];
            }
        },
    };
    function computeLang(sfc) {
        let lang = sfc.scriptSetup?.lang ?? sfc.script?.lang;
        if (sfc.script && sfc.scriptSetup) {
            if (sfc.scriptSetup.lang !== 'js') {
                lang = sfc.scriptSetup.lang;
            }
            else {
                lang = sfc.script.lang;
            }
        }
        if (lang && validLangs.has(lang)) {
            return lang;
        }
        return 'ts';
    }
};
exports.default = plugin;
function useCodegen(ts, vueCompilerOptions, fileName, sfc) {
    const getResolvedOptions = (0, alien_signals_1.computed)(() => {
        const options = (0, vueCompilerOptions_1.parseVueCompilerOptions)(sfc.comments);
        if (options) {
            const resolver = new compilerOptions_1.CompilerOptionsResolver(ts, () => undefined /* does not support resolving target="auto" */);
            resolver.addConfig(options, path.dirname(fileName));
            return resolver.build(vueCompilerOptions);
        }
        return vueCompilerOptions;
    });
    const getScriptRanges = (0, alien_signals_1.computed)(() => sfc.script && validLangs.has(sfc.script.lang)
        ? (0, scriptRanges_1.parseScriptRanges)(ts, sfc.script.ast, getResolvedOptions())
        : undefined);
    const getScriptSetupRanges = (0, alien_signals_1.computed)(() => sfc.scriptSetup && validLangs.has(sfc.scriptSetup.lang)
        ? (0, scriptSetupRanges_1.parseScriptSetupRanges)(ts, sfc.scriptSetup.ast, getResolvedOptions())
        : undefined);
    const getImportedComponents = (0, signals_1.computedSet)(() => {
        const names = new Set();
        const scriptSetupRanges = getScriptSetupRanges();
        if (sfc.scriptSetup && scriptSetupRanges) {
            for (const range of scriptSetupRanges.components) {
                names.add(sfc.scriptSetup.content.slice(range.start, range.end));
            }
            const scriptRange = getScriptRanges();
            if (sfc.script && scriptRange) {
                for (const range of scriptRange.components) {
                    names.add(sfc.script.content.slice(range.start, range.end));
                }
            }
        }
        return names;
    });
    const getSetupConsts = (0, signals_1.computedSet)(() => {
        const scriptSetupRanges = getScriptSetupRanges();
        const names = new Set([
            ...scriptSetupRanges?.defineProps?.destructured?.keys() ?? [],
            ...getImportedComponents(),
        ]);
        const rest = scriptSetupRanges?.defineProps?.destructuredRest;
        if (rest) {
            names.add(rest);
        }
        return names;
    });
    const getSetupRefs = (0, signals_1.computedSet)(() => {
        return new Set(getScriptSetupRanges()?.useTemplateRef
            .map(({ name }) => name)
            .filter(name => name !== undefined));
    });
    const hasDefineSlots = (0, alien_signals_1.computed)(() => !!getScriptSetupRanges()?.defineSlots);
    const getSetupPropsAssignName = (0, alien_signals_1.computed)(() => getScriptSetupRanges()?.defineProps?.name);
    const getSetupSlotsAssignName = (0, alien_signals_1.computed)(() => getScriptSetupRanges()?.defineSlots?.name);
    const getInheritAttrs = (0, alien_signals_1.computed)(() => {
        const value = getScriptSetupRanges()?.defineOptions?.inheritAttrs
            ?? getScriptRanges()?.exportDefault?.options?.inheritAttrs;
        return value !== 'false';
    });
    const getComponentName = (0, alien_signals_1.computed)(() => {
        let name;
        const componentOptions = getScriptRanges()?.exportDefault?.options;
        if (sfc.script && componentOptions?.name) {
            name = sfc.script.content.slice(componentOptions.name.start + 1, componentOptions.name.end - 1);
        }
        else {
            const { defineOptions } = getScriptSetupRanges() ?? {};
            if (sfc.scriptSetup && defineOptions?.name) {
                name = defineOptions.name;
            }
            else {
                const baseName = path.basename(fileName);
                name = baseName.slice(0, baseName.lastIndexOf('.'));
            }
        }
        return (0, shared_1.capitalize)((0, shared_1.camelize)(name));
    });
    const getGeneratedTemplate = (0, alien_signals_1.computed)(() => {
        if (getResolvedOptions().skipTemplateCodegen || !sfc.template) {
            return;
        }
        return (0, template_1.generateTemplate)({
            typescript: ts,
            vueCompilerOptions: getResolvedOptions(),
            template: sfc.template,
            componentName: getComponentName(),
            setupConsts: getSetupConsts(),
            setupRefs: getSetupRefs(),
            hasDefineSlots: hasDefineSlots(),
            propsAssignName: getSetupPropsAssignName(),
            slotsAssignName: getSetupSlotsAssignName(),
            inheritAttrs: getInheritAttrs(),
        });
    });
    const getGeneratedStyle = (0, alien_signals_1.computed)(() => {
        if (!sfc.styles.length) {
            return;
        }
        return (0, style_1.generateStyle)({
            typescript: ts,
            vueCompilerOptions: getResolvedOptions(),
            styles: sfc.styles,
            setupConsts: getSetupConsts(),
            setupRefs: getSetupRefs(),
        });
    });
    const getSetupExposed = (0, signals_1.computedSet)(() => {
        const allVars = new Set();
        const scriptSetupRanges = getScriptSetupRanges();
        if (!sfc.scriptSetup || !scriptSetupRanges) {
            return allVars;
        }
        for (const range of scriptSetupRanges.bindings) {
            const name = sfc.scriptSetup.content.slice(range.start, range.end);
            allVars.add(name);
        }
        const scriptRanges = getScriptRanges();
        if (sfc.script && scriptRanges) {
            for (const range of scriptRanges.bindings) {
                const name = sfc.script.content.slice(range.start, range.end);
                allVars.add(name);
            }
        }
        if (!allVars.size) {
            return allVars;
        }
        const exposedNames = new Set();
        const generatedTemplate = getGeneratedTemplate();
        const generatedStyle = getGeneratedStyle();
        for (const [name] of generatedTemplate?.componentAccessMap ?? []) {
            if (allVars.has(name)) {
                exposedNames.add(name);
            }
        }
        for (const [name] of generatedStyle?.componentAccessMap ?? []) {
            if (allVars.has(name)) {
                exposedNames.add(name);
            }
        }
        for (const component of sfc.template?.ast?.components ?? []) {
            const testNames = new Set([(0, shared_1.camelize)(component), (0, shared_1.capitalize)((0, shared_1.camelize)(component))]);
            for (const testName of testNames) {
                if (allVars.has(testName)) {
                    exposedNames.add(testName);
                }
            }
        }
        return exposedNames;
    });
    const getGeneratedScript = (0, alien_signals_1.computed)(() => {
        return (0, script_1.generateScript)({
            vueCompilerOptions: getResolvedOptions(),
            fileName,
            script: sfc.script,
            scriptSetup: sfc.scriptSetup,
            exposed: getSetupExposed(),
            scriptRanges: getScriptRanges(),
            scriptSetupRanges: getScriptSetupRanges(),
            templateAndStyleTypes: new Set([
                ...getGeneratedTemplate()?.generatedTypes ?? [],
                ...getGeneratedStyle()?.generatedTypes ?? [],
            ]),
            templateAndStyleCodes: [
                ...getGeneratedStyle()?.codes ?? [],
                ...getGeneratedTemplate()?.codes ?? [],
            ],
        });
    });
    return {
        getScriptRanges,
        getScriptSetupRanges,
        getGeneratedScript,
        getGeneratedTemplate,
        getImportedComponents,
        getSetupExposed,
    };
}
//# sourceMappingURL=vue-tsx.js.map