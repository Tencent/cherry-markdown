"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createScriptCodegenContext = createScriptCodegenContext;
const localTypes_1 = require("../localTypes");
function createScriptCodegenContext(options) {
    const localTypes = (0, localTypes_1.getLocalTypesGenerator)(options.vueCompilerOptions);
    const inlayHints = [];
    return {
        generatedTypes: new Set(),
        localTypes,
        inlayHints,
    };
}
//# sourceMappingURL=context.js.map