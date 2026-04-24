// @ts-nocheck
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import hotEmitter from "@rspack/core/hot/emitter.js";
/* global __resourceQuery, __webpack_hash__ */
/* Rspack dev server runtime client */
/// <reference types="webpack/module" />
import webpackHotLog from "@rspack/core/hot/log.js";
import { createOverlay, formatProblem, } from "webpack-dev-server/client/overlay.js";
import socket from "webpack-dev-server/client/socket.js";
import { defineProgressElement, isProgressSupported, } from "webpack-dev-server/client/progress.js";
import { log, setLogLevel } from "webpack-dev-server/client/utils/log.js";
import sendMessage from "webpack-dev-server/client/utils/sendMessage.js";
/**
 * @typedef {Object} OverlayOptions
 * @property {boolean | (error: Error) => boolean} [warnings]
 * @property {boolean | (error: Error) => boolean} [errors]
 * @property {boolean | (error: Error) => boolean} [runtimeErrors]
 * @property {string} [trustedTypesPolicyName]
 */
/**
 * @typedef {Object} Options
 * @property {boolean} hot
 * @property {boolean} liveReload
 * @property {boolean} progress
 * @property {boolean | OverlayOptions} overlay
 * @property {string} [logging]
 * @property {number} [reconnect]
 */
/**
 * @typedef {Object} Status
 * @property {boolean} isUnloading
 * @property {string} currentHash
 * @property {string} [previousHash]
 */
/**
 * @param {boolean | { warnings?: boolean | string; errors?: boolean | string; runtimeErrors?: boolean | string; }} overlayOptions
 */
var decodeOverlayOptions = function (overlayOptions) {
    if (typeof overlayOptions === "object") {
        ["warnings", "errors", "runtimeErrors"].forEach(function (property) {
            if (typeof overlayOptions[property] === "string") {
                var overlayFilterFunctionString = decodeURIComponent(overlayOptions[property]);
                // eslint-disable-next-line no-new-func
                overlayOptions[property] = new Function("message", "var callback = ".concat(overlayFilterFunctionString, "\n\t\t\t\treturn callback(message)"));
            }
        });
    }
};
/**
 * @param {string} resourceQuery
 * @returns {{ [key: string]: string | boolean }}
 */
var parseURL = function (resourceQuery) {
    /** @type {{ [key: string]: string }} */
    var result = {};
    if (typeof resourceQuery === "string" && resourceQuery !== "") {
        var searchParams = resourceQuery.slice(1).split("&");
        for (var i = 0; i < searchParams.length; i++) {
            var pair = searchParams[i].split("=");
            result[pair[0]] = decodeURIComponent(pair[1]);
        }
    }
    else {
        // Else, get the url from the <script> this file was called with.
        var scriptSource = getCurrentScriptSource();
        var scriptSourceURL = void 0;
        try {
            // The placeholder `baseURL` with `window.location.href`,
            // is to allow parsing of path-relative or protocol-relative URLs,
            // and will have no effect if `scriptSource` is a fully valid URL.
            scriptSourceURL = new URL(scriptSource, self.location.href);
        }
        catch (error) {
            // URL parsing failed, do nothing.
            // We will still proceed to see if we can recover using `resourceQuery`
        }
        if (scriptSourceURL) {
            result = scriptSourceURL;
            result.fromCurrentScript = true;
        }
    }
    return result;
};
/**
 * @type {Status}
 */
var status = {
    isUnloading: false,
    // eslint-disable-next-line camelcase
    currentHash: __webpack_hash__,
};
/**
 * @returns {string}
 */
