"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RspackDevServer = void 0;
const core_1 = require("@rspack/core");
const webpack_dev_server_1 = __importDefault(require("webpack-dev-server"));
// @ts-ignore 'package.json' is not under 'rootDir'
const package_json_1 = require("../package.json");
const patch_1 = require("./patch");
(0, patch_1.applyDevServerPatch)();
const getFreePort = async function getFreePort(port, host) {
    if (typeof port !== "undefined" && port !== null && port !== "auto") {
        return port;
    }
    const { default: pRetry } = await import("p-retry");
    const getPort = require("webpack-dev-server/lib/getPort");
    const basePort = typeof process.env.WEBPACK_DEV_SERVER_BASE_PORT !== "undefined"
        ? Number.parseInt(process.env.WEBPACK_DEV_SERVER_BASE_PORT, 10)
        : 8080;
    // Try to find unused port and listen on it for 3 times,
    // if port is not specified in options.
    const defaultPortRetry = typeof process.env.WEBPACK_DEV_SERVER_PORT_RETRY !== "undefined"
        ? Number.parseInt(process.env.WEBPACK_DEV_SERVER_PORT_RETRY, 10)
        : 3;
    return pRetry(() => getPort(basePort, host), {
        retries: defaultPortRetry,
    });
};
webpack_dev_server_1.default.getFreePort = getFreePort;
class RspackDevServer extends webpack_dev_server_1.default {
    constructor(options, compiler) {
        // biome-ignore lint/suspicious/noExplicitAny: _
        super(options, compiler);
        // override
    }
    async initialize() {
        const compilers = this.compiler instanceof core_1.MultiCompiler
            ? this.compiler.compilers
            : [this.compiler];
        for (const compiler of compilers) {
            const mode = compiler.options.mode || process.env.NODE_ENV;
            if (this.options.hot) {
                if (mode === "production") {
                    this.logger.warn("Hot Module Replacement (HMR) is enabled for the production build. \n" +
                        "Make sure to disable HMR for production by setting `devServer.hot` to `false` in the configuration.");
                }
                compiler.options.resolve.alias = {
                    "ansi-html-community": require.resolve("@rspack/dev-server/client/utils/ansiHTML"),
                    ...compiler.options.resolve.alias,
                };
            }
        }
        // @ts-expect-error
        await super.initialize();
    }
    getClientEntry() {
        return require.resolve("@rspack/dev-server/client/index");
    }
    getClientHotEntry() {
        if (this.options.hot === "only") {
            return require.resolve("@rspack/core/hot/only-dev-server");
        }
        if (this.options.hot) {
            return require.resolve("@rspack/core/hot/dev-server");
        }
    }
}
RspackDevServer.getFreePort = getFreePort;
RspackDevServer.version = package_json_1.version;
exports.RspackDevServer = RspackDevServer;
