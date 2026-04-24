"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VueVirtualCode = void 0;
const alien_signals_1 = require("alien-signals");
const plugins_1 = require("../plugins");
const embeddedCodes_1 = require("./embeddedCodes");
const ir_1 = require("./ir");
class VueVirtualCode {
    fileName;
    languageId;
    initSnapshot;
    vueCompilerOptions;
    id = 'main';
    _snapshot;
    _parsedSfcResult;
    _ir;
    _embeddedCodes;
    _mappings;
    get snapshot() {
        return this._snapshot();
    }
    get vueSfc() {
        return this._parsedSfcResult()?.result;
    }
    get sfc() {
        return this._ir;
    }
    get embeddedCodes() {
        return this._embeddedCodes();
    }
    get mappings() {
        return this._mappings();
    }
    constructor(fileName, languageId, initSnapshot, vueCompilerOptions, plugins, ts) {
        this.fileName = fileName;
        this.languageId = languageId;
        this.initSnapshot = initSnapshot;
        this.vueCompilerOptions = vueCompilerOptions;
        this._snapshot = (0, alien_signals_1.signal)(initSnapshot);
        this._parsedSfcResult = (0, alien_signals_1.computed)(lastResult => this.parseSfc(plugins, lastResult));
        this._ir = (0, ir_1.useIR)(ts, plugins, fileName, this._snapshot, () => this._parsedSfcResult()?.result);
        this._embeddedCodes = (0, embeddedCodes_1.useEmbeddedCodes)(plugins, fileName, this._ir);
        this._mappings = (0, alien_signals_1.computed)(() => {
            return [{
                    sourceOffsets: [0],
                    generatedOffsets: [0],
                    lengths: [this._snapshot().getLength()],
                    data: plugins_1.allCodeFeatures,
                }];
        });
    }
    update(newSnapshot) {
        this._snapshot(newSnapshot);
    }
    parseSfc(plugins, lastResult) {
        const snapshot = this.snapshot;
        if (lastResult?.plugin.updateSFC && !lastResult.result.errors.length) {
            const change = snapshot.getChangeRange(lastResult.snapshot);
            if (change) {
                const newSfc = lastResult.plugin.updateSFC(lastResult.result, {
                    start: change.span.start,
                    end: change.span.start + change.span.length,
                    newText: snapshot.getText(change.span.start, change.span.start + change.newLength),
                });
                if (newSfc) {
                    // force dirty
                    newSfc.descriptor = JSON.parse(JSON.stringify(newSfc.descriptor));
                    return {
                        snapshot,
                        plugin: lastResult.plugin,
                        result: newSfc,
                    };
                }
            }
        }
        for (const plugin of plugins) {
            const sfc = plugin.parseSFC2?.(this.fileName, this.languageId, snapshot.getText(0, snapshot.getLength()))
                ?? plugin.parseSFC?.(this.fileName, snapshot.getText(0, snapshot.getLength()));
            if (sfc) {
                return {
                    snapshot,
                    plugin,
                    result: sfc,
                };
            }
        }
    }
}
exports.VueVirtualCode = VueVirtualCode;
//# sourceMappingURL=index.js.map