var getCurrentScriptSource = function () {
    // `document.currentScript` is the most accurate way to find the current script,
    // but is not supported in all browsers.
    if (document.currentScript) {
        return document.currentScript.getAttribute("src");
    }
    // Fallback to getting all scripts running in the document.
    var scriptElements = document.scripts || [];
    var scriptElementsWithSrc = Array.prototype.filter.call(scriptElements, function (element) { return element.getAttribute("src"); });
    if (scriptElementsWithSrc.length > 0) {
        var currentScript = scriptElementsWithSrc[scriptElementsWithSrc.length - 1];
        return currentScript.getAttribute("src");
    }
    // Fail as there was no script to use.
    throw new Error("[webpack-dev-server] Failed to get current script source.");
};
var parsedResourceQuery = parseURL(__resourceQuery);
var enabledFeatures = {
    "Hot Module Replacement": false,
    "Live Reloading": false,
    Progress: false,
    Overlay: false,
};
/** @type {Options} */
var options = {
    hot: false,
    liveReload: false,
    progress: false,
    overlay: false,
};
if (parsedResourceQuery.hot === "true") {
    options.hot = true;
    enabledFeatures["Hot Module Replacement"] = true;
}
if (parsedResourceQuery["live-reload"] === "true") {
    options.liveReload = true;
    enabledFeatures["Live Reloading"] = true;
}
if (parsedResourceQuery.progress === "true") {
    options.progress = true;
    enabledFeatures.Progress = true;
}
if (parsedResourceQuery.overlay) {
    try {
        options.overlay = JSON.parse(parsedResourceQuery.overlay);
    }
    catch (e) {
        log.error("Error parsing overlay options from resource query:", e);
    }
    // Fill in default "true" params for partially-specified objects.
    if (typeof options.overlay === "object") {
        options.overlay = __assign({ errors: true, warnings: true, runtimeErrors: true }, options.overlay);
        decodeOverlayOptions(options.overlay);
    }
    enabledFeatures.Overlay = options.overlay !== false;
}
if (parsedResourceQuery.logging) {
    options.logging = parsedResourceQuery.logging;
}
if (typeof parsedResourceQuery.reconnect !== "undefined") {
    options.reconnect = Number(parsedResourceQuery.reconnect);
}
/**
 * @param {string} level
 */
var setAllLogLevel = function (level) {
    // This is needed because the HMR logger operate separately from dev server logger
    webpackHotLog.setLogLevel(level === "verbose" || level === "log" ? "info" : level);
    setLogLevel(level);
};
if (options.logging) {
    setAllLogLevel(options.logging);
}
var logEnabledFeatures = function (features) {
    var listEnabledFeatures = Object.keys(features);
    if (!features || listEnabledFeatures.length === 0) {
        return;
    }
    var logString = "Server started:";
    // Server started: Hot Module Replacement enabled, Live Reloading enabled, Overlay disabled.
    for (var i = 0; i < listEnabledFeatures.length; i++) {
        var key = listEnabledFeatures[i];
        logString += " ".concat(key, " ").concat(features[key] ? "enabled" : "disabled", ",");
    }
    // replace last comma with a period
    logString = logString.slice(0, -1).concat(".");
    log.info(logString);
};
logEnabledFeatures(enabledFeatures);
self.addEventListener("beforeunload", function () {
    status.isUnloading = true;
});
var overlay = typeof window !== "undefined"
    ? createOverlay(typeof options.overlay === "object"
        ? {
            trustedTypesPolicyName: options.overlay.trustedTypesPolicyName,
            catchRuntimeError: options.overlay.runtimeErrors,
        }
        : {
            trustedTypesPolicyName: false,
            catchRuntimeError: options.overlay,
        })
    : { send: function () { } };
/**
 * @param {Options} options
 * @param {Status} currentStatus
 */
