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
exports.createTemplateCodegenContext = createTemplateCodegenContext;
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const codeFeatures_1 = require("../codeFeatures");
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const commentDirectiveRegex = /^<!--\s*@vue-(?<name>[-\w]+)\b(?<content>[\s\S]*)-->$/;
/**
 * Creates and returns a Context object used for generating type-checkable TS code
 * from the template section of a .vue file.
 *
 * ## Implementation Notes for supporting `@vue-ignore`, `@vue-expect-error`, and `@vue-skip` directives.
 *
 * Vue language tooling supports a number of directives for suppressing diagnostics within
 * Vue templates (https://github.com/vuejs/language-tools/pull/3215)
 *
 * Here is an overview for how support for how @vue-expect-error is implemented within this file
 * (@vue-expect-error is the most complicated directive to support due to its behavior of raising
 * a diagnostic when it is annotating a piece of code that doesn't actually have any errors/warning/diagnostics).
 *
 * Given .vue code:
 *
 * ```vue
 *   <script setup lang="ts">
 *   defineProps<{
 *     knownProp1: string;
 *     knownProp2: string;
 *     knownProp3: string;
 *     knownProp4_will_trigger_unused_expect_error: string;
 *   }>();
 *   </script>
 *
 *   <template>
 *     {{ knownProp1 }}
 *     {{ error_unknownProp }} <!-- ERROR: Property 'error_unknownProp' does not exist on type [...] -->
 *     {{ knownProp2 }}
 *     <!-- @vue-expect-error This suppresses an Unknown Property Error -->
 *     {{ suppressed_error_unknownProp }}
 *     {{ knownProp3 }}
 *     <!-- @vue-expect-error This will trigger Unused '@ts-expect-error' directive.ts(2578) -->
 *     {{ knownProp4_will_trigger_unused_expect_error }}
 *   </template>
 * ```
 *
 * The above code should raise two diagnostics:
 *
 * 1. Property 'error_unknownProp' does not exist on type [...]
 * 2. Unused '@ts-expect-error' directive.ts(2578) -- this is the bottom `@vue-expect-error` directive
 *    that covers code that doesn't actually raise an error -- note that all `@vue-...` directives
 *    will ultimately translate into `@ts-...` diagnostics.
 *
 * The above code will produce the following type-checkable TS code (note: omitting asterisks
 * to prevent VSCode syntax double-greying out double-commented code).
 *
 * ```ts
 *   ( __VLS_ctx.knownProp1 );
 *   ( __VLS_ctx.error_unknownProp ); // ERROR: Property 'error_unknownProp' does not exist on type [...]
 *   ( __VLS_ctx.knownProp2 );
 *   // @vue-expect-error start
 *   ( __VLS_ctx.suppressed_error_unknownProp );
 *   // @ts-expect-error __VLS_TS_EXPECT_ERROR
 *   ;
 *   // @vue-expect-error end of INTERPOLATION
 *   ( __VLS_ctx.knownProp3 );
 *   // @vue-expect-error start
 *   ( __VLS_ctx.knownProp4_will_trigger_unused_expect_error );
 *   // @ts-expect-error __VLS_TS_EXPECT_ERROR
 *   ;
 *   // @vue-expect-error end of INTERPOLATION
 * ```
 *
 * In the generated code, there are actually 3 diagnostic errors that'll be raised in the first
 * pass on this generated code (but through cleverness described below, not all of them will be
 * propagated back to the original .vue file):
 *
 * 1. Property 'error_unknownProp' does not exist on type [...]
 * 2. Unused '@ts-expect-error' directive.ts(2578) from the 1st `@ts-expect-error __VLS_TS_EXPECT_ERROR`
 * 3. Unused '@ts-expect-error' directive.ts(2578) from the 2nd `@ts-expect-error __VLS_TS_EXPECT_ERROR`
 *
 * Be sure to pay careful attention to the mixture of `@vue-expect-error` and `@ts-expect-error`;
 * Within the TS file, the only "real" directives recognized by TS are going to be prefixed with `@ts-`;
 * any `@vue-` prefixed directives in the comments are only for debugging purposes.
 *
 * As mentioned above, there are 3 diagnostics errors that'll be generated for the above code, but
 * only 2 should be propagated back to the original .vue file.
 *
 * (The reason we structure things this way is somewhat complicated, but in short it allows us
 * to lean on TS as much as possible to generate actual `unused @ts-expect-error directive` errors
 * while covering a number of edge cases.)
 *
 * So, we need a way to dynamically decide whether each of the `@ts-expect-error __VLS_TS_EXPECT_ERROR`
 * directives should be reported as an unused directive or not.
 *
 * To do this, we'll make use of the `shouldReport` callback that'll optionally be provided to the
 * `verification` property of the `CodeInformation` object attached to the mapping between source .vue
 * and generated .ts code. The `verification` property determines whether "verification" (which includes
 * semantic diagnostics) should be performed on the generated .ts code, and `shouldReport`, if provided,
 * can be used to determine whether a given diagnostic should be reported back "upwards" to the original
 * .vue file or not.
 *
 * See the comments in the code below for how and where we use this hook to keep track of whether
 * an error/diagnostic was encountered for a region of code covered by a `@vue-expect-error` directive,
 * and additionally how we use that to determine whether to propagate diagnostics back upward.
 */
