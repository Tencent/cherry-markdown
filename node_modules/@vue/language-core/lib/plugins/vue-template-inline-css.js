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
const CompilerDOM = __importStar(require("@vue/compiler-dom"));
const forEachTemplateNode_1 = require("../utils/forEachTemplateNode");
const shared_1 = require("../utils/shared");
const shared_2 = require("./shared");
const codeFeatures = {
    ...shared_2.allCodeFeatures,
    format: false,
    structure: false,
};
const plugin = () => {
    return {
        version: 2.2,
        getEmbeddedCodes(_fileName, sfc) {
            if (!sfc.template?.ast) {
                return [];
            }
            return [{ id: 'template_inline_css', lang: 'css' }];
        },
        resolveEmbeddedCode(_fileName, sfc, embeddedFile) {
            if (embeddedFile.id !== 'template_inline_css' || !sfc.template?.ast) {
                return;
            }
            embeddedFile.parentCodeId = sfc.template.lang === 'md' ? 'root_tags' : 'template';
            embeddedFile.content.push(...generate(sfc.template.ast));
        },
    };
};
exports.default = plugin;
function* generate(templateAst) {
    for (const node of (0, forEachTemplateNode_1.forEachElementNode)(templateAst)) {
        for (const prop of node.props) {
            if (prop.type === CompilerDOM.NodeTypes.ATTRIBUTE
                && prop.name === 'style'
                && prop.value) {
                yield `x { `;
                const [content, offset] = (0, shared_1.normalizeAttributeValue)(prop.value);
                yield [content, 'template', offset, codeFeatures];
                yield ` }\n`;
            }
        }
    }
}
//# sourceMappingURL=vue-template-inline-css.js.map