var reloadApp = function (_a, currentStatus) {
    var hot = _a.hot, liveReload = _a.liveReload;
    if (currentStatus.isUnloading) {
        return;
    }
    var currentHash = currentStatus.currentHash, previousHash = currentStatus.previousHash;
    var isInitial = currentHash.indexOf(/** @type {string} */ (previousHash)) >= 0;
    if (isInitial) {
        return;
    }
    /**
     * @param {Window} rootWindow
     * @param {number} intervalId
     */
    function applyReload(rootWindow, intervalId) {
        clearInterval(intervalId);
        log.info("App updated. Reloading...");
        rootWindow.location.reload();
    }
    var search = self.location.search.toLowerCase();
    var allowToHot = search.indexOf("webpack-dev-server-hot=false") === -1;
    var allowToLiveReload = search.indexOf("webpack-dev-server-live-reload=false") === -1;
    if (hot && allowToHot) {
        log.info("App hot update...");
        hotEmitter.emit("webpackHotUpdate", currentStatus.currentHash);
        if (typeof self !== "undefined" && self.window) {
            // broadcast update to window
            self.postMessage("webpackHotUpdate".concat(currentStatus.currentHash), "*");
        }
    }
    // allow refreshing the page only if liveReload isn't disabled
    else if (liveReload && allowToLiveReload) {
        var rootWindow_1 = self;
        // use parent window for reload (in case we're in an iframe with no valid src)
        var intervalId_1 = self.setInterval(function () {
            if (rootWindow_1.location.protocol !== "about:") {
                // reload immediately if protocol is valid
                applyReload(rootWindow_1, intervalId_1);
            }
            else {
                rootWindow_1 = rootWindow_1.parent;
                if (rootWindow_1.parent === rootWindow_1) {
                    // if parent equals current window we've reached the root which would continue forever, so trigger a reload anyways
                    applyReload(rootWindow_1, intervalId_1);
                }
            }
        });
    }
};
var ansiRegex = new RegExp([
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
].join("|"), "g");
/**
 *
 * Strip [ANSI escape codes](https://en.wikipedia.org/wiki/ANSI_escape_code) from a string.
 * Adapted from code originally released by Sindre Sorhus
 * Licensed the MIT License
 *
 * @param {string} string
 * @return {string}
 */
