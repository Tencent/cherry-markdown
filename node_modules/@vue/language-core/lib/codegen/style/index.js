"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateStyle = generate;
const codeFeatures_1 = require("../codeFeatures");
const modules_1 = require("../style/modules");
const scopedClasses_1 = require("../style/scopedClasses");
const context_1 = require("../template/context");
const interpolation_1 = require("../template/interpolation");
const utils_1 = require("../utils");
function generate(options) {
    const ctx = (0, context_1.createTemplateCodegenContext)();
    const codeGenerator = generateWorker(options, ctx);
    const codes = [];
    for (const code of codeGenerator) {
        if (typeof code === 'object') {
            code[3] = ctx.resolveCodeFeatures(code[3]);
        }
        codes.push(code);
    }
    return { ...ctx, codes };
}
function* generateWorker(options, ctx) {
    const endScope = ctx.startScope();
    ctx.declare(...options.setupConsts);
    yield* (0, scopedClasses_1.generateStyleScopedClasses)(options);
    yield* (0, modules_1.generateStyleModules)(options, ctx);
    yield* generateCssVars(options, ctx);
    yield* endScope();
}
function* generateCssVars(options, ctx) {
    for (const style of options.styles) {
        for (const binding of style.bindings) {
            yield* (0, interpolation_1.generateInterpolation)(options, ctx, style, codeFeatures_1.codeFeatures.all, binding.text, binding.offset, `(`, `)`);
            yield utils_1.endOfLine;
        }
    }
}
//# sourceMappingURL=index.js.map