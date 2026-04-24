"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyDevServerPatch = void 0;
const webpack_dev_server_1 = __importDefault(require("webpack-dev-server"));
let old;
function restoreDevServerPatch() {
    // @ts-expect-error private API
    webpack_dev_server_1.default.prototype.sendStats = old;
}
// Patch webpack-dev-server to prevent it from failing to send stats.
// See https://github.com/web-infra-dev/rspack/pull/4028 for details.
function applyDevServerPatch() {
    if (old)
        return restoreDevServerPatch;
    // @ts-expect-error private API
    old = webpack_dev_server_1.default.prototype.sendStats;
    // @ts-expect-error private API
    webpack_dev_server_1.default.prototype.sendStats = function sendStats__rspack_patched(
    // @ts-expect-error
    ...args) {
        const stats = args[1];
        if (!stats) {
            return;
        }
        return old.apply(this, args);
    };
    return restoreDevServerPatch;
}
exports.applyDevServerPatch = applyDevServerPatch;