var stripAnsi = function (string) {
    if (typeof string !== "string") {
        throw new TypeError("Expected a `string`, got `".concat(typeof string, "`"));
    }
    return string.replace(ansiRegex, "");
};
var onSocketMessage = {
    hot: function () {
        if (parsedResourceQuery.hot === "false") {
            return;
        }
        options.hot = true;
    },
    liveReload: function () {
        if (parsedResourceQuery["live-reload"] === "false") {
            return;
        }
        options.liveReload = true;
    },
    invalid: function () {
        log.info("App updated. Recompiling...");
        // Fixes #1042. overlay doesn't clear if errors are fixed but warnings remain.
        if (options.overlay) {
            overlay.send({ type: "DISMISS" });
        }
        sendMessage("Invalid");
    },
    /**
     * @param {string | undefined} hash
     */
    hash: function hash(_hash) {
        if (!_hash) {
            return;
        }
        status.previousHash = status.currentHash;
        status.currentHash = _hash;
    },
    logging: setAllLogLevel,
    /**
     * @param {boolean} value
     */
    overlay: function (value) {
        if (typeof document === "undefined") {
            return;
        }
        options.overlay = value;
        decodeOverlayOptions(options.overlay);
    },
    /**
     * @param {number} value
     */
    reconnect: function (value) {
        if (parsedResourceQuery.reconnect === "false") {
            return;
        }
        options.reconnect = value;
    },
    /**
     * @param {boolean} value
     */
    progress: function (value) {
        options.progress = value;
    },
    /**
     * @param {{ pluginName?: string, percent: number, msg: string }} data
     */
    "progress-update": function progressUpdate(data) {
        if (options.progress) {
            log.info("".concat(data.pluginName ? "[".concat(data.pluginName, "] ") : "").concat(data.percent, "% - ").concat(data.msg, "."));
        }
        if (isProgressSupported()) {
            if (typeof options.progress === "string") {
                var progress = document.querySelector("wds-progress");
                if (!progress) {
                    defineProgressElement();
                    progress = document.createElement("wds-progress");
                    document.body.appendChild(progress);
                }
                progress.setAttribute("progress", data.percent);
                progress.setAttribute("type", options.progress);
            }
        }
        sendMessage("Progress", data);
    },
    "still-ok": function stillOk() {
        log.info("Nothing changed.");
        if (options.overlay) {
            overlay.send({ type: "DISMISS" });
        }
        sendMessage("StillOk");
    },
    ok: function () {
        sendMessage("Ok");
        if (options.overlay) {
            overlay.send({ type: "DISMISS" });
        }
        reloadApp(options, status);
    },
    /**
     * @param {string} file
     */
    "static-changed": function staticChanged(file) {
        log.info("".concat(file ? "\"".concat(file, "\"") : "Content", " from static directory was changed. Reloading..."));
        self.location.reload();
    },
    /**
     * @param {Error[]} warnings
     * @param {any} params
     */
    warnings: function (warnings, params) {
        log.warn("Warnings while compiling.");
        var printableWarnings = warnings.map(function (error) {
            var _a = formatProblem("warning", error), header = _a.header, body = _a.body;
            return "".concat(header, "\n").concat(stripAnsi(body));
        });
        sendMessage("Warnings", printableWarnings);
        for (var i = 0; i < printableWarnings.length; i++) {
            log.warn(printableWarnings[i]);
        }
        var overlayWarningsSetting = typeof options.overlay === "boolean"
            ? options.overlay
            : options.overlay && options.overlay.warnings;
        if (overlayWarningsSetting) {
            var warningsToDisplay = typeof overlayWarningsSetting === "function"
                ? warnings.filter(overlayWarningsSetting)
                : warnings;
            if (warningsToDisplay.length) {
                overlay.send({
                    type: "BUILD_ERROR",
                    level: "warning",
                    messages: warnings,
                });
            }
        }
        if (params && params.preventReloading) {
            return;
        }
        reloadApp(options, status);
    },
    /**
     * @param {Error[]} errors
     */
    errors: function (errors) {
        log.error("Errors while compiling. Reload prevented.");
        var printableErrors = errors.map(function (error) {
            var _a = formatProblem("error", error), header = _a.header, body = _a.body;
            return "".concat(header, "\n").concat(stripAnsi(body));
        });
        sendMessage("Errors", printableErrors);
        for (var i = 0; i < printableErrors.length; i++) {
            log.error(printableErrors[i]);
        }
        var overlayErrorsSettings = typeof options.overlay === "boolean"
            ? options.overlay
            : options.overlay && options.overlay.errors;
        if (overlayErrorsSettings) {
            var errorsToDisplay = typeof overlayErrorsSettings === "function"
                ? errors.filter(overlayErrorsSettings)
                : errors;
            if (errorsToDisplay.length) {
                overlay.send({
                    type: "BUILD_ERROR",
                    level: "error",
                    messages: errors,
                });
            }
        }
    },
    /**
     * @param {Error} error
     */
    error: function (error) {
        log.error(error);
    },
    close: function () {
        log.info("Disconnected!");
        if (options.overlay) {
            overlay.send({ type: "DISMISS" });
        }
        sendMessage("Close");
    },
};
/**
 * @param {{ protocol?: string, auth?: string, hostname?: string, port?: string, pathname?: string, search?: string, hash?: string, slashes?: boolean }} objURL
 * @returns {string}
 */
