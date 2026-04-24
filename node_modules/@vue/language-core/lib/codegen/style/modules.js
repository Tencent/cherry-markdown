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
exports.generateStyleModules = generateStyleModules;
const codeFeatures_1 = require("../codeFeatures");
const names = __importStar(require("../names"));
const utils_1 = require("../utils");
const common_1 = require("./common");
function* generateStyleModules({ styles, vueCompilerOptions }, ctx) {
    const styleModules = styles.filter(style => style.module);
    if (!styleModules.length) {
        return;
    }
    ctx.generatedTypes.add(names.StyleModules);
    yield `type ${names.StyleModules} = {${utils_1.newLine}`;
    for (const style of styleModules) {
        if (style.module === true) {
            yield `$style`;
        }
        else {
            const { text, offset } = style.module;
            yield [
                text,
                'main',
                offset,
                codeFeatures_1.codeFeatures.navigation,
            ];
        }
        yield `: `;
        if (!vueCompilerOptions.strictCssModules) {
            yield `Record<string, string> & `;
        }
        yield `__VLS_PrettifyGlobal<{}`;
        if (vueCompilerOptions.resolveStyleImports) {
            yield* (0, common_1.generateStyleImports)(style);
        }
        for (const className of style.classNames) {
            yield* (0, common_1.generateClassProperty)(style.name, className.text, className.offset, 'string');
        }
        yield `>${utils_1.endOfLine}`;
    }
    yield `}${utils_1.endOfLine}`;
}
//# sourceMappingURL=modules.js.map