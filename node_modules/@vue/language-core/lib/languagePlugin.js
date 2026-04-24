"use strict";
/// <reference types="@volar/typescript" />
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
exports.createVueLanguagePlugin = createVueLanguagePlugin;
exports.getAllExtensions = getAllExtensions;
const language_core_1 = require("@volar/language-core");
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const plugins_1 = require("./plugins");
const virtualCode_1 = require("./virtualCode");
const fileRegistries = {};
function getVueFileRegistry(compilerOptions, vueCompilerOptions, plugins) {
    const key = JSON.stringify([
        ...plugins.map(plugin => plugin.name)
            .filter(name => typeof name === 'string')
            .sort(),
        ...Object.keys(vueCompilerOptions)
            .filter(key => key !== 'plugins')
            .sort()
            .map(key => [key, vueCompilerOptions[key]]),
        ...[...new Set(plugins.flatMap(plugin => plugin.requiredCompilerOptions ?? []))]
            .sort()
            .map(key => [key, compilerOptions[key]]),
    ]);
    return fileRegistries[key] ??= new Map();
}
function createVueLanguagePlugin(ts, compilerOptions, vueCompilerOptions, asFileName) {
    const pluginContext = {
        modules: {
            '@vue/compiler-dom': CompilerDOM,
            typescript: ts,
        },
        compilerOptions,
        vueCompilerOptions,
    };
    const plugins = (0, plugins_1.createPlugins)(pluginContext);
    const fileRegistry = getVueFileRegistry(compilerOptions, vueCompilerOptions, plugins);
    return {
        getLanguageId(scriptId) {
            const fileName = asFileName(scriptId);
            for (const plugin of plugins) {
                const languageId = plugin.getLanguageId?.(fileName);
                if (languageId) {
                    return languageId;
                }
            }
        },
        createVirtualCode(scriptId, languageId, snapshot) {
            const fileName = asFileName(scriptId);
            if (plugins.some(plugin => plugin.isValidFile?.(fileName, languageId))) {
                const code = fileRegistry.get(String(scriptId));
                if (code) {
                    code.update(snapshot);
                    return code;
                }
                else {
                    const code = new virtualCode_1.VueVirtualCode(fileName, languageId, snapshot, vueCompilerOptions, plugins, ts);
                    fileRegistry.set(String(scriptId), code);
                    return code;
                }
            }
        },
        updateVirtualCode(_scriptId, code, snapshot) {
            code.update(snapshot);
            return code;
        },
        disposeVirtualCode(scriptId) {
            fileRegistry.delete(String(scriptId));
        },
        typescript: {
            extraFileExtensions: getAllExtensions(vueCompilerOptions)
                .map(ext => ({
                extension: ext.slice(1),
                isMixedContent: true,
                scriptKind: 7,
            })),
            getServiceScript(root) {
                for (const code of (0, language_core_1.forEachEmbeddedCode)(root)) {
                    if (/script_(js|jsx|ts|tsx)/.test(code.id)) {
                        const lang = code.id.slice('script_'.length);
                        return {
                            code,
                            extension: '.' + lang,
                            scriptKind: lang === 'js'
                                ? ts.ScriptKind.JS
                                : lang === 'jsx'
                                    ? ts.ScriptKind.JSX
                                    : lang === 'tsx'
                                        ? ts.ScriptKind.TSX
                                        : ts.ScriptKind.TS,
                        };
                    }
                }
            },
        },
    };
}
function getAllExtensions(options) {
    return [
        ...new Set([
            'extensions',
            'vitePressExtensions',
            'petiteVueExtensions',
        ].flatMap(key => options[key])),
    ];
}
//# sourceMappingURL=languagePlugin.js.map