var formatURL = function (objURL) {
    var protocol = objURL.protocol || "";
    if (protocol && protocol.substr(-1) !== ":") {
        protocol += ":";
    }
    var auth = objURL.auth || "";
    if (auth) {
        auth = encodeURIComponent(auth);
        auth = auth.replace(/%3A/i, ":");
        auth += "@";
    }
    var host = "";
    if (objURL.hostname) {
        host =
            auth +
                (objURL.hostname.indexOf(":") === -1
                    ? objURL.hostname
                    : "[".concat(objURL.hostname, "]"));
        if (objURL.port) {
            host += ":".concat(objURL.port);
        }
    }
    var pathname = objURL.pathname || "";
    if (objURL.slashes) {
        host = "//".concat(host || "");
        if (pathname && pathname.charAt(0) !== "/") {
            pathname = "/".concat(pathname);
        }
    }
    else if (!host) {
        host = "";
    }
    var search = objURL.search || "";
    if (search && search.charAt(0) !== "?") {
        search = "?".concat(search);
    }
    var hash = objURL.hash || "";
    if (hash && hash.charAt(0) !== "#") {
        hash = "#".concat(hash);
    }
    pathname = pathname.replace(/[?#]/g, 
    /**
     * @param {string} match
     * @returns {string}
     */
    function (match) { return encodeURIComponent(match); });
    search = search.replace("#", "%23");
    return "".concat(protocol).concat(host).concat(pathname).concat(search).concat(hash);
};
/**
 * @param {URL & { fromCurrentScript?: boolean }} parsedURL
 * @returns {string}
 */
var createSocketURL = function (parsedURL) {
    var hostname = parsedURL.hostname;
    // Node.js module parses it as `::`
    // `new URL(urlString, [baseURLString])` parses it as '[::]'
    var isInAddrAny = hostname === "0.0.0.0" || hostname === "::" || hostname === "[::]";
    // why do we need this check?
    // hostname n/a for file protocol (example, when using electron, ionic)
    // see: https://github.com/webpack/webpack-dev-server/pull/384
    if (isInAddrAny &&
        self.location.hostname &&
        self.location.protocol.indexOf("http") === 0) {
        hostname = self.location.hostname;
    }
    var socketURLProtocol = parsedURL.protocol || self.location.protocol;
    // When https is used in the app, secure web sockets are always necessary because the browser doesn't accept non-secure web sockets.
    if (socketURLProtocol === "auto:" ||
        (hostname && isInAddrAny && self.location.protocol === "https:")) {
        socketURLProtocol = self.location.protocol;
    }
    socketURLProtocol = socketURLProtocol.replace(/^(?:http|.+-extension|file)/i, "ws");
    var socketURLAuth = "";
    // `new URL(urlString, [baseURLstring])` doesn't have `auth` property
    // Parse authentication credentials in case we need them
    if (parsedURL.username) {
        socketURLAuth = parsedURL.username;
        // Since HTTP basic authentication does not allow empty username,
        // we only include password if the username is not empty.
        if (parsedURL.password) {
            // Result: <username>:<password>
            socketURLAuth = socketURLAuth.concat(":", parsedURL.password);
        }
    }
    // In case the host is a raw IPv6 address, it can be enclosed in
    // the brackets as the brackets are needed in the final URL string.
    // Need to remove those as url.format blindly adds its own set of brackets
    // if the host string contains colons. That would lead to non-working
    // double brackets (e.g. [[::]]) host
    //
    // All of these web socket url params are optionally passed in through resourceQuery,
    // so we need to fall back to the default if they are not provided
    var socketURLHostname = (hostname ||
        self.location.hostname ||
        "localhost").replace(/^\[(.*)\]$/, "$1");
    var socketURLPort = parsedURL.port;
    if (!socketURLPort || socketURLPort === "0") {
        socketURLPort = self.location.port;
    }
    // If path is provided it'll be passed in via the resourceQuery as a
    // query param so it has to be parsed out of the querystring in order for the
    // client to open the socket to the correct location.
    var socketURLPathname = "/ws";
    if (parsedURL.pathname && !parsedURL.fromCurrentScript) {
        socketURLPathname = parsedURL.pathname;
    }
    return formatURL({
        protocol: socketURLProtocol,
        auth: socketURLAuth,
        hostname: socketURLHostname,
        port: socketURLPort,
        pathname: socketURLPathname,
        slashes: true,
    });
};
var socketURL = createSocketURL(parsedResourceQuery);
socket(socketURL, onSocketMessage, options.reconnect);
export { getCurrentScriptSource, parseURL, createSocketURL };
