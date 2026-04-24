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
exports.generateScript = generate;
const path = __importStar(require("path-browserify"));
const codeFeatures_1 = require("../codeFeatures");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const boundary_1 = require("../utils/boundary");
const context_1 = require("./context");
const scriptSetup_1 = require("./scriptSetup");
const template_1 = require("./template");
const exportExpression = `{} as typeof ${names._export}`;
function generate(options) {
    const ctx = (0, context_1.createScriptCodegenContext)(options);
    const codeGenerator = generateWorker(options, ctx);
    return { ...ctx, codes: [...codeGenerator] };
}
function* generateWorker(options, ctx) {
    const { script, scriptRanges, scriptSetup, scriptSetupRanges, vueCompilerOptions, fileName } = options;
    yield* generateGlobalTypesReference(vueCompilerOptions, fileName);
    // <script src="">
    if (typeof script?.src === 'object') {
        let src = script.src.text;
        if (src.endsWith('.ts') && !src.endsWith('.d.ts')) {
            src = src.slice(0, -'.ts'.length) + '.js';
        }
        else if (src.endsWith('.tsx')) {
            src = src.slice(0, -'.tsx'.length) + '.jsx';
        }
        yield `import __VLS_default from `;
        const token = yield* (0, boundary_1.startBoundary)('main', script.src.offset, {
            ...codeFeatures_1.codeFeatures.all,
            ...src !== script.src.text ? codeFeatures_1.codeFeatures.navigationWithoutRename : {},
        });
        yield `'`;
        yield [src.slice(0, script.src.text.length), 'main', script.src.offset, { __combineToken: token }];
        yield src.slice(script.src.text.length);
        yield `'`;
        yield (0, boundary_1.endBoundary)(token, script.src.offset + script.src.text.length);
        yield utils_1.endOfLine;
        yield `export default __VLS_default;${utils_1.endOfLine}`;
        yield* (0, template_1.generateTemplate)(options, ctx, '__VLS_default');
    }
    // <script> + <script setup>
    else if (script && scriptRanges && scriptSetup && scriptSetupRanges) {
        yield* (0, scriptSetup_1.generateScriptSetupImports)(scriptSetup, scriptSetupRanges);
        // <script>
        let selfType;
        const { exportDefault } = scriptRanges;
        if (exportDefault) {
            yield* generateScriptWithExportDefault(ctx, script, scriptRanges, exportDefault, vueCompilerOptions, selfType = '__VLS_self');
        }
        else {
            yield* (0, utils_1.generateSfcBlockSection)(script, 0, script.content.length, codeFeatures_1.codeFeatures.all);
            yield `export default ${exportExpression}${utils_1.endOfLine}`;
        }
        // <script setup>
        yield* generateExportDeclareEqual(scriptSetup, names._export);
        if (scriptSetup.generic) {
            yield* (0, scriptSetup_1.generateGeneric)(options, ctx, scriptSetup, scriptSetupRanges, scriptSetup.generic, (0, scriptSetup_1.generateSetupFunction)(options, ctx, scriptSetup, scriptSetupRanges, (0, template_1.generateTemplate)(options, ctx, selfType)));
        }
        else {
            yield `await (async () => {${utils_1.newLine}`;
            yield* (0, scriptSetup_1.generateSetupFunction)(options, ctx, scriptSetup, scriptSetupRanges, (0, template_1.generateTemplate)(options, ctx, selfType), [`return `]);
            yield `})()${utils_1.endOfLine}`;
        }
    }
    // only <script setup>
    else if (scriptSetup && scriptSetupRanges) {
        yield* (0, scriptSetup_1.generateScriptSetupImports)(scriptSetup, scriptSetupRanges);
        if (scriptSetup.generic) {
            yield* generateExportDeclareEqual(scriptSetup, names._export);
            yield* (0, scriptSetup_1.generateGeneric)(options, ctx, scriptSetup, scriptSetupRanges, scriptSetup.generic, (0, scriptSetup_1.generateSetupFunction)(options, ctx, scriptSetup, scriptSetupRanges, (0, template_1.generateTemplate)(options, ctx)));
        }
        else {
            // no script block, generate script setup code at root
            yield* (0, scriptSetup_1.generateSetupFunction)(options, ctx, scriptSetup, scriptSetupRanges, (0, template_1.generateTemplate)(options, ctx), generateExportDeclareEqual(scriptSetup, names._export));
        }
        yield `export default ${exportExpression}${utils_1.endOfLine}`;
    }
    // only <script>
    else if (script && scriptRanges) {
        const { exportDefault } = scriptRanges;
        if (exportDefault) {
            yield* generateScriptWithExportDefault(ctx, script, scriptRanges, exportDefault, vueCompilerOptions, names._export, (0, template_1.generateTemplate)(options, ctx, names._export));
        }
        else {
            yield* (0, utils_1.generateSfcBlockSection)(script, 0, script.content.length, codeFeatures_1.codeFeatures.all);
            yield* generateExportDeclareEqual(script, names._export);
            yield `(await import('${vueCompilerOptions.lib}')).defineComponent({})${utils_1.endOfLine}`;
            yield* (0, template_1.generateTemplate)(options, ctx, names._export);
            yield `export default ${exportExpression}${utils_1.endOfLine}`;
        }
    }
    yield* ctx.localTypes.generate();
}
function* generateScriptWithExportDefault(ctx, script, scriptRanges, exportDefault, vueCompilerOptions, varName, templateGenerator) {
    const componentOptions = scriptRanges.exportDefault?.options;
    const { expression, isObjectLiteral } = componentOptions ?? exportDefault;
    let wrapLeft;
    let wrapRight;
    if (isObjectLiteral
        && vueCompilerOptions.optionsWrapper.length) {
        [wrapLeft, wrapRight] = vueCompilerOptions.optionsWrapper;
        ctx.inlayHints.push({
            blockName: script.name,
            offset: expression.start,
            setting: 'vue.inlayHints.optionsWrapper',
            label: wrapLeft || '[Missing optionsWrapper[0]]',
            tooltip: [
                'This is virtual code that is automatically wrapped for type support, it does not affect your runtime behavior, you can customize it via `vueCompilerOptions.optionsWrapper` option in tsconfig / jsconfig.',
                'To hide it, you can set `"vue.inlayHints.optionsWrapper": false` in IDE settings.',
            ].join('\n\n'),
        }, {
            blockName: script.name,
            offset: expression.end,
            setting: 'vue.inlayHints.optionsWrapper',
            label: wrapRight || '[Missing optionsWrapper[1]]',
        });
    }
    yield* (0, utils_1.generateSfcBlockSection)(script, 0, expression.start, codeFeatures_1.codeFeatures.all);
    yield exportExpression;
    yield* (0, utils_1.generateSfcBlockSection)(script, expression.end, exportDefault.end, codeFeatures_1.codeFeatures.all);
    yield utils_1.endOfLine;
    if (templateGenerator) {
        yield* templateGenerator;
    }
    yield* generateExportDeclareEqual(script, varName);
    if (wrapLeft && wrapRight) {
        yield wrapLeft;
        yield* (0, utils_1.generateSfcBlockSection)(script, expression.start, expression.end, codeFeatures_1.codeFeatures.all);
        yield wrapRight;
    }
    else {
        yield* (0, utils_1.generateSfcBlockSection)(script, expression.start, expression.end, codeFeatures_1.codeFeatures.all);
    }
    yield utils_1.endOfLine;
    yield* (0, utils_1.generateSfcBlockSection)(script, exportDefault.end, script.content.length, codeFeatures_1.codeFeatures.all);
}
function* generateGlobalTypesReference({ typesRoot, lib, target, checkUnknownProps }, fileName) {
    let typesPath;
    if (path.isAbsolute(typesRoot)) {
        let relativePath = path.relative(path.dirname(fileName), typesRoot);
        if (relativePath !== typesRoot
            && !relativePath.startsWith('./')
            && !relativePath.startsWith('../')) {
            relativePath = './' + relativePath;
        }
        typesPath = relativePath;
    }
    else {
        typesPath = typesRoot;
    }
    yield `/// <reference types=${JSON.stringify(typesPath + '/template-helpers.d.ts')} />${utils_1.newLine}`;
    if (!checkUnknownProps) {
        yield `/// <reference types=${JSON.stringify(typesPath + '/props-fallback.d.ts')} />${utils_1.newLine}`;
    }
    if (lib === 'vue' && target < 3.5) {
        yield `/// <reference types=${JSON.stringify(typesPath + '/vue-3.4-shims.d.ts')} />${utils_1.newLine}`;
    }
}
function* generateExportDeclareEqual(block, name) {
    yield `const `;
    const token = yield* (0, boundary_1.startBoundary)(block.name, 0, codeFeatures_1.codeFeatures.doNotReportTs6133);
    yield name;
    yield (0, boundary_1.endBoundary)(token, block.content.length);
    yield ` = `;
}
//# sourceMappingURL=index.js.map