"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugin = ({ modules }) => {
    return {
        version: 2.2,
        compileSFCScript(lang, script) {
            if (lang === 'js' || lang === 'ts' || lang === 'jsx' || lang === 'tsx') {
                const ts = modules.typescript;
                return ts.createSourceFile('.' + lang, script, 99);
            }
        },
    };
};
exports.default = plugin;
//# sourceMappingURL=vue-script-js.js.map