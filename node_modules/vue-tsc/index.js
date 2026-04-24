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
exports.run = run;
const runTsc_1 = require("@volar/typescript/lib/quickstart/runTsc");
const core = __importStar(require("@vue/language-core"));
const windowsPathReg = /\\/g;
function run(tscPath = require.resolve('typescript/lib/tsc')) {
    let runExtensions = ['.vue'];
    let extensionsChangedException;
    const main = () => (0, runTsc_1.runTsc)(tscPath, runExtensions, (ts, options) => {
        const { configFilePath } = options.options;
        const vueOptions = typeof configFilePath === 'string'
            ? core.createParsedCommandLine(ts, ts.sys, configFilePath.replace(windowsPathReg, '/')).vueOptions
            : core.createParsedCommandLineByJson(ts, ts.sys, (options.host ?? ts.sys).getCurrentDirectory(), {})
                .vueOptions;
        const allExtensions = core.getAllExtensions(vueOptions);
        if (runExtensions.length === allExtensions.length
            && runExtensions.every(ext => allExtensions.includes(ext))) {
            const vueLanguagePlugin = core.createVueLanguagePlugin(ts, options.options, vueOptions, id => id);
            return { languagePlugins: [vueLanguagePlugin] };
        }
        else {
            runExtensions = allExtensions;
            throw extensionsChangedException = new Error('extensions changed');
        }
    });
    try {
        return main();
    }
    catch (err) {
        if (err === extensionsChangedException) {
            return main();
        }
        else {
            throw err;
        }
    }
}
//# sourceMappingURL=index.js.map