function createTemplateCodegenContext() {
    let variableId = 0;
    const scopes = [];
    const components = [];
    const hoistVars = new Map();
    const dollarVars = new Set();
    const componentAccessMap = new Map();
    const slots = [];
    const dynamicSlots = [];
    const blockConditions = [];
    const inlayHints = [];
    const inheritedAttrVars = new Set();
    const templateRefs = new Map();
    const stack = [];
    const commentBuffer = [];
    return {
        generatedTypes: new Set(),
        get currentInfo() {
            return stack[stack.length - 1];
        },
        resolveCodeFeatures,
        inVFor: false,
        slots,
        dynamicSlots,
        dollarVars,
        componentAccessMap,
        blockConditions,
        inlayHints,
        inheritedAttrVars,
        templateRefs,
        singleRootElTypes: new Set(),
        singleRootNodes: new Set(),
        addTemplateRef(name, typeExp, offset) {
            let refs = templateRefs.get(name);
            if (!refs) {
                templateRefs.set(name, refs = []);
            }
            refs.push({ typeExp, offset });
        },
        recordComponentAccess(source, name, offset) {
            let map = componentAccessMap.get(name);
            if (!map) {
                componentAccessMap.set(name, map = new Map());
            }
            let arr = map.get(source);
            if (!arr) {
                map.set(source, arr = new Set());
            }
            if (offset !== undefined) {
                arr.add(offset);
            }
        },
        scopes,
        components,
        declare(...varNames) {
            const scope = scopes.at(-1);
            for (const varName of varNames) {
                scope.add(varName);
            }
        },
        startScope() {
            const scope = new Set();
            scopes.push(scope);
            return () => {
                scopes.pop();
                return generateAutoImport();
            };
        },
        getInternalVariable() {
            return `__VLS_${variableId++}`;
        },
        getHoistVariable(originalVar) {
            let name = hoistVars.get(originalVar);
            if (name === undefined) {
                hoistVars.set(originalVar, name = `__VLS_${variableId++}`);
            }
            return name;
        },
        *generateHoistVariables() {
            // trick to avoid TS 4081 (#5186)
            if (hoistVars.size) {
                yield `// @ts-ignore${utils_1.newLine}`;
                yield `var `;
                for (const [originalVar, hoistVar] of hoistVars) {
                    yield `${hoistVar} = ${originalVar}, `;
                }
                yield utils_1.endOfLine;
            }
        },
        *generateConditionGuards() {
            for (const condition of blockConditions) {
                yield `if (!${condition}) return${utils_1.endOfLine}`;
            }
        },
        enter(node) {
            if (node.type === CompilerDOM.NodeTypes.COMMENT) {
                commentBuffer.push(node);
                return false;
            }
            const data = {};
            const comments = [...commentBuffer];
            commentBuffer.length = 0;
            for (const comment of comments) {
                const match = comment.loc.source.match(commentDirectiveRegex);
                if (match) {
                    const { name, content } = match.groups;
                    switch (name) {
                        case 'skip': {
                            return false;
                        }
                        case 'ignore': {
                            data.ignoreError = true;
                            break;
                        }
                        case 'expect-error': {
                            data.expectError = {
                                token: 0,
                                node: comment,
                            };
                            break;
                        }
                        case 'generic': {
                            const text = content.trim();
                            if (text.startsWith('{') && text.endsWith('}')) {
                                data.generic = {
                                    content: text.slice(1, -1),
                                    offset: comment.loc.start.offset + comment.loc.source.indexOf('{') + 1,
                                };
                            }
                            break;
                        }
                    }
                }
            }
            stack.push(data);
            return true;
        },
        *exit() {
            const data = stack.pop();
            commentBuffer.length = 0;
            if (data.expectError !== undefined) {
                const token = yield* (0, boundary_1.startBoundary)('template', data.expectError.node.loc.start.offset, {
                    verification: {
                        // If no errors/warnings/diagnostics were reported within the region of code covered
                        // by the @vue-expect-error directive, then we should allow any `unused @ts-expect-error`
                        // diagnostics to be reported upward.
                        shouldReport: () => data.expectError.token === 0,
                    },
                });
                yield `// @ts-expect-error`;
                yield (0, boundary_1.endBoundary)(token, data.expectError.node.loc.end.offset);
                yield `${utils_1.newLine}${utils_1.endOfLine}`;
            }
        },
    };
    function* generateAutoImport() {
        const all = [...componentAccessMap.entries()];
        if (!all.some(([, offsets]) => offsets.size)) {
            return;
        }
        yield `// @ts-ignore${utils_1.newLine}`; // #2304
        yield `[`;
        for (const [varName, map] of all) {
            for (const [source, offsets] of map) {
                for (const offset of offsets) {
                    yield [varName, source, offset, codeFeatures_1.codeFeatures.importCompletionOnly];
                    yield `,`;
                }
                offsets.clear();
            }
        }
        yield `]${utils_1.endOfLine}`;
    }
    function resolveCodeFeatures(features) {
        if (features.verification && stack.length) {
            const data = stack[stack.length - 1];
            if (data.ignoreError) {
                // We are currently in a region of code covered by a @vue-ignore directive, so don't
                // even bother performing any type-checking: set verification to false.
                return {
                    ...features,
                    verification: false,
                };
            }
            if (data.expectError !== undefined) {
                // We are currently in a region of code covered by a @vue-expect-error directive. We need to
                // keep track of the number of errors encountered within this region so that we can know whether
                // we will need to propagate an "unused ts-expect-error" diagnostic back to the original
                // .vue file or not.
                return {
                    ...features,
                    verification: {
                        shouldReport: (source, code) => {
                            if (typeof features.verification !== 'object'
                                || !features.verification.shouldReport
                                || features.verification.shouldReport(source, code) === true) {
                                data.expectError.token++;
                            }
                            return false;
                        },
                    },
                };
            }
        }
        return features;
    }
}
//# sourceMappingURL=context.js.map