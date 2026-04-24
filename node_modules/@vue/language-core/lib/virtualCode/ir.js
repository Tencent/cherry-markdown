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
exports.useIR = useIR;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const alien_signals_1 = require("alien-signals");
const signals_1 = require("../utils/signals");
const normalize_1 = require("./normalize");
function useIR(ts, plugins, fileName, getSnapshot, getParseSfcResult) {
    const getUntrackedSnapshot = () => {
        const pausedSub = (0, alien_signals_1.setActiveSub)(undefined);
        const res = getSnapshot();
        (0, alien_signals_1.setActiveSub)(pausedSub);
        return res;
    };
    const getContent = (0, alien_signals_1.computed)(() => {
        return getSnapshot().getText(0, getSnapshot().getLength());
    });
    const getComments = (0, signals_1.computedArray)(() => {
        return getParseSfcResult()?.descriptor.comments ?? [];
    });
    const getTemplate = useNullableSfcBlock('template', 'html', (0, alien_signals_1.computed)(() => getParseSfcResult()?.descriptor.template ?? undefined), (_block, base) => {
        const getParseTemplateResult = useParseTemplateResult(base);
        return mergeObject(base, {
            get ast() {
                return getParseTemplateResult().result?.ast;
            },
            get errors() {
                return getParseTemplateResult().errors;
            },
            get warnings() {
                return getParseTemplateResult().warnings;
            },
        });
    });
    const getScript = useNullableSfcBlock('script', 'js', (0, alien_signals_1.computed)(() => getParseSfcResult()?.descriptor.script ?? undefined), (block, base) => {
        const getSrc = useAttrValue('__src', base, block);
        const getAst = (0, alien_signals_1.computed)(() => {
            for (const plugin of plugins) {
                const ast = plugin.compileSFCScript?.(base.lang, base.content);
                if (ast) {
                    return ast;
                }
            }
            return ts.createSourceFile(fileName + '.' + base.lang, '', 99);
        });
        return mergeObject(base, {
            get src() {
                return getSrc();
            },
            get ast() {
                return getAst();
            },
        });
    });
    const getOriginalScriptSetup = useNullableSfcBlock('scriptSetup', 'js', (0, alien_signals_1.computed)(() => getParseSfcResult()?.descriptor.scriptSetup ?? undefined), (block, base) => {
        const getGeneric = useAttrValue('__generic', base, block);
        const getAst = (0, alien_signals_1.computed)(() => {
            for (const plugin of plugins) {
                const ast = plugin.compileSFCScript?.(base.lang, base.content);
                if (ast) {
                    return ast;
                }
            }
            return ts.createSourceFile(fileName + '.' + base.lang, '', 99);
        });
        return mergeObject(base, {
            get generic() {
                return getGeneric();
            },
            get ast() {
                return getAst();
            },
        });
    });
    const hasScript = (0, alien_signals_1.computed)(() => !!getParseSfcResult()?.descriptor.script);
    const hasScriptSetup = (0, alien_signals_1.computed)(() => !!getParseSfcResult()?.descriptor.scriptSetup);
    const getScriptSetup = (0, alien_signals_1.computed)(() => {
        if (!hasScript() && !hasScriptSetup()) {
            // #region monkey fix: https://github.com/vuejs/language-tools/pull/2113
            return {
                content: '',
                lang: 'ts',
                name: '',
                start: 0,
                end: 0,
                startTagEnd: 0,
                endTagStart: 0,
                generic: undefined,
                genericOffset: 0,
                attrs: {},
                ast: ts.createSourceFile('', '', 99, false, ts.ScriptKind.TS),
            };
        }
        return getOriginalScriptSetup();
    });
    const styles = (0, signals_1.reactiveArray)(() => getParseSfcResult()?.descriptor.styles ?? [], (getBlock, i) => {
        const base = useSfcBlock('style_' + i, 'css', getBlock);
        const getSrc = useAttrValue('__src', base, getBlock);
        const getModule = useAttrValue('__module', base, getBlock);
        const getScoped = (0, alien_signals_1.computed)(() => !!getBlock().scoped);
        const getIr = (0, alien_signals_1.computed)(() => {
            for (const plugin of plugins) {
                const ast = plugin.compileSFCStyle?.(base.lang, base.content);
                if (ast) {
                    return ast;
                }
            }
        });
        const getImports = (0, signals_1.computedArray)(() => getIr()?.imports ?? [], (oldItem, newItem) => oldItem.text === newItem.text && oldItem.offset === newItem.offset);
        const getBindings = (0, signals_1.computedArray)(() => getIr()?.bindings ?? [], (oldItem, newItem) => oldItem.text === newItem.text && oldItem.offset === newItem.offset);
        const getClassNames = (0, signals_1.computedArray)(() => getIr()?.classNames ?? [], (oldItem, newItem) => oldItem.text === newItem.text && oldItem.offset === newItem.offset);
        return () => mergeObject(base, {
            get src() {
                return getSrc();
            },
            get module() {
                return getModule();
            },
            get scoped() {
                return getScoped();
            },
            get imports() {
                return getImports();
            },
            get bindings() {
                return getBindings();
            },
            get classNames() {
                return getClassNames();
            },
        });
    });
    const customBlocks = (0, signals_1.reactiveArray)(() => getParseSfcResult()?.descriptor.customBlocks ?? [], (getBlock, i) => {
        const base = useSfcBlock('custom_block_' + i, 'txt', getBlock);
        const getType = (0, alien_signals_1.computed)(() => getBlock().type);
        return () => mergeObject(base, {
            get type() {
                return getType();
            },
        });
    });
    return {
        get content() {
            return getContent();
        },
        get comments() {
            return getComments();
        },
        get template() {
            return getTemplate();
        },
        get script() {
            return getScript();
        },
        get scriptSetup() {
            return getScriptSetup();
        },
        get styles() {
            return styles;
        },
        get customBlocks() {
            return customBlocks;
        },
    };
    function useParseTemplateResult(base) {
        return (0, alien_signals_1.computed)(lastResult => {
            if (lastResult?.template === base.content) {
                return lastResult;
            }
            // incremental update
            if (lastResult?.result && lastResult.plugin?.updateSFCTemplate
                && !lastResult.errors.length
                && !lastResult.warnings.length) {
                const change = getUntrackedSnapshot().getChangeRange(lastResult.snapshot);
                if (change) {
                    const pausedSub = (0, alien_signals_1.setActiveSub)(undefined);
                    const templateOffset = base.startTagEnd;
                    (0, alien_signals_1.setActiveSub)(pausedSub);
                    const newText = getUntrackedSnapshot().getText(change.span.start, change.span.start + change.newLength);
                    const newResult = lastResult.plugin.updateSFCTemplate(lastResult.result, {
                        start: change.span.start - templateOffset,
                        end: change.span.start - templateOffset + change.span.length,
                        newText,
                    });
                    if (newResult) {
                        return {
                            snapshot: getUntrackedSnapshot(),
                            template: base.content,
                            result: newResult,
                            plugin: lastResult.plugin,
                            errors: [],
                            warnings: [],
                        };
                    }
                }
            }
            const errors = [];
            const warnings = [];
            const [nodeTransforms, directiveTransforms] = CompilerDOM.getBaseTransformPreset();
            let options = {
                onError: err => errors.push(err),
                onWarn: err => warnings.push(err),
                expressionPlugins: ['typescript'],
                nodeTransforms,
                directiveTransforms,
            };
            for (const plugin of plugins) {
                if (plugin.resolveTemplateCompilerOptions) {
                    options = plugin.resolveTemplateCompilerOptions(options);
                }
            }
            for (const plugin of plugins) {
                try {
                    const result = plugin.compileSFCTemplate?.(base.lang, base.content, options);
                    if (result) {
                        (0, normalize_1.normalizeTemplateAST)(result.ast);
                        return {
                            snapshot: getUntrackedSnapshot(),
                            template: base.content,
                            result,
                            plugin,
                            errors,
                            warnings,
                        };
                    }
                }
                catch (e) {
                    return {
                        snapshot: getUntrackedSnapshot(),
                        template: base.content,
                        plugin,
                        errors: [e],
                        warnings,
                    };
                }
            }
            return {
                snapshot: getUntrackedSnapshot(),
                template: base.content,
                errors,
                warnings,
            };
        });
    }
    function useNullableSfcBlock(name, defaultLang, getBlock, resolve) {
        const hasBlock = (0, alien_signals_1.computed)(() => !!getBlock());
        return (0, alien_signals_1.computed)(() => {
            if (!hasBlock()) {
                return;
            }
            const _block = (0, alien_signals_1.computed)(() => getBlock());
            return resolve(_block, useSfcBlock(name, defaultLang, _block));
        });
    }
    function useSfcBlock(name, defaultLang, getBlock) {
        const getLang = (0, alien_signals_1.computed)(() => getBlock().lang ?? defaultLang);
        const getAttrs = (0, alien_signals_1.computed)(() => getBlock().attrs); // TODO: computed it
        const getContent = (0, alien_signals_1.computed)(() => getBlock().content);
        const getStartTagEnd = (0, alien_signals_1.computed)(() => getBlock().loc.start.offset);
        const getEndTagStart = (0, alien_signals_1.computed)(() => getBlock().loc.end.offset);
        const getStart = (0, alien_signals_1.computed)(() => getUntrackedSnapshot().getText(0, getStartTagEnd()).lastIndexOf('<' + getBlock().type));
        const getEnd = (0, alien_signals_1.computed)(() => getEndTagStart()
            + getUntrackedSnapshot().getText(getEndTagStart(), getUntrackedSnapshot().getLength()).indexOf('>') + 1);
        return {
            name,
            get lang() {
                return getLang();
            },
            get attrs() {
                return getAttrs();
            },
            get content() {
                return getContent();
            },
            get startTagEnd() {
                return getStartTagEnd();
            },
            get endTagStart() {
                return getEndTagStart();
            },
            get start() {
                return getStart();
            },
            get end() {
                return getEnd();
            },
        };
    }
    function useAttrValue(key, base, getBlock) {
        return (0, alien_signals_1.computed)(() => {
            const val = getBlock()[key];
            if (typeof val === 'object') {
                return {
                    ...val,
                    offset: base.start + val.offset,
                };
            }
            return val;
        });
    }
}
function mergeObject(a, b) {
    return Object.defineProperties(a, Object.getOwnPropertyDescriptors(b));
}
//# sourceMappingURL=ir.js.map