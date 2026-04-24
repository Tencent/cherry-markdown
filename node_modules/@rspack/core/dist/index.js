"use strict";
var __webpack_modules__ = {
    "../../node_modules/.pnpm/enhanced-resolve@5.18.3/node_modules/enhanced-resolve/lib/CachedInputFileSystem.js" (module1, __unused_webpack_exports, __webpack_require__) {
        let { nextTick } = __webpack_require__("process"), dirname = (path)=>{
            let idx = path.length - 1;
            for(; idx >= 0;){
                let char = path.charCodeAt(idx);
                if (47 === char || 92 === char) break;
                idx--;
            }
            return idx < 0 ? "" : path.slice(0, idx);
        }, runCallbacks = (callbacks, err, result)=>{
            let error;
            if (1 === callbacks.length) {
                callbacks[0](err, result), callbacks.length = 0;
                return;
            }
            for (let callback of callbacks)try {
                callback(err, result);
            } catch (err) {
                error || (error = err);
            }
            if (callbacks.length = 0, error) throw error;
        };
        class OperationMergerBackend {
            constructor(provider, syncProvider, providerContext){
                this._provider = provider, this._syncProvider = syncProvider, this._providerContext = providerContext, this._activeAsyncOperations = new Map(), this.provide = this._provider ? (path, options, callback)=>{
                    if ("function" == typeof options && (callback = options, options = void 0), "string" != typeof path && !Buffer.isBuffer(path) && !(path instanceof URL) && "number" != typeof path) return void callback(TypeError("path must be a string, Buffer, URL or number"));
                    if (options) return this._provider.call(this._providerContext, path, options, callback);
                    let callbacks = this._activeAsyncOperations.get(path);
                    callbacks ? callbacks.push(callback) : (this._activeAsyncOperations.set(path, callbacks = [
                        callback
                    ]), provider(path, (err, result)=>{
                        this._activeAsyncOperations.delete(path), runCallbacks(callbacks, err, result);
                    }));
                } : null, this.provideSync = this._syncProvider ? (path, options)=>this._syncProvider.call(this._providerContext, path, options) : null;
            }
            purge() {}
            purgeParent() {}
        }
        class CacheBackend {
            constructor(duration, provider, syncProvider, providerContext){
                this._duration = duration, this._provider = provider, this._syncProvider = syncProvider, this._providerContext = providerContext, this._activeAsyncOperations = new Map(), this._data = new Map(), this._levels = [];
                for(let i = 0; i < 10; i++)this._levels.push(new Set());
                for(let i = 5000; i < duration; i += 500)this._levels.push(new Set());
                this._currentLevel = 0, this._tickInterval = Math.floor(duration / this._levels.length), this._mode = 0, this._timeout = void 0, this._nextDecay = void 0, this.provide = provider ? this.provide.bind(this) : null, this.provideSync = syncProvider ? this.provideSync.bind(this) : null;
            }
            provide(path, options, callback) {
                if ("function" == typeof options && (callback = options, options = void 0), "string" != typeof path && !Buffer.isBuffer(path) && !(path instanceof URL) && "number" != typeof path) return void callback(TypeError("path must be a string, Buffer, URL or number"));
                let strPath = "string" != typeof path ? path.toString() : path;
                if (options) return this._provider.call(this._providerContext, path, options, callback);
                1 === this._mode && this._enterAsyncMode();
                let cacheEntry = this._data.get(strPath);
                if (void 0 !== cacheEntry) return cacheEntry.err ? nextTick(callback, cacheEntry.err) : nextTick(callback, null, cacheEntry.result);
                let callbacks = this._activeAsyncOperations.get(strPath);
                void 0 !== callbacks ? callbacks.push(callback) : (this._activeAsyncOperations.set(strPath, callbacks = [
                    callback
                ]), this._provider.call(this._providerContext, path, (err, result)=>{
                    this._activeAsyncOperations.delete(strPath), this._storeResult(strPath, err, result), this._enterAsyncMode(), runCallbacks(callbacks, err, result);
                }));
            }
            provideSync(path, options) {
                let result;
                if ("string" != typeof path && !Buffer.isBuffer(path) && !(path instanceof URL) && "number" != typeof path) throw TypeError("path must be a string");
                let strPath = "string" != typeof path ? path.toString() : path;
                if (options) return this._syncProvider.call(this._providerContext, path, options);
                1 === this._mode && this._runDecays();
                let cacheEntry = this._data.get(strPath);
                if (void 0 !== cacheEntry) {
                    if (cacheEntry.err) throw cacheEntry.err;
                    return cacheEntry.result;
                }
                let callbacks = this._activeAsyncOperations.get(strPath);
                this._activeAsyncOperations.delete(strPath);
                try {
                    result = this._syncProvider.call(this._providerContext, path);
                } catch (err) {
                    throw this._storeResult(strPath, err, void 0), this._enterSyncModeWhenIdle(), callbacks && runCallbacks(callbacks, err, void 0), err;
                }
                return this._storeResult(strPath, null, result), this._enterSyncModeWhenIdle(), callbacks && runCallbacks(callbacks, null, result), result;
            }
            purge(what) {
                if (what) if ("string" == typeof what || Buffer.isBuffer(what) || what instanceof URL || "number" == typeof what) {
                    let strWhat = "string" != typeof what ? what.toString() : what;
                    for (let [key, data] of this._data)key.startsWith(strWhat) && (this._data.delete(key), data.level.delete(key));
                    0 === this._data.size && this._enterIdleMode();
                } else {
                    for (let [key, data] of this._data)for (let item of what){
                        let strItem = "string" != typeof item ? item.toString() : item;
                        if (key.startsWith(strItem)) {
                            this._data.delete(key), data.level.delete(key);
                            break;
                        }
                    }
                    0 === this._data.size && this._enterIdleMode();
                }
                else if (0 !== this._mode) {
                    for (let level of (this._data.clear(), this._levels))level.clear();
                    this._enterIdleMode();
                }
            }
            purgeParent(what) {
                if (what) if ("string" == typeof what || Buffer.isBuffer(what) || what instanceof URL || "number" == typeof what) {
                    let strWhat = "string" != typeof what ? what.toString() : what;
                    this.purge(dirname(strWhat));
                } else {
                    let set = new Set();
                    for (let item of what){
                        let strItem = "string" != typeof item ? item.toString() : item;
                        set.add(dirname(strItem));
                    }
                    this.purge(set);
                }
                else this.purge();
            }
            _storeResult(path, err, result) {
                if (this._data.has(path)) return;
                let level = this._levels[this._currentLevel];
                this._data.set(path, {
                    err,
                    result,
                    level
                }), level.add(path);
            }
            _decayLevel() {
                let nextLevel = (this._currentLevel + 1) % this._levels.length, decay = this._levels[nextLevel];
                for (let item of (this._currentLevel = nextLevel, decay))this._data.delete(item);
                decay.clear(), 0 === this._data.size ? this._enterIdleMode() : this._nextDecay += this._tickInterval;
            }
            _runDecays() {
                for(; this._nextDecay <= Date.now() && 0 !== this._mode;)this._decayLevel();
            }
            _enterAsyncMode() {
                let timeout = 0;
                switch(this._mode){
                    case 2:
                        return;
                    case 0:
                        this._nextDecay = Date.now() + this._tickInterval, timeout = this._tickInterval;
                        break;
                    case 1:
                        if (this._runDecays(), 0 === this._mode) return;
                        timeout = Math.max(0, this._nextDecay - Date.now());
                }
                this._mode = 2;
                let ref = setTimeout(()=>{
                    this._mode = 1, this._runDecays();
                }, timeout);
                ref.unref && ref.unref(), this._timeout = ref;
            }
            _enterSyncModeWhenIdle() {
                0 === this._mode && (this._mode = 1, this._nextDecay = Date.now() + this._tickInterval);
            }
            _enterIdleMode() {
                this._mode = 0, this._nextDecay = void 0, this._timeout && clearTimeout(this._timeout);
            }
        }
        let createBackend = (duration, provider, syncProvider, providerContext)=>duration > 0 ? new CacheBackend(duration, provider, syncProvider, providerContext) : new OperationMergerBackend(provider, syncProvider, providerContext);
        module1.exports = class {
            constructor(fileSystem, duration){
                this.fileSystem = fileSystem, this._lstatBackend = createBackend(duration, this.fileSystem.lstat, this.fileSystem.lstatSync, this.fileSystem);
                const lstat = this._lstatBackend.provide;
                this.lstat = lstat;
                const lstatSync = this._lstatBackend.provideSync;
                this.lstatSync = lstatSync, this._statBackend = createBackend(duration, this.fileSystem.stat, this.fileSystem.statSync, this.fileSystem);
                const stat = this._statBackend.provide;
                this.stat = stat;
                const statSync = this._statBackend.provideSync;
                this.statSync = statSync, this._readdirBackend = createBackend(duration, this.fileSystem.readdir, this.fileSystem.readdirSync, this.fileSystem);
                const readdir = this._readdirBackend.provide;
                this.readdir = readdir;
                const readdirSync = this._readdirBackend.provideSync;
                this.readdirSync = readdirSync, this._readFileBackend = createBackend(duration, this.fileSystem.readFile, this.fileSystem.readFileSync, this.fileSystem);
                const readFile = this._readFileBackend.provide;
                this.readFile = readFile;
                const readFileSync = this._readFileBackend.provideSync;
                this.readFileSync = readFileSync, this._readJsonBackend = createBackend(duration, this.fileSystem.readJson || this.readFile && ((path, callback)=>{
                    this.readFile(path, (err, buffer)=>{
                        let data;
                        if (err) return callback(err);
                        if (!buffer || 0 === buffer.length) return callback(Error("No file content"));
                        try {
                            data = JSON.parse(buffer.toString("utf8"));
                        } catch (err_) {
                            return callback(err_);
                        }
                        callback(null, data);
                    });
                }), this.fileSystem.readJsonSync || this.readFileSync && ((path)=>JSON.parse(this.readFileSync(path).toString("utf8"))), this.fileSystem);
                const readJson = this._readJsonBackend.provide;
                this.readJson = readJson;
                const readJsonSync = this._readJsonBackend.provideSync;
                this.readJsonSync = readJsonSync, this._readlinkBackend = createBackend(duration, this.fileSystem.readlink, this.fileSystem.readlinkSync, this.fileSystem);
                const readlink = this._readlinkBackend.provide;
                this.readlink = readlink;
                const readlinkSync = this._readlinkBackend.provideSync;
                this.readlinkSync = readlinkSync, this._realpathBackend = createBackend(duration, this.fileSystem.realpath, this.fileSystem.realpathSync, this.fileSystem);
                const realpath = this._realpathBackend.provide;
                this.realpath = realpath;
                const realpathSync = this._realpathBackend.provideSync;
                this.realpathSync = realpathSync;
            }
            purge(what) {
                this._statBackend.purge(what), this._lstatBackend.purge(what), this._readdirBackend.purgeParent(what), this._readFileBackend.purge(what), this._readlinkBackend.purge(what), this._readJsonBackend.purge(what), this._realpathBackend.purge(what);
            }
        };
    },
    "browserslist-load-config" (module1) {
        module1.exports = require("../compiled/browserslist-load-config/index.js");
    },
    watchpack (module1) {
        module1.exports = require("../compiled/watchpack/index.js");
    },
    "webpack-sources" (module1) {
        module1.exports = require("../compiled/webpack-sources/index.js");
    },
    "./moduleFederationDefaultRuntime.js" (module1) {
        module1.exports = require("./moduleFederationDefaultRuntime.js");
    },
    "@rspack/binding" (module1) {
        module1.exports = require(process.env.RSPACK_BINDING ? process.env.RSPACK_BINDING : "@rspack/binding");
    },
    "node:crypto" (module1) {
        module1.exports = require("node:crypto");
    },
    "node:http" (module1) {
        module1.exports = require("node:http");
    },
    "node:https" (module1) {
        module1.exports = require("node:https");
    },
    "node:os" (module1) {
        module1.exports = require("node:os");
    },
    "node:url" (module1) {
        module1.exports = require("node:url");
    },
    "node:vm" (module1) {
        module1.exports = require("node:vm");
    },
    "node:zlib" (module1) {
        module1.exports = require("node:zlib");
    },
    process (module1) {
        module1.exports = require("process");
    }
}, __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (void 0 !== cachedModule) return cachedModule.exports;
    var module1 = __webpack_module_cache__[moduleId] = {
        exports: {}
    };
    return __webpack_modules__[moduleId](module1, module1.exports, __webpack_require__), module1.exports;
}
__webpack_require__.n = (module1)=>{
    var getter = module1 && module1.__esModule ? ()=>module1.default : ()=>module1;
    return __webpack_require__.d(getter, {
        a: getter
    }), getter;
}, __webpack_require__.d = (exports1, definition)=>{
    for(var key in definition)__webpack_require__.o(definition, key) && !__webpack_require__.o(exports1, key) && Object.defineProperty(exports1, key, {
        enumerable: !0,
        get: definition[key]
    });
}, __webpack_require__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop), __webpack_require__.r = (exports1)=>{
    'undefined' != typeof Symbol && Symbol.toStringTag && Object.defineProperty(exports1, Symbol.toStringTag, {
        value: 'Module'
    }), Object.defineProperty(exports1, '__esModule', {
        value: !0
    });
};
var __webpack_exports__ = {};
for(var __rspack_i in (()=>{
    let createMd4, createXxhash64, service_pool, loadLoader_url;
    __webpack_require__.r(__webpack_exports__), __webpack_require__.d(__webpack_exports__, {
        EntryPlugin: ()=>EntryPlugin,
        version: ()=>exports_version,
        webworker: ()=>webworker,
        RspackOptionsApply: ()=>RspackOptionsApply,
        DynamicEntryPlugin: ()=>DynamicEntryPlugin,
        NoEmitOnErrorsPlugin: ()=>NoEmitOnErrorsPlugin,
        Stats: ()=>Stats,
        EntryDependency: ()=>binding_.EntryDependency,
        BannerPlugin: ()=>BannerPlugin,
        ExternalsPlugin: ()=>ExternalsPlugin,
        MultiStats: ()=>MultiStats,
        SwcJsMinimizerRspackPlugin: ()=>SwcJsMinimizerRspackPlugin,
        ContextModule: ()=>binding_.ContextModule,
        DllPlugin: ()=>DllPlugin,
        WarnCaseSensitiveModulesPlugin: ()=>WarnCaseSensitiveModulesPlugin,
        ProvidePlugin: ()=>ProvidePlugin,
        Template: ()=>Template,
        container: ()=>container,
        HtmlRspackPlugin: ()=>HtmlRspackPlugin,
        javascript: ()=>javascript,
        EvalDevToolModulePlugin: ()=>EvalDevToolModulePlugin,
        NormalModuleReplacementPlugin: ()=>NormalModuleReplacementPlugin,
        WebpackOptionsApply: ()=>RspackOptionsApply,
        EnvironmentPlugin: ()=>EnvironmentPlugin,
        HotModuleReplacementPlugin: ()=>HotModuleReplacementPlugin,
        Compilation: ()=>Compilation,
        experiments: ()=>exports_experiments,
        CircularDependencyRspackPlugin: ()=>CircularDependencyRspackPlugin,
        EvalSourceMapDevToolPlugin: ()=>EvalSourceMapDevToolPlugin,
        RuntimePlugin: ()=>RuntimePlugin,
        Dependency: ()=>binding_.Dependency,
        DllReferencePlugin: ()=>DllReferencePlugin,
        IgnorePlugin: ()=>IgnorePlugin,
        StatsErrorCode: ()=>statsFactoryUtils_StatsErrorCode,
        sources: ()=>sources,
        ValidationError: ()=>ValidationError,
        ConcatenatedModule: ()=>binding_.ConcatenatedModule,
        AsyncDependenciesBlock: ()=>binding_.AsyncDependenciesBlock,
        web: ()=>web,
        default: ()=>src_0,
        LoaderTargetPlugin: ()=>LoaderTargetPlugin,
        WebpackError: ()=>exports_WebpackError,
        RuntimeModule: ()=>RuntimeModule,
        sharing: ()=>sharing,
        config: ()=>exports_config,
        ContextReplacementPlugin: ()=>ContextReplacementPlugin,
        NormalModule: ()=>binding_.NormalModule,
        LightningCssMinimizerRspackPlugin: ()=>LightningCssMinimizerRspackPlugin,
        LoaderOptionsPlugin: ()=>LoaderOptionsPlugin,
        EntryOptionPlugin: ()=>lib_EntryOptionPlugin,
        Compiler: ()=>Compiler,
        DefinePlugin: ()=>DefinePlugin,
        ModuleFilenameHelpers: ()=>ModuleFilenameHelpers_namespaceObject,
        MultiCompiler: ()=>MultiCompiler,
        SourceMapDevToolPlugin: ()=>SourceMapDevToolPlugin,
        library: ()=>exports_library,
        node: ()=>exports_node,
        RuntimeGlobals: ()=>DefaultRuntimeGlobals,
        rspackVersion: ()=>exports_rspackVersion,
        util: ()=>util,
        optimize: ()=>optimize,
        ExternalModule: ()=>binding_.ExternalModule,
        electron: ()=>electron,
        Module: ()=>binding_.Module,
        CopyRspackPlugin: ()=>CopyRspackPlugin,
        rspack: ()=>src_rspack_0,
        CssExtractRspackPlugin: ()=>CssExtractRspackPlugin,
        wasm: ()=>exports_wasm,
        ProgressPlugin: ()=>ProgressPlugin
    });
    var RuntimeGlobals, StatsErrorCode, _computedKey, _computedKey1, _computedKey2, ArrayQueue_computedKey, browserslistTargetHandler_namespaceObject = {};
    __webpack_require__.r(browserslistTargetHandler_namespaceObject), __webpack_require__.d(browserslistTargetHandler_namespaceObject, {
        resolve: ()=>browserslistTargetHandler_resolve
    });
    var ModuleFilenameHelpers_namespaceObject = {};
    __webpack_require__.r(ModuleFilenameHelpers_namespaceObject), __webpack_require__.d(ModuleFilenameHelpers_namespaceObject, {
        asRegExp: ()=>asRegExp,
        matchObject: ()=>matchObject,
        matchPart: ()=>matchPart
    });
    var exports_namespaceObject = {};
    __webpack_require__.r(exports_namespaceObject), __webpack_require__.d(exports_namespaceObject, {
        AsyncDependenciesBlock: ()=>binding_.AsyncDependenciesBlock,
        BannerPlugin: ()=>BannerPlugin,
        CircularDependencyRspackPlugin: ()=>CircularDependencyRspackPlugin,
        Compilation: ()=>Compilation,
        Compiler: ()=>Compiler,
        ConcatenatedModule: ()=>binding_.ConcatenatedModule,
        ContextModule: ()=>binding_.ContextModule,
        ContextReplacementPlugin: ()=>ContextReplacementPlugin,
        CopyRspackPlugin: ()=>CopyRspackPlugin,
        CssExtractRspackPlugin: ()=>CssExtractRspackPlugin,
        DefinePlugin: ()=>DefinePlugin,
        Dependency: ()=>binding_.Dependency,
        DllPlugin: ()=>DllPlugin,
        DllReferencePlugin: ()=>DllReferencePlugin,
        DynamicEntryPlugin: ()=>DynamicEntryPlugin,
        EntryDependency: ()=>binding_.EntryDependency,
        EntryOptionPlugin: ()=>lib_EntryOptionPlugin,
        EntryPlugin: ()=>EntryPlugin,
        EnvironmentPlugin: ()=>EnvironmentPlugin,
        EvalDevToolModulePlugin: ()=>EvalDevToolModulePlugin,
        EvalSourceMapDevToolPlugin: ()=>EvalSourceMapDevToolPlugin,
        ExternalModule: ()=>binding_.ExternalModule,
        ExternalsPlugin: ()=>ExternalsPlugin,
        HotModuleReplacementPlugin: ()=>HotModuleReplacementPlugin,
        HtmlRspackPlugin: ()=>HtmlRspackPlugin,
        IgnorePlugin: ()=>IgnorePlugin,
        LightningCssMinimizerRspackPlugin: ()=>LightningCssMinimizerRspackPlugin,
        LoaderOptionsPlugin: ()=>LoaderOptionsPlugin,
        LoaderTargetPlugin: ()=>LoaderTargetPlugin,
        Module: ()=>binding_.Module,
        ModuleFilenameHelpers: ()=>ModuleFilenameHelpers_namespaceObject,
        MultiCompiler: ()=>MultiCompiler,
        MultiStats: ()=>MultiStats,
        NoEmitOnErrorsPlugin: ()=>NoEmitOnErrorsPlugin,
        NormalModule: ()=>binding_.NormalModule,
        NormalModuleReplacementPlugin: ()=>NormalModuleReplacementPlugin,
        ProgressPlugin: ()=>ProgressPlugin,
        ProvidePlugin: ()=>ProvidePlugin,
        RspackOptionsApply: ()=>RspackOptionsApply,
        RuntimeGlobals: ()=>DefaultRuntimeGlobals,
        RuntimeModule: ()=>RuntimeModule,
        RuntimePlugin: ()=>RuntimePlugin,
        SourceMapDevToolPlugin: ()=>SourceMapDevToolPlugin,
        Stats: ()=>Stats,
        StatsErrorCode: ()=>statsFactoryUtils_StatsErrorCode,
        SwcJsMinimizerRspackPlugin: ()=>SwcJsMinimizerRspackPlugin,
        Template: ()=>Template,
        ValidationError: ()=>ValidationError,
        WarnCaseSensitiveModulesPlugin: ()=>WarnCaseSensitiveModulesPlugin,
        WebpackError: ()=>exports_WebpackError,
        WebpackOptionsApply: ()=>RspackOptionsApply,
        config: ()=>exports_config,
        container: ()=>container,
        electron: ()=>electron,
        experiments: ()=>exports_experiments,
        javascript: ()=>javascript,
        library: ()=>exports_library,
        node: ()=>exports_node,
        optimize: ()=>optimize,
        rspackVersion: ()=>exports_rspackVersion,
        sharing: ()=>sharing,
        sources: ()=>sources,
        util: ()=>util,
        version: ()=>exports_version,
        wasm: ()=>exports_wasm,
        web: ()=>web,
        webworker: ()=>webworker
    });
    var binding_ = __webpack_require__("@rspack/binding"), binding_default = __webpack_require__.n(binding_);
    let lite_tapable_namespaceObject = require("@rspack/lite-tapable"), cutOffLoaderExecution = (stack)=>((stack, flag)=>{
            let stacks = stack.split("\n");
            for(let i = 0; i < stacks.length; i++)stacks[i].includes(flag) && (stacks.length = i);
            return stacks.join("\n");
        })(stack, "LOADER_EXECUTION"), cutOffMessage = (stack, name, message)=>{
        let nextLine = stack.indexOf("\n");
        return -1 === nextLine ? stack === message ? "" : stack : stack.slice(0, nextLine) === `${name}: ${message}` ? stack.slice(nextLine + 1) : stack;
    }, external_node_util_namespaceObject = require("node:util");
    var external_node_util_default = __webpack_require__.n(external_node_util_namespaceObject);
    class WebpackError extends Error {
        loc;
        file;
        chunk;
        module;
        details;
        hideStack;
    }
    Object.defineProperty(WebpackError.prototype, external_node_util_namespaceObject.inspect.custom, {
        value: function() {
            return this.stack + (this.details ? `\n${this.details}` : "");
        },
        enumerable: !1,
        configurable: !0
    });
    let lib_WebpackError = WebpackError, LogType = Object.freeze({
        error: "error",
        warn: "warn",
        info: "info",
        log: "log",
        debug: "debug",
        trace: "trace",
        group: "group",
        groupCollapsed: "groupCollapsed",
        groupEnd: "groupEnd",
        profile: "profile",
        profileEnd: "profileEnd",
        time: "time",
        clear: "clear",
        status: "status",
        cache: "cache"
    });
    function getLogTypeBitFlag(type) {
        return 1 << Object.values(LogType).findIndex((i)=>i === type);
    }
    function getLogTypesBitFlag(types) {
        return types.reduce((acc, cur)=>acc | getLogTypeBitFlag(cur), 0);
    }
    let LOG_SYMBOL = Symbol("webpack logger raw log method"), TIMERS_SYMBOL = Symbol("webpack logger times"), TIMERS_AGGREGATES_SYMBOL = Symbol("webpack logger aggregated times");
    class Logger {
        getChildLogger;
        [LOG_SYMBOL];
        [TIMERS_SYMBOL];
        [TIMERS_AGGREGATES_SYMBOL];
        constructor(log, getChildLogger){
            this[LOG_SYMBOL] = log, this.getChildLogger = getChildLogger;
        }
        error(...args) {
            this[LOG_SYMBOL](LogType.error, args);
        }
        warn(...args) {
            this[LOG_SYMBOL](LogType.warn, args);
        }
        info(...args) {
            this[LOG_SYMBOL](LogType.info, args);
        }
        log(...args) {
            this[LOG_SYMBOL](LogType.log, args);
        }
        debug(...args) {
            this[LOG_SYMBOL](LogType.debug, args);
        }
        assert(assertion, ...args) {
            assertion || this[LOG_SYMBOL](LogType.error, args);
        }
        trace() {
            this[LOG_SYMBOL](LogType.trace, [
                "Trace"
            ]);
        }
        clear() {
            this[LOG_SYMBOL](LogType.clear);
        }
        status(...args) {
            this[LOG_SYMBOL](LogType.status, args);
        }
        group(...args) {
            this[LOG_SYMBOL](LogType.group, args);
        }
        groupCollapsed(...args) {
            this[LOG_SYMBOL](LogType.groupCollapsed, args);
        }
        groupEnd(...args) {
            this[LOG_SYMBOL](LogType.groupEnd, args);
        }
        profile(label) {
            this[LOG_SYMBOL](LogType.profile, [
                label
            ]);
        }
        profileEnd(label) {
            this[LOG_SYMBOL](LogType.profileEnd, [
                label
            ]);
        }
        time(label) {
            this[TIMERS_SYMBOL] = this[TIMERS_SYMBOL] || new Map(), this[TIMERS_SYMBOL].set(label, process.hrtime());
        }
        timeLog(label) {
            let prev = this[TIMERS_SYMBOL]?.get(label);
            if (!prev) throw Error(`No such label '${label}' for WebpackLogger.timeLog()`);
            let time = process.hrtime(prev);
            this[LOG_SYMBOL](LogType.time, [
                label,
                ...time
            ]);
        }
        timeEnd(label) {
            let prev = this[TIMERS_SYMBOL]?.get(label);
            if (!prev) throw Error(`No such label '${label}' for WebpackLogger.timeEnd()`);
            let time = process.hrtime(prev);
            this[TIMERS_SYMBOL].delete(label), this[LOG_SYMBOL](LogType.time, [
                label,
                ...time
            ]);
        }
        timeAggregate(label) {
            let prev = this[TIMERS_SYMBOL]?.get(label);
            if (!prev) throw Error(`No such label '${label}' for WebpackLogger.timeAggregate()`);
            let time = process.hrtime(prev);
            this[TIMERS_SYMBOL].delete(label), this[TIMERS_AGGREGATES_SYMBOL] = this[TIMERS_AGGREGATES_SYMBOL] || new Map();
            let current = this[TIMERS_AGGREGATES_SYMBOL].get(label);
            void 0 !== current && (time[1] + current[1] > 1e9 ? (time[0] += current[0] + 1, time[1] = time[1] - 1e9 + current[1]) : (time[0] += current[0], time[1] += current[1])), this[TIMERS_AGGREGATES_SYMBOL].set(label, time);
        }
        timeAggregateEnd(label) {
            if (void 0 === this[TIMERS_AGGREGATES_SYMBOL]) return;
            let time = this[TIMERS_AGGREGATES_SYMBOL].get(label);
            void 0 !== time && (this[TIMERS_AGGREGATES_SYMBOL].delete(label), this[LOG_SYMBOL](LogType.time, [
                label,
                ...time
            ]));
        }
    }
    function toJsRuntimeSpec(runtime) {
        return runtime instanceof Set ? Array.from(runtime) : runtime;
    }
    class ExportsInfo {
        #inner;
        static __from_binding(binding) {
            return new ExportsInfo(binding);
        }
        constructor(binding){
            this.#inner = binding;
        }
        isUsed(runtime) {
            return this.#inner.isUsed(toJsRuntimeSpec(runtime));
        }
        isModuleUsed(runtime) {
            return this.#inner.isModuleUsed(toJsRuntimeSpec(runtime));
        }
        setUsedInUnknownWay(runtime) {
            return this.#inner.setUsedInUnknownWay(toJsRuntimeSpec(runtime));
        }
        getUsed(name, runtime) {
            return this.#inner.getUsed(name, toJsRuntimeSpec(runtime));
        }
    }
    class ModuleGraph {
        static __from_binding(binding) {
            return new ModuleGraph(binding);
        }
        #inner;
        constructor(binding){
            this.#inner = binding;
        }
        getModule(dependency) {
            return this.#inner.getModule(dependency);
        }
        getResolvedModule(dependency) {
            return this.#inner.getResolvedModule(dependency);
        }
        getParentModule(dependency) {
            return this.#inner.getParentModule(dependency);
        }
        getIssuer(module1) {
            return this.#inner.getIssuer(module1);
        }
        getExportsInfo(module1) {
            return ExportsInfo.__from_binding(this.#inner.getExportsInfo(module1));
        }
        getConnection(dependency) {
            return this.#inner.getConnection(dependency);
        }
        getOutgoingConnections(module1) {
            return this.#inner.getOutgoingConnections(module1);
        }
        getIncomingConnections(module1) {
            return this.#inner.getIncomingConnections(module1);
        }
        getParentBlockIndex(dependency) {
            return this.#inner.getParentBlockIndex(dependency);
        }
        isAsync(module1) {
            return this.#inner.isAsync(module1);
        }
        getOutgoingConnectionsInOrder(module1) {
            return this.#inner.getOutgoingConnectionsInOrder(module1);
        }
    }
    class RuntimeModule {
        static STAGE_NORMAL = 0;
        static STAGE_BASIC = 5;
        static STAGE_ATTACH = 10;
        static STAGE_TRIGGER = 20;
        static __to_binding(module1) {
            return {
                name: module1.name,
                stage: module1.stage,
                generator: module1.generate.bind(module1),
                fullHash: module1.fullHash,
                dependentHash: module1.dependentHash,
                isolate: module1.shouldIsolate()
            };
        }
        _name;
        _stage;
        fullHash = !1;
        dependentHash = !1;
        chunk = null;
        compilation = null;
        chunkGraph = null;
        constructor(name, stage = 0){
            this._name = name, this._stage = stage;
        }
        attach(compilation, chunk, chunkGraph) {
            this.compilation = compilation, this.chunk = chunk, this.chunkGraph = chunkGraph;
        }
        get name() {
            return this._name;
        }
        get stage() {
            return this._stage;
        }
        identifier() {
            return `webpack/runtime/${this._name}`;
        }
        readableIdentifier() {
            return `webpack/runtime/${this._name}`;
        }
        shouldIsolate() {
            return !0;
        }
        generate() {
            throw Error(`Should implement "generate" method of runtime module "${this.name}"`);
        }
    }
    class Stats {
        #inner;
        #compilation;
        #innerMap;
        constructor(compilation){
            this.#inner = compilation.__internal_getInner().getStats(), this.#compilation = compilation, this.#innerMap = new WeakMap([
                [
                    this.compilation,
                    this.#inner
                ]
            ]);
        }
        #getInnerByCompilation(compilation) {
            if (this.#innerMap.has(compilation)) return this.#innerMap.get(compilation);
            let inner = compilation.__internal_getInner().getStats();
            return this.#innerMap.set(compilation, inner), inner;
        }
        get compilation() {
            if (this.#compilation.__internal__shutdown) throw Error("Unable to access `Stats` after the compiler was shutdown");
            return this.#compilation;
        }
        get hash() {
            return this.compilation.hash;
        }
        get startTime() {
            return this.compilation.startTime;
        }
        get endTime() {
            return this.compilation.endTime;
        }
        hasErrors() {
            return this.#compilation.errors.length > 0 || this.#compilation.children.some((child)=>child.getStats().hasErrors());
        }
        hasWarnings() {
            return this.#compilation.hooks.processWarnings.call(this.#compilation.warnings).length > 0 || this.#compilation.children.some((child)=>child.getStats().hasWarnings());
        }
        toJson(opts, forToString) {
            let options = this.compilation.createStatsOptions(opts, {
                forToString
            }), statsFactory = this.compilation.createStatsFactory(options), statsCompilationMap = new Map();
            return statsFactory.create("compilation", this.compilation, {
                compilation: this.compilation,
                getStatsCompilation: (compilation)=>{
                    if (statsCompilationMap.has(compilation)) return statsCompilationMap.get(compilation);
                    let innerStats = this.#getInnerByCompilation(compilation);
                    options.warnings = !1;
                    let innerStatsCompilation = innerStats.toJson(options);
                    return statsCompilationMap.set(compilation, innerStatsCompilation), innerStatsCompilation;
                },
                getInner: this.#getInnerByCompilation.bind(this)
            });
        }
        toString(opts) {
            let options = this.compilation.createStatsOptions(opts, {
                forToString: !0
            }), statsFactory = this.compilation.createStatsFactory(options), statsPrinter = this.compilation.createStatsPrinter(options), statsCompilationMap = new Map(), stats = statsFactory.create("compilation", this.compilation, {
                compilation: this.compilation,
                getStatsCompilation: (compilation)=>{
                    if (statsCompilationMap.has(compilation)) return statsCompilationMap.get(compilation);
                    let innerStatsCompilation = this.#getInnerByCompilation(compilation).toJson(options);
                    return statsCompilationMap.set(compilation, innerStatsCompilation), innerStatsCompilation;
                },
                getInner: this.#getInnerByCompilation.bind(this)
            }), result = statsPrinter.print("compilation", stats);
            return void 0 === result ? "" : result;
        }
    }
    function presetToOptions(name) {
        switch("string" == typeof name && name.toLowerCase() || name){
            case "none":
                return {
                    all: !1
                };
            case "verbose":
                return {
                    all: !0,
                    modulesSpace: 1 / 0
                };
            case "errors-only":
                return {
                    all: !1,
                    errors: !0,
                    errorsCount: !0,
                    logging: "error",
                    moduleTrace: !0
                };
            case "errors-warnings":
                return {
                    all: !1,
                    errors: !0,
                    errorsCount: !0,
                    warnings: !0,
                    warningsCount: !0,
                    logging: "warn"
                };
            default:
                return {};
        }
    }
    class TwoKeyWeakMap {
        _map;
        constructor(){
            this._map = new WeakMap();
        }
        get(key1, key2) {
            let childMap = this._map.get(key1);
            if (void 0 !== childMap) return childMap.get(key2);
        }
        set(key1, key2, value) {
            let childMap = this._map.get(key1);
            void 0 === childMap && (childMap = new WeakMap(), this._map.set(key1, childMap)), childMap.set(key2, value);
        }
    }
    let concatComparatorsCache = new TwoKeyWeakMap(), concatComparators = (...comps)=>{
        let [c1, c2, ...cRest] = comps;
        if (void 0 === c2) return c1;
        if (cRest.length > 0) {
            let [c3, ...cRest2] = cRest;
            return concatComparators(c1, concatComparators(c2, c3, ...cRest2));
        }
        let cacheEntry = concatComparatorsCache.get(c1, c2);
        if (void 0 !== cacheEntry) return cacheEntry;
        let result = (a, b)=>{
            let res = c1(a, b);
            return 0 !== res ? res : c2(a, b);
        };
        return concatComparatorsCache.set(c1, c2, result), result;
    }, compareIds = (a, b)=>typeof a != typeof b ? typeof a < typeof b ? -1 : 1 : a < b ? -1 : +(a > b), compareSelectCache = new TwoKeyWeakMap(), compareSelect = (getter, comparator)=>{
        let cacheEntry = compareSelectCache.get(getter, comparator);
        if (void 0 !== cacheEntry) return cacheEntry;
        let result = (a, b)=>{
            let aValue = getter(a), bValue = getter(b);
            return null != aValue ? null != bValue ? comparator(aValue, bValue) : -1 : +(null != bValue);
        };
        return compareSelectCache.set(getter, comparator, result), result;
    }, compareNumbers = (a, b)=>typeof a != typeof b ? typeof a < typeof b ? -1 : 1 : a < b ? -1 : +(a > b);
    class StatsFactory {
        hooks;
        _caches;
        _inCreate;
        constructor(){
            this.hooks = Object.freeze({
                extract: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "object",
                        "data",
                        "context"
                    ])),
                filter: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "item",
                        "context",
                        "index",
                        "unfilteredIndex"
                    ])),
                sort: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "comparators",
                        "context"
                    ])),
                filterSorted: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "item",
                        "context",
                        "index",
                        "unfilteredIndex"
                    ])),
                groupResults: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "groupConfigs",
                        "context"
                    ])),
                sortResults: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "comparators",
                        "context"
                    ])),
                filterResults: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "item",
                        "context",
                        "index",
                        "unfilteredIndex"
                    ])),
                merge: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "items",
                        "context"
                    ])),
                result: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncWaterfallHook([
                        "result",
                        "context"
                    ])),
                getItemName: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "item",
                        "context"
                    ])),
                getItemFactory: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "item",
                        "context"
                    ]))
            });
            const hooks = this.hooks, caches = {};
            for (const key of Object.keys(hooks))caches[key] = new Map();
            this._caches = caches, this._inCreate = !1;
        }
        _getAllLevelHooks(hookMap, cache, type) {
            let cacheEntry = cache.get(type);
            if (void 0 !== cacheEntry) return cacheEntry;
            let hooks = [], typeParts = type.split(".");
            for(let i = 0; i < typeParts.length; i++){
                let hook = hookMap.get(typeParts.slice(i).join("."));
                hook && hooks.push(hook);
            }
            return cache.set(type, hooks), hooks;
        }
        _forEachLevel(hookMap, cache, type, fn) {
            for (let hook of this._getAllLevelHooks(hookMap, cache, type)){
                let result = fn(hook);
                if (void 0 !== result) return result;
            }
        }
        _forEachLevelWaterfall(hookMap, cache, type, data, fn) {
            return this._getAllLevelHooks(hookMap, cache, type).reduce((data, hook)=>fn(hook, data), data);
        }
        _forEachLevelFilter(hookMap, cache, type, items, fn, forceClone) {
            let hooks = this._getAllLevelHooks(hookMap, cache, type);
            if (0 === hooks.length) return forceClone ? items.slice() : items;
            let i = 0;
            return items.filter((item, idx)=>{
                for (let hook of hooks){
                    let r = fn(hook, item, idx, i);
                    if (void 0 !== r) return r && i++, r;
                }
                return i++, !0;
            });
        }
        create(type, data, baseContext) {
            if (this._inCreate) return this._create(type, data, baseContext);
            try {
                return this._inCreate = !0, this._create(type, data, baseContext);
            } finally{
                for (let key of Object.keys(this._caches))this._caches[key].clear();
                this._inCreate = !1;
            }
        }
        _create(type, data, baseContext) {
            let context = {
                ...baseContext,
                type,
                [type]: data
            };
            if (Array.isArray(data)) {
                let items = this._forEachLevelFilter(this.hooks.filter, this._caches.filter, type, data, (h, r, idx, i)=>h.call(r, context, idx, i), !0), comparators = [];
                this._forEachLevel(this.hooks.sort, this._caches.sort, type, (h)=>h.call(comparators, context)), comparators.length > 0 && items.sort(concatComparators(...comparators));
                let resultItems = this._forEachLevelFilter(this.hooks.filterSorted, this._caches.filterSorted, type, items, (h, r, idx, i)=>h.call(r, context, idx, i), !1).map((item, i)=>{
                    let itemContext = {
                        ...context,
                        _index: i
                    }, itemName = this._forEachLevel(this.hooks.getItemName, this._caches.getItemName, `${type}[]`, (h)=>h.call(item, itemContext));
                    itemName && (itemContext[itemName] = item);
                    let innerType = itemName ? `${type}[].${itemName}` : `${type}[]`;
                    return (this._forEachLevel(this.hooks.getItemFactory, this._caches.getItemFactory, innerType, (h)=>h.call(item, itemContext)) || this).create(innerType, item, itemContext);
                }), comparators2 = [];
                this._forEachLevel(this.hooks.sortResults, this._caches.sortResults, type, (h)=>h.call(comparators2, context)), comparators2.length > 0 && resultItems.sort(concatComparators(...comparators2));
                let groupConfigs = [];
                this._forEachLevel(this.hooks.groupResults, this._caches.groupResults, type, (h)=>h.call(groupConfigs, context)), groupConfigs.length > 0 && (resultItems = ((items, groupConfigs)=>{
                    let itemsWithGroups = new Set(), allGroups = new Map();
                    for (let item of items){
                        let groups = new Set();
                        for(let i = 0; i < groupConfigs.length; i++){
                            let groupConfig = groupConfigs[i], keys = groupConfig.getKeys(item);
                            if (keys) for (let name of keys){
                                let key = `${i}:${name}`, group = allGroups.get(key);
                                void 0 === group && allGroups.set(key, group = {
                                    config: groupConfig,
                                    name,
                                    alreadyGrouped: !1,
                                    items: void 0
                                }), groups.add(group);
                            }
                        }
                        itemsWithGroups.add({
                            item,
                            groups
                        });
                    }
                    let runGrouping = (itemsWithGroups)=>{
                        let totalSize = itemsWithGroups.size;
                        for (let entry of itemsWithGroups)for (let group of entry.groups){
                            if (group.alreadyGrouped) continue;
                            let items = group.items;
                            void 0 === items ? group.items = new Set([
                                entry
                            ]) : items.add(entry);
                        }
                        let groupMap = new Map();
                        for (let group of allGroups.values())if (group.items) {
                            let items = group.items;
                            group.items = void 0, groupMap.set(group, {
                                items,
                                options: void 0,
                                used: !1
                            });
                        }
                        let results = [];
                        for(;;){
                            let bestGroup, bestGroupItems, bestGroupOptions, bestGroupSize = -1;
                            for (let [group, state] of groupMap){
                                let { items, used } = state, options = state.options;
                                if (void 0 === options) {
                                    let groupConfig = group.config;
                                    state.options = options = groupConfig.getOptions?.(group.name, Array.from(items, ({ item })=>item)) || !1;
                                }
                                let force = !1 !== options && options.force;
                                if (!force && (!1 !== bestGroupOptions && bestGroupOptions?.force || used || items.size <= 1 || totalSize - items.size <= 1)) continue;
                                let targetGroupCount = !1 !== options && options.targetGroupCount || 4, sizeValue = force ? items.size : Math.min(items.size, 2 * totalSize / targetGroupCount + itemsWithGroups.size - items.size);
                                (sizeValue > bestGroupSize || force && (!bestGroupOptions || !bestGroupOptions.force)) && (bestGroup = group, bestGroupSize = sizeValue, bestGroupItems = items, bestGroupOptions = options);
                            }
                            if (void 0 === bestGroup) break;
                            let items = new Set(bestGroupItems), options = bestGroupOptions, groupChildren = !options || !1 !== options.groupChildren;
                            for (let item of items)for (let group of (itemsWithGroups.delete(item), item.groups)){
                                let state = groupMap.get(group);
                                void 0 !== state && (state.items.delete(item), 0 === state.items.size ? groupMap.delete(group) : (state.options = void 0, groupChildren && (state.used = !0)));
                            }
                            groupMap.delete(bestGroup);
                            let key = bestGroup.name, groupConfig = bestGroup.config, allItems = Array.from(items, ({ item })=>item);
                            bestGroup.alreadyGrouped = !0;
                            let children = groupChildren ? runGrouping(items) : allItems;
                            bestGroup.alreadyGrouped = !1, results.push(groupConfig.createGroup(key, children, allItems));
                        }
                        for (let { item } of itemsWithGroups)results.push(item);
                        return results;
                    };
                    return runGrouping(itemsWithGroups);
                })(resultItems, groupConfigs));
                let finalResultItems = this._forEachLevelFilter(this.hooks.filterResults, this._caches.filterResults, type, resultItems, (h, r, idx, i)=>h.call(r, context, idx, i), !1), result = this._forEachLevel(this.hooks.merge, this._caches.merge, type, (h)=>h.call(finalResultItems, context));
                return void 0 === result && (result = finalResultItems), this._forEachLevelWaterfall(this.hooks.result, this._caches.result, type, result, (h, r)=>h.call(r, context));
            }
            let object = {};
            return this._forEachLevel(this.hooks.extract, this._caches.extract, type, (h)=>h.call(object, data, context)), this._forEachLevelWaterfall(this.hooks.result, this._caches.result, type, object, (h, r)=>h.call(r, context));
        }
    }
    class StatsPrinter {
        _levelHookCache;
        _inPrint;
        hooks;
        constructor(){
            this.hooks = Object.freeze({
                sortElements: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "elements",
                        "context"
                    ])),
                printElements: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "printedElements",
                        "context"
                    ])),
                sortItems: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "items",
                        "context"
                    ])),
                getItemName: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "item",
                        "context"
                    ])),
                printItems: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "printedItems",
                        "context"
                    ])),
                print: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "object",
                        "context"
                    ])),
                result: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncWaterfallHook([
                        "result",
                        "context"
                    ]))
            }), this._levelHookCache = new Map(), this._inPrint = !1;
        }
        _getAllLevelHooks(hookMap, type) {
            let cache = this._levelHookCache.get(hookMap);
            void 0 === cache && (cache = new Map(), this._levelHookCache.set(hookMap, cache));
            let cacheEntry = cache.get(type);
            if (void 0 !== cacheEntry) return cacheEntry;
            let hooks = [], typeParts = type.split(".");
            for(let i = 0; i < typeParts.length; i++){
                let hook = hookMap.get(typeParts.slice(i).join("."));
                hook && hooks.push(hook);
            }
            return cache.set(type, hooks), hooks;
        }
        _forEachLevel(hookMap, type, fn) {
            for (let hook of this._getAllLevelHooks(hookMap, type)){
                let result = fn(hook);
                if (void 0 !== result) return result;
            }
        }
        _forEachLevelWaterfall(hookMap, type, data, fn) {
            return this._getAllLevelHooks(hookMap, type).reduce((data, hook)=>fn(hook, data), data);
        }
        print(type, object, baseContext) {
            if (this._inPrint) return this._print(type, object, baseContext);
            try {
                return this._inPrint = !0, this._print(type, object, baseContext);
            } finally{
                this._levelHookCache.clear(), this._inPrint = !1;
            }
        }
        _print(type, object, baseContext) {
            let context = {
                ...baseContext,
                type,
                [type]: object
            }, printResult = this._forEachLevel(this.hooks.print, type, (hook)=>hook.call(object, context));
            if (void 0 === printResult) {
                if (Array.isArray(object)) {
                    let sortedItems = object.slice();
                    this._forEachLevel(this.hooks.sortItems, type, (h)=>h.call(sortedItems, context));
                    let printedItems = sortedItems.map((item, i)=>{
                        let itemContext = {
                            ...context,
                            _index: i
                        }, itemName = this._forEachLevel(this.hooks.getItemName, `${type}[]`, (h)=>h.call(item, itemContext));
                        return itemName && (itemContext[itemName] = item), this.print(itemName ? `${type}[].${itemName}` : `${type}[]`, item, itemContext);
                    });
                    if (void 0 === (printResult = this._forEachLevel(this.hooks.printItems, type, (h)=>h.call(printedItems, context)))) {
                        let result = printedItems.filter(Boolean);
                        result.length > 0 && (printResult = result.join("\n"));
                    }
                } else if (null !== object && "object" == typeof object) {
                    let elements = Object.keys(object).filter((key)=>void 0 !== object[key]);
                    this._forEachLevel(this.hooks.sortElements, type, (h)=>h.call(elements, context));
                    let printedElements = elements.map((element)=>{
                        let content = this.print(`${type}.${element}`, object[element], {
                            ...context,
                            _parent: object,
                            _element: element,
                            [element]: object[element]
                        });
                        return {
                            element,
                            content
                        };
                    });
                    if (void 0 === (printResult = this._forEachLevel(this.hooks.printElements, type, (h)=>h.call(printedElements, context)))) {
                        let result = printedElements.map((e)=>e.content).filter(Boolean);
                        result.length > 0 && (printResult = result.join("\n"));
                    }
                }
            }
            return this._forEachLevelWaterfall(this.hooks.result, type, printResult, (h, r)=>h.call(r, context));
        }
    }
    class AsyncTask {
        #isRunning = !1;
        #params = [];
        #callbacks = [];
        #task;
        constructor(task){
            this.#task = task;
        }
        #exec_internal() {
            let params = this.#params, callbacks = this.#callbacks;
            this.#params = [], this.#callbacks = [], this.#task(params, (results)=>{
                this.#isRunning = !1, this.#params.length && (this.#isRunning = !0, queueMicrotask(()=>this.#exec_internal()));
                for(let i = 0; i < results.length; i++){
                    let [err, result] = results[i];
                    (0, callbacks[i])(err, result);
                }
            });
        }
        exec(param, callback) {
            this.#isRunning || (queueMicrotask(()=>this.#exec_internal()), this.#isRunning = !0), this.#params.push(param), this.#callbacks.push(callback);
        }
    }
    function createReadonlyMap(obj) {
        return {
            ...obj,
            *values () {
                for (let key of this.keys())yield this.get(key);
            },
            *entries () {
                for (let key of this.keys())yield [
                    key,
                    this.get(key)
                ];
            },
            forEach (callback, thisArg) {
                for (let [key, value] of this)callback.call(thisArg, value, key, this);
            },
            [Symbol.iterator] () {
                return this.entries();
            }
        };
    }
    class MergeCaller {
        callArgs = [];
        callFn;
        constructor(fn){
            this.callFn = fn;
        }
        finalCall = ()=>{
            let args = this.callArgs;
            this.callArgs = [], this.callFn(args);
        };
        pendingData() {
            return this.callArgs;
        }
        push(...data) {
            0 === this.callArgs.length && queueMicrotask(this.finalCall), this.callArgs.push(...data);
        }
    }
    function createFakeCompilationDependencies(getDeps, addDeps) {
        let addDepsCaller = new MergeCaller(addDeps);
        return {
            *[Symbol.iterator] () {
                for (let dep of new Set([
                    ...getDeps(),
                    ...addDepsCaller.pendingData()
                ]))yield dep;
            },
            has: (dep)=>addDepsCaller.pendingData().includes(dep) || getDeps().includes(dep),
            add: (dep)=>{
                addDepsCaller.push(dep);
            },
            addAll: (deps)=>{
                addDepsCaller.push(...deps);
            }
        };
    }
    var index_js_ = __webpack_require__("webpack-sources");
    class SourceAdapter {
        static fromBinding(source) {
            return source.map ? new index_js_.SourceMapSource(source.source, "inmemory://from rust", source.map) : new index_js_.RawSource(source.source);
        }
        static toBinding(source) {
            let content = source.source();
            if (Buffer.isBuffer(content)) return {
                source: content,
                map: void 0
            };
            let map = source.map?.({
                columns: !0
            });
            return {
                source: content,
                map: map ? JSON.stringify(map) : void 0
            };
        }
    }
    Object.defineProperty(binding_.Chunk.prototype, "files", {
        enumerable: !0,
        configurable: !0,
        get () {
            return new Set(this._files);
        }
    }), Object.defineProperty(binding_.Chunk.prototype, "runtime", {
        enumerable: !0,
        configurable: !0,
        get () {
            return new Set(this._runtime);
        }
    }), Object.defineProperty(binding_.Chunk.prototype, "auxiliaryFiles", {
        enumerable: !0,
        configurable: !0,
        get () {
            return new Set(this._auxiliaryFiles);
        }
    }), Object.defineProperty(binding_.Chunk.prototype, "groupsIterable", {
        enumerable: !0,
        configurable: !0,
        get () {
            return new Set(this._groupsIterable);
        }
    }), Object.defineProperty(binding_.Chunk.prototype, "getChunkMaps", {
        enumerable: !0,
        configurable: !0,
        value (realHash) {
            let chunkHashMap = {}, chunkContentHashMap = {}, chunkNameMap = {};
            for (let chunk of this.getAllAsyncChunks()){
                let id = chunk.id;
                if (!id) continue;
                let chunkHash = realHash ? chunk.hash : chunk.renderedHash;
                for (let key of (chunkHash && (chunkHashMap[id] = chunkHash), Object.keys(chunk.contentHash)))chunkContentHashMap[key] || (chunkContentHashMap[key] = {}), chunkContentHashMap[key][id] = chunk.contentHash[key];
                chunk.name && (chunkNameMap[id] = chunk.name);
            }
            return {
                hash: chunkHashMap,
                contentHash: chunkContentHashMap,
                name: chunkNameMap
            };
        }
    }), Object.defineProperty(binding_.Chunk.prototype, external_node_util_default().inspect.custom, {
        enumerable: !0,
        configurable: !0,
        value () {
            return {
                ...this
            };
        }
    }), Object.defineProperty(binding_.Chunks.prototype, "entries", {
        enumerable: !0,
        configurable: !0,
        value () {
            let chunks = this._values(), index = 0;
            return {
                [Symbol.iterator] () {
                    return this;
                },
                next () {
                    if (index < chunks.length) {
                        let chunk = chunks[index++];
                        return {
                            value: [
                                chunk,
                                chunk
                            ],
                            done: !1
                        };
                    }
                    return {
                        value: void 0,
                        done: !0
                    };
                }
            };
        }
    }), Object.defineProperty(binding_.Chunks.prototype, "values", {
        enumerable: !0,
        configurable: !0,
        value () {
            return this._values().values();
        }
    }), Object.defineProperty(binding_.Chunks.prototype, Symbol.iterator, {
        enumerable: !0,
        configurable: !0,
        value () {
            return this.values();
        }
    }), Object.defineProperty(binding_.Chunks.prototype, "keys", {
        enumerable: !0,
        configurable: !0,
        value () {
            return this.values();
        }
    }), Object.defineProperty(binding_.Chunks.prototype, "forEach", {
        enumerable: !0,
        configurable: !0,
        value (callbackfn, thisArg) {
            for (let chunk of this._values())callbackfn.call(thisArg, chunk, chunk, this);
        }
    }), Object.defineProperty(binding_.Chunks.prototype, "has", {
        enumerable: !0,
        configurable: !0,
        value (value) {
            return this._has(value);
        }
    }), Object.defineProperty(binding_.ChunkGraph.prototype, "getOrderedChunkModulesIterable", {
        enumerable: !0,
        configurable: !0,
        value (chunk, compareFn) {
            let modules = this.getChunkModules(chunk);
            return modules.sort(compareFn), modules;
        }
    }), Object.defineProperty(binding_.ChunkGraph.prototype, "getModuleChunksIterable", {
        enumerable: !0,
        configurable: !0,
        value (module1) {
            return this.getModuleChunks(module1);
        }
    }), Object.defineProperty(binding_.ChunkGraph.prototype, "getOrderedChunkModulesIterable", {
        enumerable: !0,
        configurable: !0,
        value (chunk, compareFn) {
            let modules = this.getChunkModules(chunk);
            return modules.sort(compareFn), modules;
        }
    }), Object.defineProperty(binding_.ChunkGraph.prototype, "getModuleHash", {
        enumerable: !0,
        configurable: !0,
        value (module1, runtime) {
            return this._getModuleHash(module1, toJsRuntimeSpec(runtime));
        }
    }), Object.defineProperty(binding_default().Sources.prototype, "get", {
        enumerable: !0,
        configurable: !0,
        value (sourceType) {
            let originalSource = this._get(sourceType);
            return originalSource ? SourceAdapter.fromBinding(originalSource) : null;
        }
    });
    let $proxy = Symbol.for("proxy");
    function createDiagnosticArray(adm) {
        if ($proxy in adm) return adm[$proxy];
        let array = [];
        array[external_node_util_default().inspect.custom] = ()=>adm.values();
        let splice = function(index, deleteCount, ...newItems) {
            switch(arguments.length){
                case 0:
                    return [];
                case 1:
                    return adm.spliceWithArray(index, adm.length);
                case 2:
                    return adm.spliceWithArray(index, deleteCount);
            }
            return adm.spliceWithArray(index, deleteCount, newItems);
        }, arrayExtensions = {
            [Symbol.iterator]: ()=>adm.values().values(),
            splice,
            push: (...newItems)=>(adm.spliceWithArray(adm.length, 0, newItems), adm.length),
            pop: ()=>splice(Math.max(adm.length - 1, 0), 1)[0],
            shift: ()=>splice(0, 1)[0],
            unshift: (...newItems)=>(adm.spliceWithArray(0, 0, newItems), adm.length),
            reverse: ()=>adm.values().reverse(),
            sort (compareFn) {
                let copy = adm.values();
                return copy.sort(compareFn), adm.spliceWithArray(0, adm.length, copy), this;
            },
            at: (index)=>adm.get(index),
            concat: (...items)=>([].includes, adm.values().concat(...items)),
            flat: ()=>adm.values(),
            every: (predicate, thisArg)=>adm.values().every(predicate, thisArg),
            filter: (predicate, thisArg)=>adm.values().filter(predicate, thisArg),
            find: (predicate, thisArg)=>adm.values().find(predicate, thisArg),
            findIndex: (predicate, thisArg)=>adm.values().findIndex(predicate, thisArg),
            flatMap: (callbackfn, thisArg)=>adm.values().flatMap(callbackfn, thisArg),
            forEach (callbackfn, thisArg) {
                adm.values().forEach(callbackfn, thisArg);
            },
            map: (callbackfn, thisArg)=>adm.values().map(callbackfn, thisArg),
            slice: (start, end)=>adm.values().slice(start, end),
            reduce: (callbackfn, initialValue)=>adm.values().reduce(callbackfn, initialValue),
            reduceRight: (callbackfn, initialValue)=>adm.values().reduceRight(callbackfn, initialValue)
        }, proxy = new Proxy(array, {
            get: (target, name)=>"length" === name ? adm.length : "string" != typeof name || Number.isNaN(Number.parseInt(name)) ? Object.prototype.hasOwnProperty.call(arrayExtensions, name) ? arrayExtensions[name] : target[name] : adm.get(Number.parseInt(name)),
            set (target, name, value) {
                if ("length" === name) throw Error("The 'length' property is read-only and cannot be assigned a new value.");
                return "symbol" == typeof name || Number.isNaN(Number.parseInt(name)) ? target[name] = value : adm.set(Number.parseInt(name), value), !0;
            }
        });
        return adm[$proxy] = proxy, proxy;
    }
    let checkCompilation = (compilation)=>{
        if (!(compilation instanceof Compilation)) throw TypeError('The \'compilation\' argument must be an instance of Compilation. This usually occurs when multiple versions of "@rspack/core" are used, or when the code in "@rspack/core" is executed multiple times.');
    };
    _computedKey = binding_default().COMPILATION_HOOKS_MAP_SYMBOL;
    class Compilation {
        #inner;
        #shutdown;
        #errors;
        #warnings;
        #chunks;
        hooks;
        name;
        startTime;
        endTime;
        compiler;
        resolverFactory;
        inputFileSystem;
        options;
        outputOptions;
        logging;
        childrenCounters;
        children;
        chunkGraph;
        moduleGraph;
        fileSystemInfo = {
            createSnapshot: ()=>null
        };
        needAdditionalPass;
        #addIncludeDispatcher;
        #addEntryDispatcher;
        [_computedKey];
        constructor(compiler, inner){
            var name, stage, getArgs;
            let errorMessage, getOptions;
            this.#inner = inner, this.#shutdown = !1;
            const processAssetsHook = new lite_tapable_namespaceObject.AsyncSeriesHook([
                "assets"
            ]);
            this.hooks = {
                processAssets: processAssetsHook,
                afterProcessAssets: new lite_tapable_namespaceObject.SyncHook([
                    "assets"
                ]),
                additionalAssets: (name = "additionalAssets", stage = Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL, getArgs = ()=>[], errorMessage = (reason)=>`Can't automatically convert plugin using Compilation.hooks.${name} to Compilation.hooks.processAssets because ${reason}.
BREAKING CHANGE: Asset processing hooks in Compilation has been merged into a single Compilation.hooks.processAssets hook.`, getOptions = (options)=>{
                    let isString = "string" == typeof options;
                    if (!isString && options.stage) throw Error(errorMessage("it's using the 'stage' option"));
                    return {
                        ...isString ? {
                            name: options
                        } : options,
                        stage: stage
                    };
                }, Object.freeze({
                    name,
                    intercept () {
                        throw Error(errorMessage("it's using 'intercept'"));
                    },
                    tap: (options, fn)=>{
                        processAssetsHook.tap(getOptions(options), ()=>fn(...getArgs()));
                    },
                    tapAsync: (options, fn)=>{
                        processAssetsHook.tapAsync(getOptions(options), (assets, callback)=>fn(...getArgs(), callback));
                    },
                    tapPromise: (options, fn)=>{
                        processAssetsHook.tapPromise(getOptions(options), ()=>fn(...getArgs()));
                    },
                    _fakeHook: !0
                })),
                childCompiler: new lite_tapable_namespaceObject.SyncHook([
                    "childCompiler",
                    "compilerName",
                    "compilerIndex"
                ]),
                log: new lite_tapable_namespaceObject.SyncBailHook([
                    "origin",
                    "logEntry"
                ]),
                optimizeModules: new lite_tapable_namespaceObject.SyncBailHook([
                    "modules"
                ]),
                afterOptimizeModules: new lite_tapable_namespaceObject.SyncBailHook([
                    "modules"
                ]),
                optimizeTree: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "chunks",
                    "modules"
                ]),
                optimizeChunkModules: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                    "chunks",
                    "modules"
                ]),
                finishModules: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "modules"
                ]),
                chunkHash: new lite_tapable_namespaceObject.SyncHook([
                    "chunk",
                    "hash"
                ]),
                chunkAsset: new lite_tapable_namespaceObject.SyncHook([
                    "chunk",
                    "filename"
                ]),
                processWarnings: new lite_tapable_namespaceObject.SyncWaterfallHook([
                    "warnings"
                ]),
                succeedModule: new lite_tapable_namespaceObject.SyncHook([
                    "module"
                ]),
                stillValidModule: new lite_tapable_namespaceObject.SyncHook([
                    "module"
                ]),
                statsPreset: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncHook([
                        "options",
                        "context"
                    ])),
                statsNormalize: new lite_tapable_namespaceObject.SyncHook([
                    "options",
                    "context"
                ]),
                statsFactory: new lite_tapable_namespaceObject.SyncHook([
                    "statsFactory",
                    "options"
                ]),
                statsPrinter: new lite_tapable_namespaceObject.SyncHook([
                    "statsPrinter",
                    "options"
                ]),
                buildModule: new lite_tapable_namespaceObject.SyncHook([
                    "module"
                ]),
                executeModule: new lite_tapable_namespaceObject.SyncHook([
                    "options",
                    "context"
                ]),
                additionalTreeRuntimeRequirements: new lite_tapable_namespaceObject.SyncHook([
                    "chunk",
                    "runtimeRequirements"
                ]),
                runtimeRequirementInTree: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.SyncBailHook([
                        "chunk",
                        "runtimeRequirements"
                    ])),
                runtimeModule: new lite_tapable_namespaceObject.SyncHook([
                    "module",
                    "chunk"
                ]),
                seal: new lite_tapable_namespaceObject.SyncHook([]),
                afterSeal: new lite_tapable_namespaceObject.AsyncSeriesHook([]),
                needAdditionalPass: new lite_tapable_namespaceObject.SyncBailHook([])
            }, this.compiler = compiler, this.resolverFactory = compiler.resolverFactory, this.inputFileSystem = compiler.inputFileSystem, this.options = compiler.options, this.outputOptions = compiler.options.output, this.logging = new Map(), this.childrenCounters = {}, this.children = [], this.needAdditionalPass = !1, this.chunkGraph = inner.chunkGraph, this.moduleGraph = ModuleGraph.__from_binding(inner.moduleGraph), this.#addIncludeDispatcher = new AddEntryItemDispatcher(inner.addInclude.bind(inner)), this.#addEntryDispatcher = new AddEntryItemDispatcher(inner.addEntry.bind(inner)), this[binding_default().COMPILATION_HOOKS_MAP_SYMBOL] = new WeakMap();
        }
        get hash() {
            return this.#inner.hash;
        }
        get fullHash() {
            return this.#inner.hash;
        }
        get assets() {
            return this.#createCachedAssets();
        }
        get entrypoints() {
            return new Map(this.#inner.entrypoints.map((entrypoint)=>[
                    entrypoint.name,
                    entrypoint
                ]));
        }
        get chunkGroups() {
            return this.#inner.chunkGroups;
        }
        get namedChunkGroups() {
            return createReadonlyMap({
                keys: ()=>this.#inner.getNamedChunkGroupKeys()[Symbol.iterator](),
                get: (property)=>{
                    if ("string" == typeof property) return this.#inner.getNamedChunkGroup(property);
                }
            });
        }
        get modules() {
            return new Set(this.#inner.modules);
        }
        get builtModules() {
            return new Set(this.#inner.builtModules);
        }
        get chunks() {
            return this.#chunks || (this.#chunks = this.#inner.chunks), this.#chunks;
        }
        get namedChunks() {
            return createReadonlyMap({
                keys: ()=>this.#inner.getNamedChunkKeys()[Symbol.iterator](),
                get: (property)=>{
                    if ("string" == typeof property) return this.#inner.getNamedChunk(property);
                }
            });
        }
        get entries() {
            return new Entries(this.#inner.entries);
        }
        get codeGenerationResults() {
            return this.#inner.codeGenerationResults;
        }
        #createCachedAssets() {
            return new Proxy({}, {
                get: (_, property)=>{
                    if ("string" == typeof property) return this.__internal__getAssetSource(property);
                },
                set: (_, p, newValue)=>"string" == typeof p && (this.__internal__setAssetSource(p, newValue), !0),
                deleteProperty: (_, p)=>"string" == typeof p && (this.__internal__deleteAssetSource(p), !0),
                has: (_, property)=>"string" == typeof property && this.__internal__hasAsset(property),
                ownKeys: (_)=>this.__internal__getAssetFilenames(),
                getOwnPropertyDescriptor: ()=>({
                        enumerable: !0,
                        configurable: !0
                    })
            });
        }
        getCache(name) {
            return this.compiler.getCache(name);
        }
        createStatsOptions(statsValue, context = {}) {
            let optionsOrPreset = statsValue;
            if (("boolean" == typeof optionsOrPreset || "string" == typeof optionsOrPreset) && (optionsOrPreset = {
                preset: optionsOrPreset
            }), "object" == typeof optionsOrPreset && null !== optionsOrPreset) {
                let options = {};
                for(let key in optionsOrPreset)options[key] = optionsOrPreset[key];
                return void 0 !== options.preset && this.hooks.statsPreset.for(options.preset).call(options, context), this.hooks.statsNormalize.call(options, context), options;
            }
            let options = {};
            return this.hooks.statsNormalize.call(options, context), options;
        }
        createStatsFactory(options) {
            let statsFactory = new StatsFactory();
            return this.hooks.statsFactory.call(statsFactory, options), statsFactory;
        }
        createStatsPrinter(options) {
            let statsPrinter = new StatsPrinter();
            return this.hooks.statsPrinter.call(statsPrinter, options), statsPrinter;
        }
        updateAsset(filename, newSourceOrFunction, assetInfoUpdateOrFunction) {
            let compatNewSourceOrFunction;
            compatNewSourceOrFunction = "function" == typeof newSourceOrFunction ? function(source) {
                return SourceAdapter.toBinding(newSourceOrFunction(SourceAdapter.fromBinding(source)));
            } : SourceAdapter.toBinding(newSourceOrFunction), this.#inner.updateAsset(filename, compatNewSourceOrFunction, assetInfoUpdateOrFunction);
        }
        emitAsset(filename, source, assetInfo) {
            this.#inner.emitAsset(filename, SourceAdapter.toBinding(source), assetInfo);
        }
        deleteAsset(filename) {
            this.#inner.deleteAsset(filename);
        }
        renameAsset(filename, newFilename) {
            this.#inner.renameAsset(filename, newFilename);
        }
        getAssets() {
            return this.#inner.getAssets().map((asset)=>Object.defineProperties(asset, {
                    info: {
                        value: asset.info
                    },
                    source: {
                        get: ()=>this.__internal__getAssetSource(asset.name)
                    }
                }));
        }
        getAsset(name) {
            let asset = this.#inner.getAsset(name);
            if (asset) return Object.defineProperties(asset, {
                info: {
                    value: asset.info
                },
                source: {
                    get: ()=>this.__internal__getAssetSource(asset.name)
                }
            });
        }
        __internal__pushRspackDiagnostic(diagnostic) {
            this.#inner.pushDiagnostic(diagnostic);
        }
        __internal__pushDiagnostic(diagnostic) {
            this.#inner.pushNativeDiagnostic(diagnostic);
        }
        __internal__pushDiagnostics(diagnostics) {
            this.#inner.pushNativeDiagnostics(diagnostics);
        }
        get errors() {
            return this.#errors || (this.#errors = createDiagnosticArray(this.#inner.errors)), this.#errors;
        }
        set errors(errors) {
            this.#errors || (this.#errors = createDiagnosticArray(this.#inner.errors)), this.#errors.splice(0, this.#errors.length, ...errors);
        }
        get warnings() {
            return this.#warnings || (this.#warnings = createDiagnosticArray(this.#inner.warnings)), this.#warnings;
        }
        set warnings(warnings) {
            this.#warnings || (this.#warnings = createDiagnosticArray(this.#inner.warnings)), this.#warnings.splice(0, this.#warnings.length, ...warnings);
        }
        getPath(filename, data = {}) {
            let pathData = {
                ...data
            };
            return data.contentHashType && data.chunk?.contentHash && (pathData.contentHash = data.chunk.contentHash[data.contentHashType]), this.#inner.getPath(filename, pathData);
        }
        getPathWithInfo(filename, data = {}) {
            let pathData = {
                ...data
            };
            return data.contentHashType && data.chunk?.contentHash && (pathData.contentHash = data.chunk.contentHash[data.contentHashType]), this.#inner.getPathWithInfo(filename, pathData);
        }
        getAssetPath(filename, data = {}) {
            let pathData = {
                ...data
            };
            return data.contentHashType && data.chunk?.contentHash && (pathData.contentHash = data.chunk.contentHash[data.contentHashType]), this.#inner.getAssetPath(filename, pathData);
        }
        getAssetPathWithInfo(filename, data = {}) {
            let pathData = {
                ...data
            };
            return data.contentHashType && data.chunk?.contentHash && (pathData.contentHash = data.chunk.contentHash[data.contentHashType]), this.#inner.getAssetPathWithInfo(filename, pathData);
        }
        getLogger(name) {
            let logEntries;
            if (!name) throw TypeError("Compilation.getLogger(name) called without a name");
            let logName = name;
            return new Logger((type, args)=>{
                if ("function" == typeof logName && !(logName = logName())) throw TypeError("Compilation.getLogger(name) called with a function not returning a name");
                let logEntry = {
                    time: Date.now(),
                    type,
                    args,
                    get trace () {
                        switch(type){
                            case LogType.warn:
                            case LogType.error:
                            case LogType.trace:
                                return cutOffLoaderExecution(Error("Trace").stack).split("\n").slice(3);
                            default:
                                return;
                        }
                    }
                };
                void 0 === this.hooks.log.call(logName, logEntry) && (logEntry.type === LogType.profileEnd && "function" == typeof console.profileEnd && console.profileEnd(`[${logName}] ${logEntry.args[0]}`), void 0 === logEntries && void 0 === (logEntries = this.logging.get(logName)) && (logEntries = [], this.logging.set(logName, logEntries)), logEntries.push(logEntry), logEntry.type === LogType.profile && "function" == typeof console.profile && console.profile(`[${logName}] ${logEntry.args[0]}`));
            }, (childName)=>{
                let normalizedChildName = childName;
                return "function" == typeof logName ? "function" == typeof normalizedChildName ? this.getLogger(()=>{
                    if ("function" == typeof logName && !(logName = logName())) throw TypeError("Compilation.getLogger(name) called with a function not returning a name");
                    if ("function" == typeof normalizedChildName && !(normalizedChildName = normalizedChildName())) throw TypeError("Logger.getChildLogger(name) called with a function not returning a name");
                    return `${logName}/${normalizedChildName}`;
                }) : this.getLogger(()=>{
                    if ("function" == typeof logName && !(logName = logName())) throw TypeError("Compilation.getLogger(name) called with a function not returning a name");
                    return `${logName}/${normalizedChildName}`;
                }) : "function" == typeof normalizedChildName ? this.getLogger(()=>{
                    if ("function" == typeof normalizedChildName && !(normalizedChildName = normalizedChildName())) throw TypeError("Logger.getChildLogger(name) called with a function not returning a name");
                    return `${logName}/${normalizedChildName}`;
                }) : this.getLogger(`${logName}/${normalizedChildName}`);
            });
        }
        fileDependencies = createFakeCompilationDependencies(()=>this.#inner.dependencies().fileDependencies, (d)=>this.#inner.addFileDependencies(d));
        get __internal__addedFileDependencies() {
            return this.#inner.dependencies().addedFileDependencies;
        }
        get __internal__removedFileDependencies() {
            return this.#inner.dependencies().removedFileDependencies;
        }
        get __internal__addedContextDependencies() {
            return this.#inner.dependencies().addedContextDependencies;
        }
        get __internal__removedContextDependencies() {
            return this.#inner.dependencies().removedContextDependencies;
        }
        get __internal__addedMissingDependencies() {
            return this.#inner.dependencies().addedMissingDependencies;
        }
        get __internal__removedMissingDependencies() {
            return this.#inner.dependencies().removedMissingDependencies;
        }
        contextDependencies = createFakeCompilationDependencies(()=>this.#inner.dependencies().contextDependencies, (d)=>this.#inner.addContextDependencies(d));
        missingDependencies = createFakeCompilationDependencies(()=>this.#inner.dependencies().missingDependencies, (d)=>this.#inner.addMissingDependencies(d));
        buildDependencies = createFakeCompilationDependencies(()=>this.#inner.dependencies().buildDependencies, (d)=>this.#inner.addBuildDependencies(d));
        getStats() {
            return new Stats(this);
        }
        createChildCompiler(name, outputOptions, plugins) {
            let idx = this.childrenCounters[name] || 0;
            return this.childrenCounters[name] = idx + 1, this.compiler.createChildCompiler(this, name, idx, outputOptions, plugins);
        }
        #rebuildModuleTask = new AsyncTask((moduleIdentifiers, doneWork)=>{
            this.#inner.rebuildModule(moduleIdentifiers, (err, modules)=>{
                err ? doneWork(Array(moduleIdentifiers.length).fill([
                    err,
                    null
                ])) : doneWork(modules.map((module1)=>[
                        null,
                        module1
                    ]));
            });
        });
        rebuildModule(module1, f) {
            this.#rebuildModuleTask.exec(module1.identifier(), f);
        }
        addRuntimeModule(chunk, runtimeModule) {
            runtimeModule.attach(this, chunk, this.chunkGraph), this.#inner.addRuntimeModule(chunk, RuntimeModule.__to_binding(runtimeModule));
        }
        addInclude(context, dependency, options, callback) {
            this.#addIncludeDispatcher.call(context, dependency, options, callback);
        }
        addEntry(context, dependency, optionsOrName, callback) {
            this.#addEntryDispatcher.call(context, dependency, "object" == typeof optionsOrName ? optionsOrName : {
                name: optionsOrName
            }, callback);
        }
        getWarnings() {
            return this.hooks.processWarnings.call(this.#inner.getWarnings());
        }
        getErrors() {
            return this.#inner.getErrors();
        }
        __internal__getAssetSource(filename) {
            let rawSource = this.#inner.getAssetSource(filename);
            if (rawSource) return SourceAdapter.fromBinding(rawSource);
        }
        __internal__setAssetSource(filename, source) {
            this.#inner.setAssetSource(filename, SourceAdapter.toBinding(source));
        }
        __internal__deleteAssetSource(filename) {
            this.#inner.deleteAssetSource(filename);
        }
        __internal__getAssetFilenames() {
            return this.#inner.getAssetFilenames();
        }
        __internal__hasAsset(name) {
            return this.#inner.hasAsset(name);
        }
        __internal_getInner() {
            return this.#inner;
        }
        get __internal__shutdown() {
            return this.#shutdown;
        }
        set __internal__shutdown(shutdown) {
            this.#shutdown = shutdown;
        }
        seal() {}
        unseal() {}
        static PROCESS_ASSETS_STAGE_ADDITIONAL = -2000;
        static PROCESS_ASSETS_STAGE_PRE_PROCESS = -1000;
        static PROCESS_ASSETS_STAGE_DERIVED = -200;
        static PROCESS_ASSETS_STAGE_ADDITIONS = -100;
        static PROCESS_ASSETS_STAGE_NONE = 0;
        static PROCESS_ASSETS_STAGE_OPTIMIZE = 100;
        static PROCESS_ASSETS_STAGE_OPTIMIZE_COUNT = 200;
        static PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY = 300;
        static PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE = 400;
        static PROCESS_ASSETS_STAGE_DEV_TOOLING = 500;
        static PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE = 700;
        static PROCESS_ASSETS_STAGE_SUMMARIZE = 1000;
        static PROCESS_ASSETS_STAGE_OPTIMIZE_HASH = 2500;
        static PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER = 3000;
        static PROCESS_ASSETS_STAGE_ANALYSE = 4000;
        static PROCESS_ASSETS_STAGE_REPORT = 5000;
    }
    class AddEntryItemDispatcher {
        #inner;
        #running;
        #args = [];
        #cbs = [];
        #execute = ()=>{
            if (this.#running) return;
            let args = this.#args;
            this.#args = [];
            let cbs = this.#cbs;
            this.#cbs = [], this.#inner(args, (wholeErr, results)=>{
                if (0 !== this.#args.length && queueMicrotask(this.#execute.bind(this)), wholeErr) {
                    let webpackError = new lib_WebpackError(wholeErr.message);
                    for (let cb of cbs)cb(webpackError);
                    return;
                }
                for(let i = 0; i < results.length; i++){
                    let [errMsg, module1] = results[i];
                    (0, cbs[i])(errMsg ? new lib_WebpackError(errMsg) : null, module1);
                }
            });
        };
        constructor(binding){
            this.#inner = binding, this.#running = !1;
        }
        call(context, dependency, options, callback) {
            0 === this.#args.length && queueMicrotask(this.#execute.bind(this)), this.#args.push([
                context,
                dependency,
                options
            ]), this.#cbs.push(callback);
        }
    }
    class EntryData {
        dependencies;
        includeDependencies;
        options;
        static __from_binding(binding) {
            return new EntryData(binding);
        }
        constructor(binding){
            this.dependencies = binding.dependencies, this.includeDependencies = binding.includeDependencies, this.options = binding.options;
        }
    }
    _computedKey1 = Symbol.iterator, _computedKey2 = Symbol.toStringTag;
    class Entries {
        #data;
        constructor(data){
            this.#data = data;
        }
        clear() {
            this.#data.clear();
        }
        forEach(callback, thisArg) {
            for (let [key, binding] of this){
                let value = EntryData.__from_binding(binding);
                callback.call(thisArg, value, key, this);
            }
        }
        get size() {
            return this.#data.size;
        }
        *entries() {
            for (let key of this.keys())yield [
                key,
                this.get(key)
            ];
        }
        values() {
            return this.#data.values().map(EntryData.__from_binding)[Symbol.iterator]();
        }
        [_computedKey1]() {
            return this.entries();
        }
        [_computedKey2] = "Map";
        has(key) {
            return this.#data.has(key);
        }
        set(key, value) {
            return this.#data.set(key, value), this;
        }
        delete(key) {
            return this.#data.delete(key);
        }
        get(key) {
            let binding = this.#data.get(key);
            return binding ? EntryData.__from_binding(binding) : void 0;
        }
        keys() {
            return this.#data.keys()[Symbol.iterator]();
        }
    }
    let HOOKS_CAN_NOT_INHERENT_FROM_PARENT = [
        "make",
        "compile",
        "emit",
        "afterEmit",
        "invalid",
        "done",
        "thisCompilation"
    ];
    function canInherentFromParent(affectedHooks) {
        return void 0 !== affectedHooks && !HOOKS_CAN_NOT_INHERENT_FROM_PARENT.includes(affectedHooks);
    }
    class RspackBuiltinPlugin {
        affectedHooks;
        apply(compiler) {
            let raw = this.raw(compiler);
            raw && (raw.canInherentFromParent = canInherentFromParent(this.affectedHooks), compiler.__internal__registerBuiltinPlugin(raw));
        }
    }
    function createBuiltinPlugin(name, options) {
        return {
            name: name,
            options: options ?? !1
        };
    }
    function base_create(name, resolve, affectedHooks) {
        class Plugin extends RspackBuiltinPlugin {
            name = name;
            _args;
            affectedHooks = affectedHooks;
            constructor(...args){
                super(), this._args = args;
            }
            raw(compiler) {
                return createBuiltinPlugin(name, resolve.apply(compiler, this._args));
            }
        }
        return Object.defineProperty(Plugin, "name", {
            value: name
        }), Plugin;
    }
    let INTERNAL_PLUGIN_NAMES = Object.keys(binding_default().BuiltinPluginName), APIPlugin = base_create(binding_.BuiltinPluginName.APIPlugin, ()=>{}), ArrayPushCallbackChunkFormatPlugin = base_create(binding_.BuiltinPluginName.ArrayPushCallbackChunkFormatPlugin, ()=>{}), AssetModulesPlugin = base_create(binding_.BuiltinPluginName.AssetModulesPlugin, ()=>{}, "compilation"), AsyncWebAssemblyModulesPlugin = base_create(binding_.BuiltinPluginName.AsyncWebAssemblyModulesPlugin, ()=>{}, "compilation"), BannerPlugin = base_create(binding_.BuiltinPluginName.BannerPlugin, (args)=>"string" == typeof args || "function" == typeof args ? {
            banner: args
        } : {
            banner: args.banner,
            entryOnly: args.entryOnly,
            footer: args.footer,
            raw: args.raw,
            test: args.test,
            stage: args.stage,
            include: args.include,
            exclude: args.exclude
        }), BundlerInfoRspackPlugin = base_create(binding_.BuiltinPluginName.BundlerInfoRspackPlugin, (options)=>({
            version: options.version || "unknown",
            bundler: options.bundler || "rspack",
            force: options.force ?? !0
        })), ChunkPrefetchPreloadPlugin = base_create(binding_.BuiltinPluginName.ChunkPrefetchPreloadPlugin, ()=>{});
    class CircularDependencyRspackPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.CircularDependencyRspackPlugin;
        _options;
        constructor(options){
            super(), this._options = options;
        }
        raw(compiler) {
            let { failOnError, allowAsyncCycles, exclude, ignoredConnections } = this._options, rawOptions = {
                failOnError,
                allowAsyncCycles,
                exclude,
                ignoredConnections,
                onDetected: this._options.onDetected ? (entripoint, modules)=>{
                    let compilation = compiler.__internal__get_compilation();
                    this._options.onDetected(entripoint, modules, compilation);
                } : void 0,
                onIgnored: this._options.onIgnored ? (entripoint, modules)=>{
                    let compilation = compiler.__internal__get_compilation();
                    this._options.onIgnored(entripoint, modules, compilation);
                } : void 0,
                onStart: this._options.onStart ? ()=>{
                    let compilation = compiler.__internal__get_compilation();
                    this._options.onStart(compilation);
                } : void 0,
                onEnd: this._options.onEnd ? ()=>{
                    let compilation = compiler.__internal__get_compilation();
                    this._options.onEnd(compilation);
                } : void 0
            };
            return createBuiltinPlugin(this.name, rawOptions);
        }
    }
    let CommonJsChunkFormatPlugin = base_create(binding_.BuiltinPluginName.CommonJsChunkFormatPlugin, ()=>{}), ContextReplacementPlugin = base_create(binding_.BuiltinPluginName.ContextReplacementPlugin, (resourceRegExp, newContentResource, newContentRecursive, newContentRegExp)=>{
        let rawOptions = {
            resourceRegExp
        };
        return "function" == typeof newContentResource || ("string" == typeof newContentResource && "object" == typeof newContentRecursive ? (rawOptions.newContentResource = newContentResource, rawOptions.newContentCreateContextMap = newContentRecursive) : "string" == typeof newContentResource && "function" == typeof newContentRecursive ? rawOptions.newContentResource = newContentResource : ("string" != typeof newContentResource && (newContentRegExp = newContentRecursive, newContentRecursive = newContentResource, newContentResource = void 0), "boolean" != typeof newContentRecursive && (newContentRegExp = newContentRecursive, newContentRecursive = void 0), rawOptions.newContentResource = newContentResource, rawOptions.newContentRecursive = newContentRecursive, rawOptions.newContentRegExp = newContentRegExp)), rawOptions;
    }), CopyRspackPlugin = base_create(binding_.BuiltinPluginName.CopyRspackPlugin, (copy)=>{
        let ret = {
            patterns: []
        };
        return ret.patterns = (copy.patterns || []).map((pattern)=>{
            "string" == typeof pattern && (pattern = {
                from: pattern
            }), pattern.force ??= !1, pattern.noErrorOnMissing ??= !1, pattern.priority ??= 0, pattern.globOptions ??= {}, pattern.copyPermissions ??= !1;
            let originalTransform = pattern.transform;
            return originalTransform && ("object" == typeof originalTransform ? pattern.transform = (input, absoluteFilename)=>Promise.resolve(originalTransform.transformer(input, absoluteFilename)) : pattern.transform = (input, absoluteFilename)=>Promise.resolve(originalTransform(input, absoluteFilename))), pattern;
        }), ret;
    }), CssChunkingPlugin = base_create(binding_default().BuiltinPluginName.CssChunkingPlugin, function(options = {}) {
        if (options.nextjs) return {
            strict: options.strict,
            minSize: options.minSize,
            maxSize: options.maxSize,
            exclude: /^pages\//
        };
        let { splitChunks } = this.options.optimization;
        if (splitChunks) {
            let cssMiniExtractIndex = splitChunks.defaultSizeTypes.indexOf("css/mini-extract");
            cssMiniExtractIndex && splitChunks.defaultSizeTypes.splice(cssMiniExtractIndex, 1);
            let cssIndex = splitChunks.defaultSizeTypes.indexOf("css");
            cssIndex && splitChunks.defaultSizeTypes.splice(cssIndex, 1);
        }
        return options;
    }), CssModulesPlugin = base_create(binding_.BuiltinPluginName.CssModulesPlugin, ()=>{}, "compilation"), external_node_path_namespaceObject = require("node:path");
    var external_node_path_default = __webpack_require__.n(external_node_path_namespaceObject);
    let DEFAULT_FILENAME = "[name].css", LOADER_PATH = (0, external_node_path_namespaceObject.join)(__dirname, "cssExtractLoader.js");
    class CssExtractRspackPlugin {
        static pluginName = "css-extract-rspack-plugin";
        static loader = LOADER_PATH;
        options;
        constructor(options){
            this.options = options || {};
        }
        apply(compiler) {
            let { splitChunks } = compiler.options.optimization;
            splitChunks && splitChunks.defaultSizeTypes.includes("...") && splitChunks.defaultSizeTypes.push("css/mini-extract"), compiler.options.output.pathinfo && void 0 === this.options.pathinfo && (this.options.pathinfo = !0), compiler.__internal__registerBuiltinPlugin({
                name: binding_.BuiltinPluginName.CssExtractRspackPlugin,
                options: this.normalizeOptions(this.options)
            });
        }
        normalizeOptions(options) {
            let chunkFilename = options.chunkFilename;
            if (!chunkFilename) {
                let filename = options.filename || DEFAULT_FILENAME;
                if ("function" != typeof filename) {
                    let hasName = filename.includes("[name]"), hasId = filename.includes("[id]"), hasChunkHash = filename.includes("[chunkhash]"), hasContentHash = filename.includes("[contenthash]");
                    chunkFilename = hasChunkHash || hasContentHash || hasName || hasId ? filename : filename.replace(/(^|\/)([^/]*(?:\?|$))/, "$1[id].$2");
                } else chunkFilename = "[id].css";
            }
            return {
                filename: options.filename || DEFAULT_FILENAME,
                chunkFilename: chunkFilename,
                ignoreOrder: options.ignoreOrder ?? !1,
                runtime: options.runtime ?? !0,
                insert: "function" == typeof options.insert ? options.insert.toString() : JSON.stringify(options.insert),
                linkType: void 0 === options.linkType ? JSON.stringify("text/css") : !1 === options.linkType ? void 0 : JSON.stringify(options.linkType),
                attributes: options.attributes ? Reflect.ownKeys(options.attributes).map((k)=>[
                        JSON.stringify(k),
                        JSON.stringify(options.attributes[k])
                    ]).reduce((obj, [k, v])=>(obj[k] = v, obj), {}) : {},
                pathinfo: options.pathinfo ?? !1,
                enforceRelative: options.enforceRelative ?? !1
            };
        }
    }
    let DataUriPlugin = base_create(binding_.BuiltinPluginName.DataUriPlugin, ()=>{}, "compilation"), DefinePlugin = base_create(binding_.BuiltinPluginName.DefinePlugin, function(define) {
        return normalizeValue(define, this.options.output.environment?.bigIntLiteral ?? !1);
    }, "compilation"), normalizeValue = (define, supportsBigIntLiteral)=>{
        let normalizePrimitive = (p)=>void 0 === p ? "undefined" : Object.is(p, -0) ? "-0" : p instanceof RegExp ? p.toString() : "function" == typeof p ? `(${p.toString()})` : "bigint" == typeof p ? supportsBigIntLiteral ? `${p}n` : `BigInt("${p}")` : p, normalizeObject = (define)=>Array.isArray(define) ? define.map(normalizeObject) : define instanceof RegExp ? normalizePrimitive(define) : define && "object" == typeof define ? Object.fromEntries(Object.keys(define).map((k)=>[
                    k,
                    normalizeObject(define[k])
                ])) : normalizePrimitive(define);
        return normalizeObject(define);
    };
    class DeterministicChunkIdsPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.DeterministicChunkIdsPlugin;
        affectedHooks = "compilation";
        raw() {
            return createBuiltinPlugin(this.name, void 0);
        }
    }
    class DeterministicModuleIdsPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.DeterministicModuleIdsPlugin;
        affectedHooks = "compilation";
        raw() {
            return createBuiltinPlugin(this.name, void 0);
        }
    }
    let DllEntryPlugin = base_create(binding_.BuiltinPluginName.DllEntryPlugin, (context, entries, options)=>({
            context,
            entries,
            name: options.name
        })), DllReferenceAgencyPlugin = base_create(binding_.BuiltinPluginName.DllReferenceAgencyPlugin, (options)=>options);
    class EntryOptionPlugin {
        apply(compiler) {
            compiler.hooks.entryOption.tap("EntryOptionPlugin", (context, entry)=>(EntryOptionPlugin.applyEntryOption(compiler, context, entry), !0));
        }
        static applyEntryOption(compiler, context, entry) {
            if ("function" == typeof entry) new DynamicEntryPlugin(context, entry).apply(compiler);
            else for (let name of Object.keys(entry)){
                let desc = entry[name], options = EntryOptionPlugin.entryDescriptionToOptions(compiler, name, desc);
                if (void 0 === desc.import) throw Error("desc.import should not be `undefined` once `EntryOptionPlugin.applyEntryOption` is called");
                for (let entry of desc.import)new EntryPlugin(context, entry, options).apply(compiler);
            }
        }
        static entryDescriptionToOptions(compiler, name, desc) {
            return {
                name,
                filename: desc.filename,
                runtime: desc.runtime,
                layer: desc.layer,
                dependOn: desc.dependOn,
                baseUri: desc.baseUri,
                publicPath: desc.publicPath,
                chunkLoading: desc.chunkLoading,
                asyncChunks: desc.asyncChunks,
                library: desc.library
            };
        }
    }
    let lib_EntryOptionPlugin = EntryOptionPlugin, EntryPlugin = base_create(binding_.BuiltinPluginName.EntryPlugin, (context, entry, options = "")=>({
            context,
            entry,
            options: getRawEntryOptions("string" == typeof options ? {
                name: options
            } : options)
        }), "make");
    function getRawEntryOptions(entry) {
        let runtime = entry.runtime, chunkLoading = entry.chunkLoading;
        return {
            name: entry.name,
            publicPath: entry.publicPath,
            baseUri: entry.baseUri,
            runtime,
            chunkLoading,
            asyncChunks: entry.asyncChunks,
            filename: entry.filename,
            library: entry.library,
            layer: entry.layer ?? void 0,
            dependOn: entry.dependOn
        };
    }
    EntryPlugin.createDependency = (request)=>new binding_.EntryDependency(request);
    class DynamicEntryPlugin extends RspackBuiltinPlugin {
        context;
        entry;
        name = binding_.BuiltinPluginName.DynamicEntryPlugin;
        affectedHooks = "make";
        constructor(context, entry){
            super(), this.context = context, this.entry = entry;
        }
        raw(compiler) {
            let raw = {
                context: this.context,
                entry: async ()=>Object.entries(await this.entry()).map(([name, desc])=>{
                        let options = lib_EntryOptionPlugin.entryDescriptionToOptions(compiler, name, desc);
                        return {
                            import: desc.import,
                            options: getRawEntryOptions(options)
                        };
                    })
            };
            return createBuiltinPlugin(this.name, raw);
        }
    }
    let ElectronTargetPlugin = base_create(binding_.BuiltinPluginName.ElectronTargetPlugin, (context)=>context ?? "none"), EnableChunkLoadingPluginInner = base_create(binding_.BuiltinPluginName.EnableChunkLoadingPlugin, (type)=>type), enabledTypes = new WeakMap(), getEnabledTypes = (compiler)=>{
        let set = enabledTypes.get(compiler);
        return void 0 === set && (set = new Set(), enabledTypes.set(compiler, set)), set;
    };
    class EnableChunkLoadingPlugin extends EnableChunkLoadingPluginInner {
        static setEnabled(compiler, type) {
            getEnabledTypes(compiler).add(type);
        }
        static checkEnabled(compiler, type) {
            if (!getEnabledTypes(compiler).has(type)) throw Error(`Chunk loading type "${type}" is not enabled. EnableChunkLoadingPlugin need to be used to enable this type of chunk loading. This usually happens through the "output.enabledChunkLoadingTypes" option. If you are using a function as entry which sets "chunkLoading", you need to add all potential chunk loading types to "output.enabledChunkLoadingTypes". These types are enabled: ${Array.from(getEnabledTypes(compiler)).join(", ")}`);
        }
        apply(compiler) {
            let [type] = this._args, enabled = getEnabledTypes(compiler);
            if (!enabled.has(type)) switch(enabled.add(type), type){
                case "jsonp":
                case "import-scripts":
                case "require":
                case "async-node":
                case "import":
                    return void super.apply(compiler);
                default:
                    throw Error(`Unsupported chunk loading type ${type}.
Plugins which provide custom chunk loading types must call EnableChunkLoadingPlugin.setEnabled(compiler, type) to disable this error.`);
            }
        }
    }
    let EnableLibraryPlugin_enabledTypes = new WeakMap(), EnableLibraryPlugin_getEnabledTypes = (compiler)=>{
        let set = EnableLibraryPlugin_enabledTypes.get(compiler);
        return void 0 === set && (set = new Set(), EnableLibraryPlugin_enabledTypes.set(compiler, set)), set;
    };
    class EnableLibraryPlugin extends RspackBuiltinPlugin {
        type;
        name = binding_.BuiltinPluginName.EnableLibraryPlugin;
        constructor(type){
            super(), this.type = type;
        }
        static setEnabled(compiler, type) {
            EnableLibraryPlugin_getEnabledTypes(compiler).add(type);
        }
        static checkEnabled(compiler, type) {
            if (!EnableLibraryPlugin_getEnabledTypes(compiler).has(type)) throw Error(`Library type "${type}" is not enabled. EnableLibraryPlugin need to be used to enable this type of library. This usually happens through the "output.enabledLibraryTypes" option. If you are using a function as entry which sets "library", you need to add all potential library types to "output.enabledLibraryTypes". These types are enabled: ${Array.from(EnableLibraryPlugin_getEnabledTypes(compiler)).join(", ")}`);
        }
        raw(compiler) {
            let type = this.type, enabled = EnableLibraryPlugin_getEnabledTypes(compiler);
            if (!enabled.has(type)) return enabled.add(type), createBuiltinPlugin(this.name, type);
        }
    }
    let EnableWasmLoadingPlugin = base_create(binding_.BuiltinPluginName.EnableWasmLoadingPlugin, (type)=>type), EnsureChunkConditionsPlugin = base_create(binding_.BuiltinPluginName.EnsureChunkConditionsPlugin, ()=>{}), RemoveDuplicateModulesPlugin = base_create(binding_.BuiltinPluginName.RemoveDuplicateModulesPlugin, ()=>({}));
    class EsmLibraryPlugin {
        static PLUGIN_NAME = "EsmLibraryPlugin";
        options;
        constructor(options){
            this.options = options;
        }
        apply(compiler) {
            var config;
            let err, logger = compiler.getInfrastructureLogger(EsmLibraryPlugin.PLUGIN_NAME);
            if (!function(options, logger) {
                options.optimization.concatenateModules = !1, options.output.chunkFormat = !1, options.output.chunkLoading && "import" !== options.output.chunkLoading && (logger.warn(`\`output.chunkLoading\` should be \`"import"\` or \`false\`, but got ${options.output.chunkLoading}, changed it to \`"import"\``), options.output.chunkLoading = "import"), void 0 === options.output.chunkLoading && (options.output.chunkLoading = "import"), options.output.library && (options.output.library = void 0);
                let { splitChunks } = options.optimization;
                void 0 === splitChunks && (splitChunks = options.optimization.splitChunks = {}), !1 !== splitChunks && (splitChunks.chunks = "all", splitChunks.minSize = 0, splitChunks.maxAsyncRequests = 1 / 0, splitChunks.maxInitialRequests = 1 / 0, splitChunks.cacheGroups ??= {}, splitChunks.cacheGroups.default = !1, splitChunks.cacheGroups.defaultVendors = !1);
            }(compiler.options, logger), new RemoveDuplicateModulesPlugin().apply(compiler), err = (config = compiler.options).optimization.concatenateModules ? "You should disable `config.optimization.concatenateModules`" : !1 !== config.output.chunkFormat ? "You should disable default chunkFormat by `config.output.chunkFormat = false`" : void 0) throw new src_0.WebpackError(`Conflicted config for ${EsmLibraryPlugin.PLUGIN_NAME}: ${err}`);
            compiler.__internal__registerBuiltinPlugin({
                name: binding_.BuiltinPluginName.EsmLibraryPlugin,
                options: {
                    preserveModules: this.options?.preserveModules
                }
            });
        }
    }
    let EvalDevToolModulePlugin = base_create(binding_.BuiltinPluginName.EvalDevToolModulePlugin, (options)=>options, "compilation"), EvalSourceMapDevToolPlugin = base_create(binding_.BuiltinPluginName.EvalSourceMapDevToolPlugin, (options)=>options, "compilation");
    function isNil(value) {
        return null == value;
    }
    let toBuffer = (bufLike)=>{
        if (Buffer.isBuffer(bufLike)) return bufLike;
        if ("string" == typeof bufLike) return Buffer.from(bufLike);
        if (bufLike instanceof Uint8Array) return Buffer.from(bufLike.buffer);
        throw Error("Buffer, Uint8Array or string expected");
    };
    function serializeObject(map) {
        if (!isNil(map)) return "string" == typeof map ? map ? toBuffer(map) : void 0 : toBuffer(JSON.stringify(map));
    }
    function stringifyLoaderObject(o) {
        return o.path + o.query + o.fragment;
    }
    let unsupported = (name, issue)=>{
        let s = `${name} is not supported by rspack.`;
        throw issue && (s += ` Please refer to issue ${issue} for more information.`), Error(s);
    }, WINDOWS_ABS_PATH_REGEXP = /^[a-zA-Z]:[\\/]/, SEGMENTS_SPLIT_REGEXP = /([|!])/, WINDOWS_PATH_SEPARATOR_REGEXP = /\\/g, relativePathToRequest = (relativePath)=>"" === relativePath ? "./." : ".." === relativePath ? "../." : relativePath.startsWith("../") ? relativePath : `./${relativePath}`, absoluteToRequest = (context, maybeAbsolutePath)=>{
        if ("/" === maybeAbsolutePath[0]) {
            if (maybeAbsolutePath.length > 1 && "/" === maybeAbsolutePath[maybeAbsolutePath.length - 1]) return maybeAbsolutePath;
            let querySplitPos = maybeAbsolutePath.indexOf("?"), resource = -1 === querySplitPos ? maybeAbsolutePath : maybeAbsolutePath.slice(0, querySplitPos);
            return resource = relativePathToRequest(external_node_path_default().posix.relative(context, resource)), -1 === querySplitPos ? resource : resource + maybeAbsolutePath.slice(querySplitPos);
        }
        if (WINDOWS_ABS_PATH_REGEXP.test(maybeAbsolutePath)) {
            let querySplitPos = maybeAbsolutePath.indexOf("?"), resource = -1 === querySplitPos ? maybeAbsolutePath : maybeAbsolutePath.slice(0, querySplitPos);
            return resource = external_node_path_default().win32.relative(context, resource), WINDOWS_ABS_PATH_REGEXP.test(resource) || (resource = relativePathToRequest(resource.replace(WINDOWS_PATH_SEPARATOR_REGEXP, "/"))), -1 === querySplitPos ? resource : resource + maybeAbsolutePath.slice(querySplitPos);
        }
        return maybeAbsolutePath;
    }, makeCacheable = (realFn)=>{
        let cache = new WeakMap(), getCache = (associatedObjectForCache)=>{
            let entry = cache.get(associatedObjectForCache);
            if (void 0 !== entry) return entry;
            let map = new Map();
            return cache.set(associatedObjectForCache, map), map;
        }, fn = (str, associatedObjectForCache)=>{
            if (!associatedObjectForCache) return realFn(str);
            let cache = getCache(associatedObjectForCache), entry = cache.get(str);
            if (void 0 !== entry) return entry;
            let result = realFn(str);
            return cache.set(str, result), result;
        };
        return fn.bindCache = (associatedObjectForCache)=>{
            let cache = getCache(associatedObjectForCache);
            return (str)=>{
                let entry = cache.get(str);
                if (void 0 !== entry) return entry;
                let result = realFn(str);
                return cache.set(str, result), result;
            };
        }, fn;
    }, makeCacheableWithContext = (fn)=>{
        let cache = new WeakMap(), cachedFn = (context, identifier, associatedObjectForCache)=>{
            let cachedResult;
            if (!associatedObjectForCache) return fn(context, identifier);
            let innerCache = cache.get(associatedObjectForCache);
            void 0 === innerCache && (innerCache = new Map(), cache.set(associatedObjectForCache, innerCache));
            let innerSubCache = innerCache.get(context);
            if (void 0 === innerSubCache ? innerCache.set(context, innerSubCache = new Map()) : cachedResult = innerSubCache.get(identifier), void 0 !== cachedResult) return cachedResult;
            let result = fn(context, identifier);
            return innerSubCache.set(identifier, result), result;
        };
        return cachedFn.bindCache = (associatedObjectForCache)=>{
            let innerCache;
            return associatedObjectForCache ? void 0 === (innerCache = cache.get(associatedObjectForCache)) && (innerCache = new Map(), cache.set(associatedObjectForCache, innerCache)) : innerCache = new Map(), (context, identifier)=>{
                let cachedResult, innerSubCache = innerCache?.get(context);
                if (void 0 === innerSubCache ? (innerSubCache = new Map(), innerCache?.set(context, innerSubCache)) : cachedResult = innerSubCache.get(identifier), void 0 !== cachedResult) return cachedResult;
                let result = fn(context, identifier);
                return innerSubCache.set(identifier, result), result;
            };
        }, cachedFn.bindContextCache = (context, associatedObjectForCache)=>{
            let innerSubCache;
            if (associatedObjectForCache) {
                let innerCache = cache.get(associatedObjectForCache);
                void 0 === innerCache && (innerCache = new Map(), cache.set(associatedObjectForCache, innerCache)), void 0 === (innerSubCache = innerCache.get(context)) && innerCache.set(context, innerSubCache = new Map());
            } else innerSubCache = new Map();
            return (identifier)=>{
                let cachedResult = innerSubCache?.get(identifier);
                if (void 0 !== cachedResult) return cachedResult;
                let result = fn(context, identifier);
                return innerSubCache?.set(identifier, result), result;
            };
        }, cachedFn;
    }, makePathsRelative = makeCacheableWithContext((context, identifier)=>identifier.split(SEGMENTS_SPLIT_REGEXP).map((str)=>absoluteToRequest(context, str)).join("")), contextify = makeCacheableWithContext((context, request)=>request.split("!").map((r)=>absoluteToRequest(context, r)).join("!")), absolutify = makeCacheableWithContext((context, request)=>request.split("!").map((r)=>{
            var context1, relativePath;
            return context1 = context, (relativePath = r).startsWith("./") || relativePath.startsWith("../") ? external_node_path_default().join(context1, relativePath) : relativePath;
        }).join("!")), PATH_QUERY_FRAGMENT_REGEXP = /^((?:\u200b.|[^?#\u200b])*)(\?(?:\u200b.|[^#\u200b])*)?(#.*)?$/, PATH_QUERY_REGEXP = /^((?:\u200b.|[^?\u200b])*)(\?.*)?$/, parseResource = makeCacheable((str)=>{
        let match = PATH_QUERY_FRAGMENT_REGEXP.exec(str);
        return {
            resource: str,
            path: match[1].replace(/\u200b(.)/g, "$1"),
            query: match[2] ? match[2].replace(/\u200b(.)/g, "$1") : "",
            fragment: match[3] || ""
        };
    }), parseResourceWithoutFragment = makeCacheable((str)=>{
        let match = PATH_QUERY_REGEXP.exec(str);
        return {
            resource: str,
            path: match[1].replace(/\u200b(.)/g, "$1"),
            query: match[2] ? match[2].replace(/\u200b(.)/g, "$1") : ""
        };
    });
    function toFeatures(featureOptions) {
        let feature = 0;
        for (let key of Reflect.ownKeys(featureOptions))if (!0 === featureOptions[key]) switch(key){
            case "nesting":
                feature |= 1;
                break;
            case "notSelectorList":
                feature |= 2;
                break;
            case "dirSelector":
                feature |= 4;
                break;
            case "langSelectorList":
                feature |= 8;
                break;
            case "isSelector":
                feature |= 16;
                break;
            case "textDecorationThicknessPercent":
                feature |= 32;
                break;
            case "mediaIntervalSyntax":
                feature |= 64;
                break;
            case "mediaRangeSyntax":
                feature |= 128;
                break;
            case "customMediaQueries":
                feature |= 256;
                break;
            case "clampFunction":
                feature |= 512;
                break;
            case "colorFunction":
                feature |= 1024;
                break;
            case "oklabColors":
                feature |= 2048;
                break;
            case "labColors":
                feature |= 4096;
                break;
            case "p3Colors":
                feature |= 8192;
                break;
            case "hexAlphaColors":
                feature |= 16384;
                break;
            case "spaceSeparatedColorNotation":
                feature |= 32768;
                break;
            case "fontFamilySystemUi":
                feature |= 65536;
                break;
            case "doublePositionGradients":
                feature |= 131072;
                break;
            case "vendorPrefixes":
                feature |= 262144;
                break;
            case "logicalProperties":
                feature |= 524288;
                break;
            case "selectors":
                feature |= 31;
                break;
            case "mediaQueries":
                feature |= 448;
                break;
            case "color":
                feature |= 64512;
        }
        return feature;
    }
    let external_node_querystring_namespaceObject = require("node:querystring");
    var external_node_querystring_default = __webpack_require__.n(external_node_querystring_namespaceObject);
    let $assets = Symbol("assets");
    Object.defineProperty(binding_default().KnownBuildInfo.prototype, external_node_util_default().inspect.custom, {
        enumerable: !0,
        configurable: !0,
        value () {
            return {
                ...this,
                assets: this.assets,
                fileDependencies: this.fileDependencies,
                contextDependencies: this.contextDependencies,
                missingDependencies: this.missingDependencies,
                buildDependencies: this.buildDependencies
            };
        }
    }), Object.defineProperty(binding_default().KnownBuildInfo.prototype, "assets", {
        enumerable: !0,
        configurable: !0,
        get () {
            if (this[binding_default().BUILD_INFO_ASSETS_SYMBOL][$assets]) return this[binding_default().BUILD_INFO_ASSETS_SYMBOL][$assets];
            let assets = new Proxy(Object.create(null), {
                ownKeys: ()=>this[binding_default().BUILD_INFO_ASSETS_SYMBOL].keys(),
                getOwnPropertyDescriptor: ()=>({
                        enumerable: !0,
                        configurable: !0
                    })
            });
            return Object.defineProperty(this[binding_default().BUILD_INFO_ASSETS_SYMBOL], $assets, {
                enumerable: !1,
                configurable: !0,
                value: assets
            }), assets;
        }
    }), Object.defineProperty(binding_default().KnownBuildInfo.prototype, "fileDependencies", {
        enumerable: !0,
        configurable: !0,
        get () {
            return new Set(this[binding_default().BUILD_INFO_FILE_DEPENDENCIES_SYMBOL]);
        }
    }), Object.defineProperty(binding_default().KnownBuildInfo.prototype, "contextDependencies", {
        enumerable: !0,
        configurable: !0,
        get () {
            return new Set(this[binding_default().BUILD_INFO_CONTEXT_DEPENDENCIES_SYMBOL]);
        }
    }), Object.defineProperty(binding_default().KnownBuildInfo.prototype, "missingDependencies", {
        enumerable: !0,
        configurable: !0,
        get () {
            return new Set(this[binding_default().BUILD_INFO_MISSING_DEPENDENCIES_SYMBOL]);
        }
    }), Object.defineProperty(binding_default().KnownBuildInfo.prototype, "buildDependencies", {
        enumerable: !0,
        configurable: !0,
        get () {
            return new Set(this[binding_default().BUILD_INFO_BUILD_DEPENDENCIES_SYMBOL]);
        }
    });
    let knownBuildInfoFields = new Set([
        "assets",
        "fileDependencies",
        "contextDependencies",
        "missingDependencies",
        "buildDependencies"
    ]);
    Object.defineProperty(binding_default().NormalModule.prototype, "identifier", {
        enumerable: !0,
        configurable: !0,
        value () {
            return this[binding_default().MODULE_IDENTIFIER_SYMBOL];
        }
    }), Object.defineProperty(binding_default().NormalModule.prototype, "originalSource", {
        enumerable: !0,
        configurable: !0,
        value () {
            let originalSource = this._originalSource();
            return originalSource ? SourceAdapter.fromBinding(originalSource) : null;
        }
    }), Object.defineProperty(binding_default().NormalModule.prototype, "emitFile", {
        enumerable: !0,
        configurable: !0,
        value (filename, source, assetInfo) {
            return this._emitFile(filename, SourceAdapter.toBinding(source), assetInfo);
        }
    });
    let deprecateAllProperties = (obj, message, code)=>{
        let newObj = {}, descriptors = Object.getOwnPropertyDescriptors(obj);
        for (let name of Object.keys(descriptors)){
            let descriptor = descriptors[name];
            if ("function" == typeof descriptor.value) Object.defineProperty(newObj, name, {
                ...descriptor,
                value: external_node_util_default().deprecate(descriptor.value, message, code)
            });
            else if (descriptor.get || descriptor.set) Object.defineProperty(newObj, name, {
                ...descriptor,
                get: descriptor.get && external_node_util_default().deprecate(descriptor.get, message, code),
                set: descriptor.set && external_node_util_default().deprecate(descriptor.set, message, code)
            });
            else {
                let value = descriptor.value;
                Object.defineProperty(newObj, name, {
                    configurable: descriptor.configurable,
                    enumerable: descriptor.enumerable,
                    get: external_node_util_default().deprecate(()=>value, message, code),
                    set: descriptor.writable ? external_node_util_default().deprecate((v)=>value = v, message, code) : void 0
                });
            }
        }
        return newObj;
    };
    Object.defineProperty(binding_default().NormalModule, "getCompilationHooks", {
        enumerable: !0,
        configurable: !0,
        value (compilation) {
            if (!(binding_default().COMPILATION_HOOKS_MAP_SYMBOL in compilation)) throw TypeError("The 'compilation' argument must be an instance of Compilation");
            let compilationHooksMap = compilation[binding_default().COMPILATION_HOOKS_MAP_SYMBOL], hooks = compilationHooksMap.get(compilation);
            return void 0 === hooks && (hooks = {
                loader: new lite_tapable_namespaceObject.SyncHook([
                    "loaderContext",
                    "module"
                ]),
                readResourceForScheme: new lite_tapable_namespaceObject.HookMap((scheme)=>{
                    let fakeHook, message, code, hook = hooks.readResource.for(scheme);
                    return fakeHook = {
                        tap: (options, fn)=>hook.tap(options, (loaderContext)=>fn(loaderContext.resource)),
                        tapAsync: (options, fn)=>hook.tapAsync(options, (loaderContext, callback)=>fn(loaderContext.resource, callback)),
                        tapPromise: (options, fn)=>hook.tapPromise(options, (loaderContext)=>fn(loaderContext.resource))
                    }, Object.freeze(Object.assign(message && code ? deprecateAllProperties(fakeHook, message, code) : fakeHook, {
                        _fakeHook: !0
                    }));
                }),
                readResource: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                        "loaderContext"
                    ]))
            }, compilationHooksMap.set(compilation, hooks)), hooks;
        }
    });
    class NonErrorEmittedError extends Error {
        constructor(error){
            super(), this.name = "NonErrorEmittedError", this.message = `(Emitted value instead of an instance of Error) ${error}`;
        }
    }
    class DeadlockRiskError extends Error {
        constructor(message){
            super(message), this.name = "DeadlockRiskError", this.stack = "";
        }
    }
    class ValidationError extends Error {
        constructor(message){
            super(message), this.name = "ValidationError";
        }
    }
    class JavaScriptTracer {
        static state = "uninitialized";
        static startTime;
        static events;
        static layer;
        static output;
        static session;
        static counter = 10000;
        static async initJavaScriptTrace(layer, output) {
            let { Session } = await import("node:inspector");
            this.session = new Session(), this.layer = layer, this.output = output, this.events = [], this.state = "on", this.startTime = process.hrtime.bigint();
        }
        static uuid() {
            return this.counter++;
        }
        static initCpuProfiler() {
            this.layer && (this.session.connect(), this.session.post("Profiler.enable"), this.session.post("Profiler.start"));
        }
        static async cleanupJavaScriptTrace() {
            if ("uninitialized" === this.state) throw Error("JavaScriptTracer is not initialized, please call initJavaScriptTrace first");
            if (!this.layer || "off" === this.state) return;
            let profileHandler = (err, param)=>{
                let cpu_profile;
                if (err ? console.error("Error stopping profiler:", err) : cpu_profile = param.profile, cpu_profile) {
                    let uuid = this.uuid();
                    this.pushEvent({
                        name: "Profile",
                        ph: "P",
                        trackName: "JavaScript CPU Profiler",
                        processName: "JavaScript CPU",
                        uuid,
                        ...this.getCommonEv(),
                        categories: [
                            "disabled-by-default-v8.cpu_profiler"
                        ],
                        args: {
                            data: {
                                startTime: 0
                            }
                        }
                    }), this.pushEvent({
                        name: "ProfileChunk",
                        ph: "P",
                        trackName: "JavaScript CPU Profiler",
                        processName: "JavaScript CPU",
                        ...this.getCommonEv(),
                        categories: [
                            "disabled-by-default-v8.cpu_profiler"
                        ],
                        uuid,
                        args: {
                            data: {
                                cpuProfile: cpu_profile,
                                timeDeltas: cpu_profile.timeDeltas
                            }
                        }
                    });
                }
            };
            await new Promise((resolve, reject)=>{
                this.session.post("Profiler.stop", (err, params)=>{
                    if (err) reject(err);
                    else try {
                        profileHandler(err, params), resolve();
                    } catch (err) {
                        reject(err);
                    }
                });
            }), this.state = "off";
        }
        static getTs() {
            return process.hrtime.bigint() - this.startTime;
        }
        static getCommonEv() {
            return {
                ts: this.getTs(),
                cat: "rspack"
            };
        }
        static pushEvent(event) {
            let stringifiedArgs = Object.keys(event.args || {}).reduce((acc, key)=>(acc[key] = JSON.stringify(event.args[key]), acc), {});
            this.events.push({
                ...event,
                args: stringifiedArgs
            });
        }
        static startAsync(events) {
            this.layer && this.pushEvent({
                ...this.getCommonEv(),
                ...events,
                ph: "b"
            });
        }
        static endAsync(events) {
            this.layer && this.pushEvent({
                ...this.getCommonEv(),
                ...events,
                ph: "e"
            });
        }
    }
    let CURRENT_METHOD_REGEXP = /at ([a-zA-Z0-9_.]*)/;
    function createMessage(method) {
        return `Abstract method${method ? ` ${method}` : ""}. Must be overridden.`;
    }
    class Message extends Error {
        constructor(){
            super(), this.stack = void 0, Error.captureStackTrace(this);
            const match = this.stack.split("\n")[3].match(CURRENT_METHOD_REGEXP);
            this.message = match?.[1] ? createMessage(match[1]) : createMessage();
        }
    }
    class AbstractMethodError extends lib_WebpackError {
        constructor(){
            super(new Message().message), this.name = "AbstractMethodError";
        }
    }
    class Hash {
        update() {
            throw new AbstractMethodError();
        }
        digest() {
            throw new AbstractMethodError();
        }
    }
    let MAX_SHORT_STRING = -4 & Math.floor(16368);
    class WasmHash {
        exports;
        instancesPool;
        buffered;
        mem;
        chunkSize;
        digestSize;
        constructor(instance, instancesPool, chunkSize, digestSize){
            const exports1 = instance.exports;
            exports1.init(), this.exports = exports1, this.mem = Buffer.from(exports1.memory.buffer, 0, 65536), this.buffered = 0, this.instancesPool = instancesPool, this.chunkSize = chunkSize, this.digestSize = digestSize;
        }
        reset() {
            this.buffered = 0, this.exports.init();
        }
        update(data, encoding) {
            if ("string" == typeof data) {
                let normalizedData = data;
                for(; normalizedData.length > MAX_SHORT_STRING;)this._updateWithShortString(normalizedData.slice(0, MAX_SHORT_STRING), encoding), normalizedData = normalizedData.slice(MAX_SHORT_STRING);
                return this._updateWithShortString(normalizedData, encoding), this;
            }
            return this._updateWithBuffer(data), this;
        }
        _updateWithShortString(data, encoding) {
            let endPos, { exports: exports1, buffered, mem, chunkSize } = this;
            if (data.length < 70) if (encoding && "utf-8" !== encoding && "utf8" !== encoding) if ("latin1" === encoding) {
                endPos = buffered;
                for(let i = 0; i < data.length; i++){
                    let cc = data.charCodeAt(i);
                    mem[endPos++] = cc;
                }
            } else endPos = buffered + mem.write(data, buffered, encoding);
            else {
                endPos = buffered;
                for(let i = 0; i < data.length; i++){
                    let cc = data.charCodeAt(i);
                    if (cc < 0x80) mem[endPos++] = cc;
                    else if (cc < 0x800) mem[endPos] = cc >> 6 | 0xc0, mem[endPos + 1] = 0x3f & cc | 0x80, endPos += 2;
                    else {
                        endPos += mem.write(data.slice(i), endPos, encoding);
                        break;
                    }
                }
            }
            else endPos = buffered + mem.write(data, buffered, encoding);
            if (endPos < chunkSize) this.buffered = endPos;
            else {
                let l = endPos & ~(this.chunkSize - 1);
                exports1.update(l);
                let newBuffered = endPos - l;
                this.buffered = newBuffered, newBuffered > 0 && mem.copyWithin(0, l, endPos);
            }
        }
        _updateWithBuffer(data) {
            let { exports: exports1, buffered, mem } = this, length = data.length;
            if (buffered + length < this.chunkSize) data.copy(mem, buffered, 0, length), this.buffered += length;
            else {
                let l = buffered + length & ~(this.chunkSize - 1);
                if (l > 65536) {
                    let i = 65536 - buffered;
                    data.copy(mem, buffered, 0, i), exports1.update(65536);
                    let stop = l - buffered - 65536;
                    for(; i < stop;)data.copy(mem, 0, i, i + 65536), exports1.update(65536), i += 65536;
                    data.copy(mem, 0, i, l - buffered), exports1.update(l - buffered - i);
                } else data.copy(mem, buffered, 0, l - buffered), exports1.update(l);
                let newBuffered = length + buffered - l;
                this.buffered = newBuffered, newBuffered > 0 && data.copy(mem, 0, length - newBuffered, length);
            }
        }
        digest(type) {
            let { exports: exports1, buffered, mem, digestSize } = this;
            exports1.final(buffered), this.instancesPool.push(this);
            let hex = mem.toString("latin1", 0, digestSize);
            return "hex" === type ? hex : "binary" !== type && type ? Buffer.from(hex, "hex").toString(type) : Buffer.from(hex, "hex");
        }
    }
    let wasm_hash = (wasmModule, instancesPool, chunkSize, digestSize)=>{
        if (instancesPool.length > 0) {
            let old = instancesPool.pop();
            return old.reset(), old;
        }
        return new WasmHash(new WebAssembly.Instance(wasmModule), instancesPool, chunkSize, digestSize);
    }, digestCaches = {};
    class BulkUpdateDecorator extends Hash {
        hash;
        hashFactory;
        hashKey;
        buffer;
        constructor(hashOrFactory, hashKey){
            super(), this.hashKey = hashKey, "function" == typeof hashOrFactory ? (this.hashFactory = hashOrFactory, this.hash = void 0) : (this.hashFactory = void 0, this.hash = hashOrFactory), this.buffer = "";
        }
        update(data, inputEncoding) {
            return void 0 !== inputEncoding || "string" != typeof data || data.length > 2000 ? (void 0 === this.hash && (this.hash = this.hashFactory()), this.buffer.length > 0 && (this.hash.update(Buffer.from(this.buffer)), this.buffer = ""), Buffer.isBuffer(data) ? this.hash.update(data) : this.hash.update(data, inputEncoding)) : (this.buffer += data, this.buffer.length > 2000 && (void 0 === this.hash && (this.hash = this.hashFactory()), this.hash.update(Buffer.from(this.buffer)), this.buffer = "")), this;
        }
        digest(encoding) {
            let digestCache, buffer = this.buffer;
            if (void 0 === this.hash) {
                let cacheKey = `${this.hashKey}-${encoding}`;
                void 0 === (digestCache = digestCaches[cacheKey]) && (digestCache = digestCaches[cacheKey] = new Map());
                let cacheEntry = digestCache.get(buffer);
                if (void 0 !== cacheEntry) return encoding ? cacheEntry : Buffer.from(cacheEntry, "hex");
                this.hash = this.hashFactory();
            }
            buffer.length > 0 && this.hash.update(Buffer.from(buffer));
            let result = encoding ? this.hash.digest(encoding) : this.hash.digest();
            return void 0 !== digestCache && "string" == typeof result && digestCache.set(buffer, result), result;
        }
    }
    class DebugHash extends Hash {
        string;
        constructor(){
            super(), this.string = "";
        }
        update(data) {
            let normalizedData;
            return (normalizedData = Buffer.isBuffer(data) ? data.toString("utf-8") : data).startsWith("debug-digest-") && (normalizedData = Buffer.from(normalizedData.slice(13), "hex").toString()), this.string += `[${normalizedData}](${Error().stack?.split("\n", 3)[2]})\n`, this;
        }
        digest(encoding) {
            let result = `debug-digest-${Buffer.from(this.string).toString("hex")}`;
            return encoding ? result : Buffer.from(result);
        }
    }
    class WasmHashAdapter extends Hash {
        wasmHash;
        constructor(wasmHash){
            super(), this.wasmHash = wasmHash;
        }
        update(data, inputEncoding) {
            return Buffer.isBuffer(data) ? this.wasmHash.update(data) : this.wasmHash.update(data, inputEncoding), this;
        }
        digest(encoding) {
            return encoding ? this.wasmHash.digest(encoding) : this.wasmHash.digest();
        }
    }
    let createHash_createHash = (algorithm)=>{
        if ("function" == typeof algorithm) return new BulkUpdateDecorator(()=>new algorithm());
        switch(algorithm){
            case "debug":
                return new DebugHash();
            case "xxhash64":
                return new WasmHashAdapter((()=>{
                    if (!createXxhash64) {
                        let xxhash64 = new WebAssembly.Module(Buffer.from("AGFzbQEAAAABCAJgAX8AYAAAAwQDAQAABQMBAAEGGgV+AUIAC34BQgALfgFCAAt+AUIAC34BQgALByIEBGluaXQAAAZ1cGRhdGUAAQVmaW5hbAACBm1lbW9yeQIACrIIAzAAQtbrgu7q/Yn14AAkAELP1tO+0ser2UIkAUIAJAJC+erQ0OfJoeThACQDQgAkBAvUAQIBfwR+IABFBEAPCyMEIACtfCQEIwAhAiMBIQMjAiEEIwMhBQNAIAIgASkDAELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiECIAMgASkDCELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEDIAQgASkDEELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEEIAUgASkDGELP1tO+0ser2UJ+fEIfiUKHla+vmLbem55/fiEFIAAgAUEgaiIBSw0ACyACJAAgAyQBIAQkAiAFJAMLqAYCAX8EfiMEQgBSBH4jACICQgGJIwEiA0IHiXwjAiIEQgyJfCMDIgVCEol8IAJCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCh5Wvr5i23puef35CnaO16oOxjYr6AH0gA0LP1tO+0ser2UJ+Qh+JQoeVr6+Ytt6bnn9+hUKHla+vmLbem55/fkKdo7Xqg7GNivoAfSAEQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef36FQoeVr6+Ytt6bnn9+Qp2jteqDsY2K+gB9IAVCz9bTvtLHq9lCfkIfiUKHla+vmLbem55/foVCh5Wvr5i23puef35CnaO16oOxjYr6AH0FQsXP2bLx5brqJwsjBCAArXx8IQIDQCABQQhqIABNBEAgAiABKQMAQs/W077Sx6vZQn5CH4lCh5Wvr5i23puef36FQhuJQoeVr6+Ytt6bnn9+Qp2jteqDsY2K+gB9IQIgAUEIaiEBDAELCyABQQRqIABNBEAgAiABNQIAQoeVr6+Ytt6bnn9+hUIXiULP1tO+0ser2UJ+Qvnz3fGZ9pmrFnwhAiABQQRqIQELA0AgACABRwRAIAIgATEAAELFz9my8eW66id+hUILiUKHla+vmLbem55/fiECIAFBAWohAQwBCwtBACACIAJCIYiFQs/W077Sx6vZQn4iAkIdiCAChUL5893xmfaZqxZ+IgJCIIggAoUiAkIgiCIDQv//A4NCIIYgA0KAgPz/D4NCEIiEIgNC/4GAgPAfg0IQhiADQoD+g4CA4D+DQgiIhCIDQo+AvIDwgcAHg0IIhiADQvCBwIeAnoD4AINCBIiEIgNChoyYsODAgYMGfEIEiEKBgoSIkKDAgAGDQid+IANCsODAgYOGjJgwhHw3AwBBCCACQv////8PgyICQv//A4NCIIYgAkKAgPz/D4NCEIiEIgJC/4GAgPAfg0IQhiACQoD+g4CA4D+DQgiIhCICQo+AvIDwgcAHg0IIhiACQvCBwIeAnoD4AINCBIiEIgJChoyYsODAgYMGfEIEiEKBgoSIkKDAgAGDQid+IAJCsODAgYOGjJgwhHw3AwAL", "base64"));
                        createXxhash64 = wasm_hash.bind(null, xxhash64, [], 32, 16);
                    }
                    return createXxhash64();
                })());
            case "md4":
                return new WasmHashAdapter((()=>{
                    if (!createMd4) {
                        let md4 = new WebAssembly.Module(Buffer.from("AGFzbQEAAAABCAJgAX8AYAAAAwUEAQAAAAUDAQABBhoFfwFBAAt/AUEAC38BQQALfwFBAAt/AUEACwciBARpbml0AAAGdXBkYXRlAAIFZmluYWwAAwZtZW1vcnkCAAqLEAQmAEGBxpS6BiQBQYnXtv5+JAJB/rnrxXkkA0H2qMmBASQEQQAkAAvSCgEZfyMBIQUjAiECIwMhAyMEIQQDQCAAIAFLBEAgASgCJCISIAEoAiAiEyABKAIcIgkgASgCGCIIIAEoAhQiByABKAIQIg4gASgCDCIGIAEoAggiDyABKAIEIhAgASgCACIRIAMgBHMgAnEgBHMgBWpqQQN3IgogAiADc3EgA3MgBGpqQQd3IgsgAiAKc3EgAnMgA2pqQQt3IgwgCiALc3EgCnMgAmpqQRN3Ig0gCyAMc3EgC3MgCmpqQQN3IgogDCANc3EgDHMgC2pqQQd3IgsgCiANc3EgDXMgDGpqQQt3IgwgCiALc3EgCnMgDWpqQRN3Ig0gCyAMc3EgC3MgCmpqQQN3IhQgDCANc3EgDHMgC2pqQQd3IRUgASgCLCILIAEoAigiCiAMIA0gDSAUcyAVcXNqakELdyIWIBQgFXNxIBRzIA1qakETdyEXIAEoAjQiGCABKAIwIhkgFSAWcyAXcSAVcyAUampBA3ciFCAWIBdzcSAWcyAVampBB3chFSABKAI8Ig0gASgCOCIMIBQgF3MgFXEgF3MgFmpqQQt3IhYgFCAVc3EgFHMgF2pqQRN3IRcgEyAOIBEgFCAVIBZyIBdxIBUgFnFyampBmfOJ1AVqQQN3IhQgFiAXcnEgFiAXcXIgFWpqQZnzidQFakEFdyIVIBQgF3JxIBQgF3FyIBZqakGZ84nUBWpBCXchFiAPIBggEiAWIAcgFSAQIBQgGSAUIBVyIBZxIBQgFXFyIBdqakGZ84nUBWpBDXciFCAVIBZycSAVIBZxcmpqQZnzidQFakEDdyIVIBQgFnJxIBQgFnFyampBmfOJ1AVqQQV3IhcgFCAVcnEgFCAVcXJqakGZ84nUBWpBCXciFiAVIBdycSAVIBdxciAUampBmfOJ1AVqQQ13IhQgFiAXcnEgFiAXcXIgFWpqQZnzidQFakEDdyEVIBEgBiAVIAwgFCAKIBYgCCAUIBZyIBVxIBQgFnFyIBdqakGZ84nUBWpBBXciFyAUIBVycSAUIBVxcmpqQZnzidQFakEJdyIWIBUgF3JxIBUgF3FyampBmfOJ1AVqQQ13IhQgFiAXcnEgFiAXcXJqakGZ84nUBWpBA3ciFSALIBYgCSAUIBZyIBVxIBQgFnFyIBdqakGZ84nUBWpBBXciFiAUIBVycSAUIBVxcmpqQZnzidQFakEJdyIXIA0gFSAWciAXcSAVIBZxciAUampBmfOJ1AVqQQ13IhRzIBZzampBodfn9gZqQQN3IREgByAIIA4gFCARIBcgESAUc3MgFmogE2pBodfn9gZqQQl3IhNzcyAXampBodfn9gZqQQt3Ig4gDyARIBMgDiARIA4gE3NzIBRqIBlqQaHX5/YGakEPdyIRc3NqakGh1+f2BmpBA3ciDyAOIA8gEXNzIBNqIApqQaHX5/YGakEJdyIKcyARc2pqQaHX5/YGakELdyIIIBAgDyAKIAggDCAPIAggCnNzIBFqakGh1+f2BmpBD3ciDHNzampBodfn9gZqQQN3Ig4gEiAIIAwgDnNzIApqakGh1+f2BmpBCXciCHMgDHNqakGh1+f2BmpBC3chByAFIAYgCCAHIBggDiAHIAhzcyAMampBodfn9gZqQQ93IgpzcyAOampBodfn9gZqQQN3IgZqIQUgDSAGIAkgByAGIAsgByAGIApzcyAIampBodfn9gZqQQl3IgdzIApzampBodfn9gZqQQt3IgYgB3NzIApqakGh1+f2BmpBD3cgAmohAiADIAZqIQMgBCAHaiEEIAFBQGshAQwBCwsgBSQBIAIkAiADJAMgBCQECw0AIAAQASAAIwBqJAAL/wQCA38BfiAAIwBqrUIDhiEEIABByABqQUBxIgJBCGshAyAAIgFBAWohACABQYABOgAAA0AgACACSUEAIABBB3EbBEAgAEEAOgAAIABBAWohAAwBCwsDQCAAIAJJBEAgAEIANwMAIABBCGohAAwBCwsgAyAENwMAIAIQAUEAIwGtIgRC//8DgyAEQoCA/P8Pg0IQhoQiBEL/gYCA8B+DIARCgP6DgIDgP4NCCIaEIgRCj4C8gPCBwAeDQgiGIARC8IHAh4CegPgAg0IEiIQiBEKGjJiw4MCBgwZ8QgSIQoGChIiQoMCAAYNCJ34gBEKw4MCBg4aMmDCEfDcDAEEIIwKtIgRC//8DgyAEQoCA/P8Pg0IQhoQiBEL/gYCA8B+DIARCgP6DgIDgP4NCCIaEIgRCj4C8gPCBwAeDQgiGIARC8IHAh4CegPgAg0IEiIQiBEKGjJiw4MCBgwZ8QgSIQoGChIiQoMCAAYNCJ34gBEKw4MCBg4aMmDCEfDcDAEEQIwOtIgRC//8DgyAEQoCA/P8Pg0IQhoQiBEL/gYCA8B+DIARCgP6DgIDgP4NCCIaEIgRCj4C8gPCBwAeDQgiGIARC8IHAh4CegPgAg0IEiIQiBEKGjJiw4MCBgwZ8QgSIQoGChIiQoMCAAYNCJ34gBEKw4MCBg4aMmDCEfDcDAEEYIwStIgRC//8DgyAEQoCA/P8Pg0IQhoQiBEL/gYCA8B+DIARCgP6DgIDgP4NCCIaEIgRCj4C8gPCBwAeDQgiGIARC8IHAh4CegPgAg0IEiIQiBEKGjJiw4MCBgwZ8QgSIQoGChIiQoMCAAYNCJ34gBEKw4MCBg4aMmDCEfDcDAAs=", "base64"));
                        createMd4 = wasm_hash.bind(null, md4, [], 64, 32);
                    }
                    return createMd4();
                })());
            case "native-md4":
                return new BulkUpdateDecorator(()=>{
                    let { createHash } = __webpack_require__("node:crypto");
                    return createHash("md4");
                }, "md4");
            default:
                return new BulkUpdateDecorator(()=>{
                    let { createHash } = __webpack_require__("node:crypto");
                    return createHash(algorithm);
                }, algorithm);
        }
    }, memoize = (fn)=>{
        let result, cache = !1, callback = fn;
        return ()=>(cache || (result = callback(), cache = !0, callback = void 0), result);
    }, memoizeFn = (fn)=>{
        let cache = null;
        return (...args)=>(cache || (cache = fn()), cache(...args));
    }, ModuleError_createMessage = (err, type, from)=>{
        let message = `Module ${type}${from ? ` (from ${from}):\n` : ": "}`;
        return err && "object" == typeof err && err.message ? message += err.message : err && (message += err), message;
    }, getErrorDetails = (err)=>{
        var stack, name, message;
        return err && "object" == typeof err && err.stack ? (stack = err.stack, name = err.name, message = err.message, cutOffLoaderExecution(stack), cutOffMessage(stack, name, message)) : void 0;
    };
    class ModuleError extends lib_WebpackError {
        error;
        constructor(err, { from } = {}){
            super(ModuleError_createMessage(err, "Error", from)), this.name = "ModuleError", this.error = err, this.details = getErrorDetails(err);
        }
    }
    class ModuleWarning extends lib_WebpackError {
        error;
        constructor(err, { from } = {}){
            super(ModuleError_createMessage(err, "Warning", from)), this.name = "ModuleWarning", this.error = err, this.details = getErrorDetails(err);
        }
    }
    let ensureLoaderWorkerPool = async (workerOptions)=>service_pool || (service_pool = import("../compiled/tinypool/dist/index.js").then(({ Tinypool })=>{
            let availableThreads = Math.max(__webpack_require__("node:os").cpus().length - 1, 1), maxWorkers = workerOptions?.maxWorkers ? Math.max(workerOptions.maxWorkers, 1) : void 0;
            return new Tinypool({
                filename: external_node_path_default().resolve(__dirname, "worker.js"),
                useAtomics: !1,
                maxThreads: maxWorkers || availableThreads,
                minThreads: maxWorkers || availableThreads,
                concurrentTasksPerWorker: 1
            });
        }));
    function serializeError(error) {
        if (error instanceof Error || error && "object" == typeof error && "message" in error) return {
            ...error,
            name: error.name,
            stack: error.stack,
            message: error.message
        };
        if ("string" == typeof error) return {
            name: "Error",
            message: error
        };
        throw Error("Failed to serialize error, only string, Error instances and objects with a message property are supported");
    }
    let service_run = async (loaderName, task, options, workerOptions)=>ensureLoaderWorkerPool(workerOptions).then(async (pool)=>{
            let { MessageChannel } = await import("node:worker_threads"), { port1: mainPort, port2: workerPort } = new MessageChannel(), { port1: mainSyncPort, port2: workerSyncPort } = new MessageChannel();
            return new Promise((resolve, reject)=>{
                let handleError = (error)=>{
                    mainPort.close(), mainSyncPort.close(), reject(error);
                }, pendingRequests = new Map();
                mainPort.on("message", (message)=>{
                    "done" === message.type ? Promise.allSettled(pendingRequests.values()).then(()=>{
                        mainPort.close(), mainSyncPort.close(), resolve(message.data);
                    }) : "done-error" === message.type ? Promise.allSettled(pendingRequests.values()).then(()=>{
                        mainPort.close(), mainSyncPort.close(), reject(message.error);
                    }) : "request" === message.type && pendingRequests.set(message.id, Promise.resolve().then(()=>options.handleIncomingRequest(message.requestType, ...message.data)).then((result)=>(mainPort.postMessage({
                            type: "response",
                            id: message.id,
                            data: result
                        }), result)).catch((error)=>{
                        mainPort.postMessage({
                            type: "response-error",
                            id: message.id,
                            error: serializeError(error)
                        });
                    }));
                }), mainPort.on("messageerror", handleError), mainSyncPort.on("message", async (message)=>{
                    let result, { sharedBuffer } = message, sharedBufferView = new Int32Array(sharedBuffer);
                    try {
                        if ("WaitForPendingRequest" === message.requestType) {
                            let pendingRequestId = message.data[0], isArray = Array.isArray(pendingRequestId), ids = isArray ? pendingRequestId : [
                                pendingRequestId
                            ];
                            result = await Promise.all(ids.map((id)=>pendingRequests.get(id))), isArray || (result = result[0]);
                        } else throw Error(`Unknown request type: ${message.requestType}`);
                        mainSyncPort.postMessage({
                            type: "response",
                            id: message.id,
                            data: result
                        });
                    } catch (e) {
                        mainSyncPort.postMessage({
                            type: "response-error",
                            id: message.id,
                            error: serializeError(e)
                        });
                    }
                    Atomics.add(sharedBufferView, 0, 1), Atomics.notify(sharedBufferView, 0, 1 / 0);
                }), mainSyncPort.on("messageerror", handleError);
                var obj = task, loaderName1 = loaderName;
                let errors = [];
                for (let key of Object.keys(obj))try {
                    structuredClone(obj[key]);
                } catch (e) {
                    errors.push({
                        key,
                        type: typeof obj[key],
                        reason: e.message
                    });
                }
                if (errors.length > 0) {
                    let errorMsg = errors.map((err)=>`option "${err.key}" (type: ${err.type}) is not cloneable: ${err.reason}`).join("\n");
                    throw Error(`The options for ${loaderName1} are not cloneable, which is not supported by parallelLoader. Consider disabling parallel for this loader or removing the non-cloneable properties from the options:\n${errorMsg}`);
                }
                pool.run({
                    ...task,
                    workerData: {
                        workerPort,
                        workerSyncPort
                    }
                }, {
                    ...options,
                    transferList: [
                        ...options?.transferList || [],
                        workerPort,
                        workerSyncPort
                    ]
                }).catch(handleError);
            });
        }), LoaderLoadingError = class extends Error {
        constructor(message){
            super(message), this.name = "LoaderRunnerError", Error.captureStackTrace(this, this.constructor);
        }
    };
    function loadLoader(loader, compiler, callback) {
        if ("module" === loader.type) try {
            void 0 === loadLoader_url && (loadLoader_url = __webpack_require__("node:url")), import(loadLoader_url.pathToFileURL(loader.path).toString()).then((module1)=>{
                handleResult(loader, module1, callback);
            }, callback);
            return;
        } catch (e) {
            callback(e);
        }
        else {
            let module1;
            try {
                module1 = require(loader.path);
            } catch (e) {
                if (e instanceof Error && "EMFILE" === e.code) return void setImmediate(loadLoader.bind(null, loader, compiler, callback));
                return callback(e);
            }
            return handleResult(loader, module1, callback);
        }
    }
    function handleResult(loader, module1, callback) {
        return "function" != typeof module1 && "object" != typeof module1 ? callback(new LoaderLoadingError(`Module '${loader.path}' is not a loader (export function or es6 module)`)) : (loader.normal = "function" == typeof module1 ? module1 : module1.default, loader.pitch = module1.pitch, loader.raw = module1.raw, loader.pitch || (loader.noPitch = !0), "function" != typeof loader.normal && "function" != typeof loader.pitch) ? callback(new LoaderLoadingError(`Module '${loader.path}' is not a loader (must have normal or pitch function)`)) : void callback();
    }
    let decoder = new TextDecoder(), utils_loadLoader = (0, external_node_util_namespaceObject.promisify)(loadLoader), utils_runSyncOrAsync = (0, external_node_util_namespaceObject.promisify)(function(fn, context, args, callback) {
        let isSync = !0, isDone = !1, isError = !1, reportedError = !1;
        context.async = function() {
            if (isDone) {
                if (reportedError) return;
                throw Error("async(): The callback was already called.");
            }
            return isSync = !1, innerCallback;
        };
        let innerCallback = (err, ...args)=>{
            if (isDone) {
                if (reportedError) return;
                throw Error("callback(): The callback was already called.");
            }
            isDone = !0, isSync = !1;
            try {
                callback(err, args);
            } catch (e) {
                throw isError = !0, e;
            }
        };
        context.callback = innerCallback;
        try {
            let result = fn.apply(context, args);
            if (isSync) {
                if (isDone = !0, void 0 === result) return void callback(null, []);
                if (result && "object" == typeof result && "function" == typeof result.then) return void result.then((r)=>{
                    callback(null, [
                        r
                    ]);
                }, callback);
                callback(null, [
                    result
                ]);
                return;
            }
        } catch (e) {
            if ("hideStack" in e && e.hideStack && (e.hideStack = "true"), isError) throw e;
            if (isDone) return void (e instanceof Error ? console.error(e.stack) : console.error(e));
            isDone = !0, reportedError = !0, callback(e, []);
        }
    }), LOADER_PROCESS_NAME = "Loader Analysis";
    class LoaderObject {
        request;
        path;
        query;
        fragment;
        options;
        ident;
        normal;
        pitch;
        raw;
        type;
        parallel;
        loaderItem;
        constructor(loaderItem, compiler){
            var loader, compiler1;
            let obj;
            const { request, path, query, fragment, options, ident, normal, pitch, raw, type } = (loader = loaderItem, compiler1 = compiler, Object.defineProperty(obj = {
                path: null,
                query: null,
                fragment: null,
                options: null,
                ident: null,
                normal: null,
                pitch: null,
                raw: null,
                data: null,
                pitchExecuted: !1,
                normalExecuted: !1
            }, "request", {
                enumerable: !0,
                get: ()=>obj.path.replace(/#/g, "\u200b#") + obj.query.replace(/#/g, "\u200b#") + obj.fragment,
                set: (value)=>{
                    let splittedRequest = parseResourceWithoutFragment(value.loader);
                    if (obj.path = splittedRequest.path, obj.query = splittedRequest.query, obj.fragment = "", obj.options = null === obj.options ? splittedRequest.query ? splittedRequest.query.slice(1) : void 0 : obj.options, "string" == typeof obj.options && "?" === obj.options[0]) {
                        let ident = obj.options.slice(1);
                        if ("[[missing ident]]" === ident) throw Error("No ident is provided by referenced loader. When using a function for Rule.use in config you need to provide an 'ident' property for referenced loader options.");
                        if (obj.options = compiler1.__internal__ruleSet.references.get(ident), void 0 === obj.options) throw Error("Invalid ident is provided by referenced loader");
                        obj.ident = ident;
                    }
                    obj.type = "" === value.type ? void 0 : value.type, null === obj.options || void 0 === obj.options ? obj.query = "" : "string" == typeof obj.options ? obj.query = `?${obj.options}` : obj.ident ? obj.query = `??${obj.ident}` : "object" == typeof obj.options && obj.options.ident ? obj.query = `??${obj.options.ident}` : obj.query = `?${JSON.stringify(obj.options)}`;
                }
            }), obj.request = loader, Object.preventExtensions && Object.preventExtensions(obj), obj);
            this.request = request, this.path = path, this.query = query, this.fragment = fragment, this.options = options, this.ident = ident, this.normal = normal, this.pitch = pitch, this.raw = raw, this.type = type, this.parallel = !!ident && compiler.__internal__ruleSet.references.get(`${ident}$$parallelism`), this.loaderItem = loaderItem, this.loaderItem.data = this.loaderItem.data ?? {};
        }
        get pitchExecuted() {
            return this.loaderItem.pitchExecuted;
        }
        set pitchExecuted(value) {
            if (!value) throw Error("pitchExecuted should be true");
            this.loaderItem.pitchExecuted = !0;
        }
        get normalExecuted() {
            return this.loaderItem.normalExecuted;
        }
        set normalExecuted(value) {
            if (!value) throw Error("normalExecuted should be true");
            this.loaderItem.normalExecuted = !0;
        }
        set noPitch(value) {
            if (!value) throw Error("noPitch should be true");
            this.loaderItem.noPitch = !0;
        }
        shouldYield() {
            return this.request.startsWith(BUILTIN_LOADER_PREFIX);
        }
        static __from_binding(loaderItem, compiler) {
            return new this(loaderItem, compiler);
        }
        static __to_binding(loader) {
            return loader.loaderItem;
        }
    }
    class JsSourceMap {
        static __from_binding(map) {
            return isNil(map) ? void 0 : ((input)=>{
                let s;
                if (Buffer.isBuffer(input)) s = input.toString("utf8");
                else if (input && "object" == typeof input) return input;
                else if ("string" == typeof input) s = input;
                else throw Error("Buffer or string or object expected");
                return JSON.parse(s);
            })(map);
        }
        static __to_binding(map) {
            return serializeObject(map);
        }
    }
    function getCurrentLoader(loaderContext, index = loaderContext.loaderIndex) {
        return loaderContext.loaders?.length && index < loaderContext.loaders.length && index >= 0 && loaderContext.loaders[index] ? loaderContext.loaders[index] : null;
    }
    async function runLoaders(compiler, context) {
        var buildInfo;
        let loaderState = context.loaderState, pitch = loaderState === binding_.JsLoaderState.Pitching, { resource } = context, uuid = JavaScriptTracer.uuid();
        JavaScriptTracer.startAsync({
            name: "run_js_loaders",
            processName: LOADER_PROCESS_NAME,
            uuid,
            ph: "b",
            args: {
                is_pitch: pitch,
                resource: resource
            }
        });
        let splittedResource = resource && parsePathQueryFragment(resource), resourcePath = splittedResource ? splittedResource.path : void 0, resourceQuery = splittedResource ? splittedResource.query : void 0, resourceFragment = splittedResource ? splittedResource.fragment : void 0, contextDirectory = resourcePath ? function(path) {
            if ("/" === path) return "/";
            let i = path.lastIndexOf("/"), j = path.lastIndexOf("\\"), i2 = path.indexOf("/"), j2 = path.indexOf("\\"), idx = i > j ? i : j, idx2 = i > j ? i2 : j2;
            return idx < 0 ? path : idx === idx2 ? path.slice(0, idx + 1) : path.slice(0, idx);
        }(resourcePath) : null, fileDependencies = context.fileDependencies, contextDependencies = context.contextDependencies, missingDependencies = context.missingDependencies, buildDependencies = context.buildDependencies, loaderContext = {};
        loaderContext.loaders = context.loaderItems.map((item)=>LoaderObject.__from_binding(item, compiler)), loaderContext.hot = context.hot, loaderContext.context = contextDirectory, loaderContext.resourcePath = resourcePath, loaderContext.resourceQuery = resourceQuery, loaderContext.resourceFragment = resourceFragment, loaderContext.dependency = loaderContext.addDependency = function(file) {
            fileDependencies.push(file);
        }, loaderContext.addContextDependency = function(context) {
            contextDependencies.push(context);
        }, loaderContext.addMissingDependency = function(context) {
            missingDependencies.push(context);
        }, loaderContext.addBuildDependency = function(file) {
            buildDependencies.push(file);
        }, loaderContext.getDependencies = function() {
            return fileDependencies.slice();
        }, loaderContext.getContextDependencies = function() {
            return contextDependencies.slice();
        }, loaderContext.getMissingDependencies = function() {
            return missingDependencies.slice();
        }, loaderContext.clearDependencies = function() {
            fileDependencies.length = 0, contextDependencies.length = 0, missingDependencies.length = 0, context.cacheable = !0;
        }, loaderContext.importModule = function(request, userOptions, callback) {
            JavaScriptTracer.startAsync({
                name: "importModule",
                processName: LOADER_PROCESS_NAME,
                uuid,
                args: {
                    is_pitch: pitch,
                    resource: resource
                }
            });
            let options = userOptions || {};
            function finalCallback(onError, onDone) {
                return function(err, res) {
                    if (err) JavaScriptTracer.endAsync({
                        name: "importModule",
                        processName: LOADER_PROCESS_NAME,
                        uuid,
                        args: {
                            is_pitch: pitch,
                            resource: resource
                        }
                    }), onError(err);
                    else {
                        for (let dep of res.buildDependencies)loaderContext.addBuildDependency(dep);
                        for (let dep of res.contextDependencies)loaderContext.addContextDependency(dep);
                        for (let dep of res.missingDependencies)loaderContext.addMissingDependency(dep);
                        for (let dep of res.fileDependencies)loaderContext.addDependency(dep);
                        !1 === res.cacheable && loaderContext.cacheable(!1), JavaScriptTracer.endAsync({
                            name: "importModule",
                            processName: LOADER_PROCESS_NAME,
                            uuid,
                            args: {
                                is_pitch: pitch,
                                resource: resource
                            }
                        }), res.error ? onError(compiler.__internal__takeModuleExecutionResult(res.id) ?? Error(res.error)) : onDone(compiler.__internal__takeModuleExecutionResult(res.id));
                    }
                };
            }
            return callback ? compiler._lastCompilation.__internal_getInner().importModule(request, options.layer, options.publicPath, options.baseUri, loaderContext._module.identifier(), loaderContext.context, finalCallback((err)=>callback(err), (res)=>callback(void 0, res))) : new Promise((resolve, reject)=>{
                compiler._lastCompilation.__internal_getInner().importModule(request, options.layer, options.publicPath, options.baseUri, loaderContext._module.identifier(), loaderContext.context, finalCallback(reject, resolve));
            });
        }, Object.defineProperty(loaderContext, "resource", {
            enumerable: !0,
            get: ()=>{
                if (void 0 !== loaderContext.resourcePath) return loaderContext.resourcePath.replace(/#/g, "\u200b#") + loaderContext.resourceQuery.replace(/#/g, "\u200b#") + loaderContext.resourceFragment;
            },
            set: (value)=>{
                let splittedResource = value && parsePathQueryFragment(value);
                loaderContext.resourcePath = splittedResource ? splittedResource.path : void 0, loaderContext.resourceQuery = splittedResource ? splittedResource.query : void 0, loaderContext.resourceFragment = splittedResource ? splittedResource.fragment : void 0;
            }
        }), Object.defineProperty(loaderContext, "request", {
            enumerable: !0,
            get: ()=>loaderContext.loaders.map((o)=>o.request).concat(loaderContext.resource || "").join("!")
        }), Object.defineProperty(loaderContext, "remainingRequest", {
            enumerable: !0,
            get: ()=>loaderContext.loaderIndex >= loaderContext.loaders.length - 1 && !loaderContext.resource ? "" : loaderContext.loaders.slice(loaderContext.loaderIndex + 1).map((o)=>o.request).concat(loaderContext.resource || "").join("!")
        }), Object.defineProperty(loaderContext, "currentRequest", {
            enumerable: !0,
            get: ()=>loaderContext.loaders.slice(loaderContext.loaderIndex).map((o)=>o.request).concat(loaderContext.resource || "").join("!")
        }), Object.defineProperty(loaderContext, "previousRequest", {
            enumerable: !0,
            get: ()=>loaderContext.loaders.slice(0, loaderContext.loaderIndex).map((o)=>o.request).join("!")
        }), Object.defineProperty(loaderContext, "query", {
            enumerable: !0,
            get: ()=>{
                let entry = loaderContext.loaders[loaderContext.loaderIndex];
                return entry.options && "object" == typeof entry.options ? entry.options : entry.query;
            }
        }), loaderContext.version = 2, loaderContext.sourceMap = compiler.options.devtool ? isUseSourceMap(compiler.options.devtool) : context._module.useSourceMap ?? !1, loaderContext.mode = compiler.options.mode, Object.assign(loaderContext, compiler.options.loader);
        let getResolveContext = ()=>({
                fileDependencies: {
                    add: (d)=>{
                        loaderContext.addDependency(d);
                    }
                },
                contextDependencies: {
                    add: (d)=>{
                        loaderContext.addContextDependency(d);
                    }
                },
                missingDependencies: {
                    add: (d)=>{
                        loaderContext.addMissingDependency(d);
                    }
                }
            }), getResolver = memoize(()=>compiler._lastCompilation.resolverFactory.get("normal"));
        loaderContext.resolve = function(context, request, callback) {
            getResolver().resolve({}, context, request, getResolveContext(), callback);
        }, loaderContext.getResolve = function(options) {
            let resolver = getResolver(), child = options ? resolver.withOptions(options) : resolver;
            return (context, request, callback)=>callback ? void child.resolve({}, context, request, getResolveContext(), callback) : new Promise((resolve, reject)=>{
                    child.resolve({}, context, request, getResolveContext(), (err, result)=>{
                        err ? reject(err) : resolve(result);
                    });
                });
        }, loaderContext.getLogger = function(name) {
            return compiler._lastCompilation.getLogger([
                name,
                resource
            ].filter(Boolean).join("|"));
        }, loaderContext.rootContext = compiler.context, loaderContext.emitError = function(e) {
            e instanceof Error || (e = new NonErrorEmittedError(e));
            let error = new ModuleError(e, {
                from: stringifyLoaderObject(loaderContext.loaders[loaderContext.loaderIndex])
            });
            error.module = loaderContext._module, compiler._lastCompilation.__internal__pushRspackDiagnostic({
                error,
                severity: binding_.JsRspackSeverity.Error
            });
        }, loaderContext.emitWarning = function(e) {
            e instanceof Error || (e = new NonErrorEmittedError(e));
            let warning = new ModuleWarning(e, {
                from: stringifyLoaderObject(loaderContext.loaders[loaderContext.loaderIndex])
            });
            warning.module = loaderContext._module, compiler._lastCompilation.__internal__pushRspackDiagnostic({
                error: warning,
                severity: binding_.JsRspackSeverity.Warn
            });
        }, loaderContext.emitFile = function(name, content, sourceMap, assetInfo) {
            var devtool;
            let source;
            sourceMap ? ("string" == typeof sourceMap && (loaderContext.sourceMap || compiler.options.devtool && (devtool = compiler.options.devtool) && devtool.includes("source-map") && !isUseSourceMap(devtool)) && (source = new index_js_.OriginalSource(content, makePathsRelative(contextDirectory, sourceMap, compiler))), loaderContext.sourceMap && (source = new index_js_.SourceMapSource(content, name, makePathsRelative(contextDirectory, sourceMap, compiler)))) : source = new index_js_.RawSource(content), loaderContext._module.emitFile(name, source, assetInfo);
        }, loaderContext.fs = compiler.inputFileSystem, loaderContext.experiments = {
            emitDiagnostic: (diagnostic)=>{
                let d = Object.assign({}, diagnostic, {
                    message: "warning" === diagnostic.severity ? `ModuleWarning: ${diagnostic.message}` : `ModuleError: ${diagnostic.message}`,
                    moduleIdentifier: context._module.identifier()
                });
                compiler._lastCompilation.__internal__pushDiagnostic((0, binding_.formatDiagnostic)(d));
            }
        };
        let getAbsolutify = memoize(()=>absolutify.bindCache(compiler.root)), getAbsolutifyInContext = memoize(()=>absolutify.bindContextCache(contextDirectory, compiler.root)), getContextify = memoize(()=>contextify.bindCache(compiler.root)), getContextifyInContext = memoize(()=>contextify.bindContextCache(contextDirectory, compiler.root));
        loaderContext.utils = {
            absolutify: (context, request)=>context === contextDirectory ? getAbsolutifyInContext()(request) : getAbsolutify()(context, request),
            contextify: (context, request)=>context === contextDirectory ? getContextifyInContext()(request) : getContextify()(context, request),
            createHash: (type)=>createHash_createHash(type || compiler._lastCompilation.outputOptions.hashFunction)
        }, loaderContext._compiler = compiler, loaderContext._compilation = compiler._lastCompilation, loaderContext._module = context._module, loaderContext.getOptions = ()=>{
            let loader = getCurrentLoader(loaderContext), options = loader?.options;
            if ("string" == typeof options) if (options.startsWith("{") && options.endsWith("}")) try {
                options = JSON.parse(options);
            } catch (e) {
                throw Error(`JSON parsing failed for loader's string options: ${e.message}`);
            }
            else options = external_node_querystring_default().parse(options);
            return null == options && (options = {}), options;
        };
        let compilation = compiler._lastCompilation, step = 0;
        for(; compilation;)if (binding_.NormalModule.getCompilationHooks(compilation).loader.call(loaderContext, loaderContext._module), compilation = compilation.compiler.parentCompilation, ++step > 1000) throw Error("Too many nested child compiler, exceeded max limitation 1000");
        Object.defineProperty(loaderContext, "loaderIndex", {
            enumerable: !0,
            get: ()=>context.loaderIndex,
            set: (loaderIndex)=>context.loaderIndex = loaderIndex
        }), Object.defineProperty(loaderContext, "cacheable", {
            enumerable: !0,
            get: ()=>(cacheable)=>{
                    !1 === cacheable && (context.cacheable = cacheable);
                }
        }), Object.defineProperty(loaderContext, "data", {
            enumerable: !0,
            get: ()=>loaderContext.loaders[loaderContext.loaderIndex].loaderItem.data,
            set: (data)=>loaderContext.loaders[loaderContext.loaderIndex].loaderItem.data = data
        }), loaderContext.__internal__setParseMeta = (key, value)=>{
            context.__internal__parseMeta[key] = value;
        };
        let enableParallelism = (currentLoaderObject)=>compiler.options.experiments.parallelLoader && currentLoaderObject?.parallel, isomorphoicRun = async (fn, args)=>{
            let result, currentLoaderObject = getCurrentLoader(loaderContext), parallelism = enableParallelism(currentLoaderObject), pitch = loaderState === binding_.JsLoaderState.Pitching, loaderName = function(loaderPath, cwd = "") {
                let res = loaderPath.replace(cwd, "");
                if (!external_node_path_default().isAbsolute(res)) return res;
                let nms = "/node_modules/", idx = res.lastIndexOf(nms);
                if (-1 !== idx) {
                    res = res.slice(idx + nms.length);
                    let ln = "loader", lnIdx = res.lastIndexOf(ln);
                    lnIdx > -1 && (res = res.slice(0, lnIdx + ln.length));
                }
                return res;
            }(currentLoaderObject.request);
            if (JavaScriptTracer.startAsync({
                name: loaderName,
                trackName: loaderName,
                processName: LOADER_PROCESS_NAME,
                uuid,
                args: {
                    is_pitch: pitch,
                    resource: resource
                }
            }), parallelism) {
                let normalModule, workerLoaderContext;
                result = await service_run(loaderName, {
                    loaderContext: (normalModule = loaderContext._module instanceof binding_.NormalModule ? loaderContext._module : void 0, Object.assign(workerLoaderContext = {
                        hot: loaderContext.hot,
                        context: loaderContext.context,
                        resourcePath: loaderContext.resourcePath,
                        resourceQuery: loaderContext.resourceQuery,
                        resourceFragment: loaderContext.resourceFragment,
                        resource: loaderContext.resource,
                        mode: loaderContext.mode,
                        sourceMap: loaderContext.sourceMap,
                        rootContext: loaderContext.rootContext,
                        loaderIndex: loaderContext.loaderIndex,
                        loaders: loaderContext.loaders.map((item)=>{
                            let options = item.options;
                            return (!item.parallel || item.request.startsWith(BUILTIN_LOADER_PREFIX)) && (options = void 0), {
                                ...item,
                                options,
                                pitch: void 0,
                                normal: void 0,
                                normalExecuted: item.normalExecuted,
                                pitchExecuted: item.pitchExecuted
                            };
                        }),
                        __internal__workerInfo: {
                            hashFunction: compiler._lastCompilation.outputOptions.hashFunction
                        },
                        _compiler: {
                            options: {
                                experiments: {
                                    css: compiler.options.experiments.css
                                }
                            }
                        },
                        _compilation: {
                            options: {
                                output: {
                                    environment: compiler._lastCompilation.outputOptions.environment
                                }
                            },
                            outputOptions: {
                                hashSalt: compiler._lastCompilation.outputOptions.hashSalt,
                                hashFunction: compiler._lastCompilation.outputOptions.hashFunction,
                                hashDigest: compiler._lastCompilation.outputOptions.hashDigest,
                                hashDigestLength: compiler._lastCompilation.outputOptions.hashDigestLength
                            }
                        },
                        _module: {
                            type: loaderContext._module.type,
                            identifier: loaderContext._module.identifier(),
                            matchResource: normalModule?.matchResource,
                            request: normalModule?.request,
                            userRequest: normalModule?.userRequest,
                            rawRequest: normalModule?.rawRequest
                        }
                    }, compiler.options.loader), workerLoaderContext),
                    loaderState,
                    args
                }, {
                    handleIncomingRequest (requestType, ...args) {
                        switch(requestType){
                            case "AddDependency":
                                loaderContext.addDependency(args[0]);
                                break;
                            case "AddContextDependency":
                                loaderContext.addContextDependency(args[0]);
                                break;
                            case "AddMissingDependency":
                                loaderContext.addMissingDependency(args[0]);
                                break;
                            case "AddBuildDependency":
                                loaderContext.addBuildDependency(args[0]);
                                break;
                            case "GetDependencies":
                                return loaderContext.getDependencies();
                            case "GetContextDependencies":
                                return loaderContext.getContextDependencies();
                            case "GetMissingDependencies":
                                return loaderContext.getMissingDependencies();
                            case "ClearDependencies":
                                loaderContext.clearDependencies();
                                break;
                            case "Resolve":
                                return new Promise((resolve, reject)=>{
                                    loaderContext.resolve(args[0], args[1], (err, result)=>{
                                        err ? reject(err) : resolve(result);
                                    });
                                });
                            case "GetResolve":
                                return new Promise((resolve, reject)=>{
                                    loaderContext.getResolve(args[0])(args[1], args[2], (err, result)=>{
                                        err ? reject(err) : resolve(result);
                                    });
                                });
                            case "GetLogger":
                                {
                                    let [type, name, arg] = args;
                                    loaderContext.getLogger(name)[type](...arg);
                                    break;
                                }
                            case "EmitError":
                                {
                                    let workerError = args[0], error = Error(workerError.message);
                                    error.stack = workerError.stack, error.name = workerError.name, loaderContext.emitError(error);
                                    break;
                                }
                            case "EmitWarning":
                                {
                                    let workerError = args[0], error = Error(workerError.message);
                                    error.stack = workerError.stack, error.name = workerError.name, loaderContext.emitWarning(error);
                                    break;
                                }
                            case "EmitFile":
                                {
                                    let [name, content, sourceMap, assetInfo] = args;
                                    loaderContext.emitFile(name, content, sourceMap, assetInfo);
                                    break;
                                }
                            case "EmitDiagnostic":
                                {
                                    let diagnostic = args[0];
                                    loaderContext.experiments.emitDiagnostic(diagnostic);
                                    break;
                                }
                            case "SetCacheable":
                                {
                                    let cacheable = args[0];
                                    loaderContext.cacheable(cacheable);
                                    break;
                                }
                            case "ImportModule":
                                return loaderContext.importModule(args[0], args[1]);
                            case "UpdateLoaderObjects":
                                {
                                    let updates = args[0];
                                    loaderContext.loaders = loaderContext.loaders.map((item, index)=>{
                                        let update = updates[index];
                                        return item.loaderItem.data = update.data, update.pitchExecuted && (item.pitchExecuted = !0), update.normalExecuted && (item.normalExecuted = !0), item;
                                    });
                                    break;
                                }
                            case "CompilationGetPath":
                                {
                                    let filename = args[0], data = args[1];
                                    return compiler._lastCompilation.getPath(filename, data);
                                }
                            case "CompilationGetPathWithInfo":
                                {
                                    let filename = args[0], data = args[1];
                                    return compiler._lastCompilation.getPathWithInfo(filename, data);
                                }
                            case "CompilationGetAssetPath":
                                {
                                    let filename = args[0], data = args[1];
                                    return compiler._lastCompilation.getAssetPath(filename, data);
                                }
                            case "CompilationGetAssetPathWithInfo":
                                {
                                    let filename = args[0], data = args[1];
                                    return compiler._lastCompilation.getAssetPathWithInfo(filename, data);
                                }
                            default:
                                throw Error(`Unknown request type: ${requestType}`);
                        }
                    }
                }, "object" == typeof currentLoaderObject?.parallel ? currentLoaderObject.parallel : void 0) || [];
            } else loaderState === binding_.JsLoaderState.Normal && function(args, raw) {
                if (!raw && args[0] instanceof Uint8Array) {
                    var buf;
                    let isShared, str;
                    args[0] = (isShared = (buf = args[0]).buffer instanceof SharedArrayBuffer || buf.buffer.constructor?.name === "SharedArrayBuffer", 0xfeff === (str = decoder.decode(isShared ? Buffer.from(buf) : buf)).charCodeAt(0) ? str.slice(1) : str);
                } else raw && "string" == typeof args[0] && (args[0] = Buffer.from(args[0], "utf-8"));
                raw && args[0] instanceof Uint8Array && !Buffer.isBuffer(args[0]) && (args[0] = Buffer.from(args[0].buffer));
            }(args, !!currentLoaderObject?.raw), result = await utils_runSyncOrAsync(fn, loaderContext, args) || [];
            return JavaScriptTracer.endAsync({
                name: loaderName,
                trackName: loaderName,
                processName: LOADER_PROCESS_NAME,
                uuid,
                args: {
                    is_pitch: pitch,
                    resource: resource
                }
            }), result;
        };
        try {
            switch(loaderState){
                case binding_.JsLoaderState.Pitching:
                    for(; loaderContext.loaderIndex < loaderContext.loaders.length;){
                        let currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex], parallelism = enableParallelism(currentLoaderObject);
                        if (currentLoaderObject.shouldYield()) break;
                        if (currentLoaderObject.pitchExecuted) {
                            loaderContext.loaderIndex += 1;
                            continue;
                        }
                        await utils_loadLoader(currentLoaderObject, compiler);
                        let fn = currentLoaderObject.pitch;
                        if (parallelism && fn || (currentLoaderObject.pitchExecuted = !0), !fn) continue;
                        let args = await isomorphoicRun(fn, [
                            loaderContext.remainingRequest,
                            loaderContext.previousRequest,
                            currentLoaderObject.loaderItem.data
                        ]);
                        if (args.some((value)=>void 0 !== value)) {
                            let [content, sourceMap, additionalData] = args;
                            context.content = isNil(content) ? null : toBuffer(content), context.sourceMap = serializeObject(sourceMap), context.additionalData = additionalData || void 0;
                            break;
                        }
                    }
                    break;
                case binding_.JsLoaderState.Normal:
                    {
                        let content = context.content, sourceMap = JsSourceMap.__from_binding(context.sourceMap), additionalData = context.additionalData;
                        for(; loaderContext.loaderIndex >= 0;){
                            let currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex], parallelism = enableParallelism(currentLoaderObject);
                            if (currentLoaderObject.shouldYield()) break;
                            if (currentLoaderObject.normalExecuted) {
                                loaderContext.loaderIndex--;
                                continue;
                            }
                            await utils_loadLoader(currentLoaderObject, compiler);
                            let fn = currentLoaderObject.normal;
                            parallelism && fn || (currentLoaderObject.normalExecuted = !0), fn && ([content, sourceMap, additionalData] = await isomorphoicRun(fn, [
                                content,
                                sourceMap,
                                additionalData
                            ]));
                        }
                        context.content = isNil(content) ? null : toBuffer(content), context.sourceMap = JsSourceMap.__to_binding(sourceMap), context.additionalData = additionalData || void 0, context.__internal__utf8Hint = "string" == typeof content;
                        break;
                    }
                default:
                    throw Error(`Unexpected loader runner state: ${loaderState}`);
            }
            context.loaderItems = loaderContext.loaders.map((item)=>LoaderObject.__to_binding(item));
        } catch (e) {
            if ("object" != typeof e || null === e) {
                let error = Error(`(Emitted value instead of an instance of Error) ${e}`);
                error.name = "NonErrorEmittedError", context.__internal__error = error;
            } else context.__internal__error = e;
        }
        return JavaScriptTracer.endAsync({
            name: "run_js_loaders",
            uuid,
            args: {
                is_pitch: pitch,
                resource: resource
            }
        }), compiler.options.experiments.cache && compiler.options?.cache && Object.keys(buildInfo = context._module.buildInfo).some((key)=>!knownBuildInfoFields.has(key)) && buildInfo[binding_default().COMMIT_CUSTOM_FIELDS_SYMBOL](), context;
    }
    let loader_runner_PATH_QUERY_FRAGMENT_REGEXP = /^((?:\u200b.|[^?#\u200b])*)(\?(?:\u200b.|[^#\u200b])*)?(#.*)?$/;
    function parsePathQueryFragment(str) {
        let match = loader_runner_PATH_QUERY_FRAGMENT_REGEXP.exec(str);
        return {
            path: match?.[1].replace(/\u200b(.)/g, "$1") || "",
            query: match?.[2] ? match[2].replace(/\u200b(.)/g, "$1") : "",
            fragment: match?.[3] || ""
        };
    }
    let BUILTIN_LOADER_PREFIX = "builtin:";
    function createRawModuleRuleUses(uses, path, options) {
        var uses1, path1, options1;
        let normalizeRuleSetUseItem = (item)=>"string" == typeof item ? {
                loader: item
            } : item;
        return uses1 = Array.isArray(uses) ? [
            ...uses
        ].map(normalizeRuleSetUseItem) : [
            normalizeRuleSetUseItem(uses)
        ], path1 = path, options1 = options, uses1.length ? uses1.filter(Boolean).map((use, index)=>{
            let o, isBuiltin = !1;
            if (use.loader.startsWith(BUILTIN_LOADER_PREFIX)) {
                let temp = function(identifier, o, options) {
                    if (identifier.startsWith(`${BUILTIN_LOADER_PREFIX}swc-loader`)) return ((options, _)=>{
                        if (options && "object" == typeof options) {
                            options.jsc ??= {}, options.jsc.experimental ??= {}, options.jsc.experimental.disableAllLints ??= !0;
                            let { rspackExperiments } = options;
                            if (rspackExperiments) {
                                var options1;
                                (rspackExperiments.import || rspackExperiments.pluginImport) && (rspackExperiments.import = function(pluginImport) {
                                    if (pluginImport) return pluginImport.map((config)=>{
                                        let rawConfig = {
                                            ...config,
                                            style: {}
                                        };
                                        if ("boolean" == typeof config.style) rawConfig.style.bool = config.style;
                                        else if ("string" == typeof config.style) {
                                            let isTpl = config.style.includes("{{");
                                            rawConfig.style[isTpl ? "custom" : "css"] = config.style;
                                        } else {
                                            var val;
                                            val = config.style, "[object Object]" === Object.prototype.toString.call(val) && (rawConfig.style = config.style);
                                        }
                                        return config.styleLibraryDirectory && (rawConfig.style = {
                                            styleLibraryDirectory: config.styleLibraryDirectory
                                        }), rawConfig;
                                    });
                                }(rspackExperiments.import || rspackExperiments.pluginImport)), rspackExperiments.collectTypeScriptInfo && (rspackExperiments.collectTypeScriptInfo = {
                                    typeExports: (options1 = rspackExperiments.collectTypeScriptInfo).typeExports,
                                    exportedEnum: !0 === options1.exportedEnum ? "all" : !1 === options1.exportedEnum || void 0 === options1.exportedEnum ? "none" : "const-only"
                                });
                            }
                        }
                        return options;
                    })(o, 0);
                    if (identifier.startsWith(`${BUILTIN_LOADER_PREFIX}lightningcss-loader`)) {
                        var o1;
                        return (o1 = o) && "object" == typeof o1 && ("string" == typeof o1.targets && (o1.targets = [
                            o1.targets
                        ]), o1.include && "object" == typeof o1.include && (o1.include = toFeatures(o1.include)), o1.exclude && "object" == typeof o1.exclude && (o1.exclude = toFeatures(o1.exclude))), o1;
                    }
                    return o;
                }(use.loader, use.options, 0);
                o = isNil(temp) ? void 0 : "string" == typeof temp ? temp : JSON.stringify(temp, null, 2), isBuiltin = !0;
            }
            return {
                loader: function(use, path, compiler, isBuiltin) {
                    let obj = parsePathQueryFragment(use.loader), ident = use.ident;
                    null === use.options || void 0 === use.options || ("string" == typeof use.options ? obj.query = `?${use.options}` : use.ident ? obj.query = `??${ident = use.ident}` : "object" == typeof use.options && use.options.ident ? obj.query = `??${ident = use.options.ident}` : "object" == typeof use.options ? obj.query = `??${ident = path}` : obj.query = `?${JSON.stringify(use.options)}`);
                    let parallelism = !!use.parallel;
                    if (parallelism && (!use.options || "object" != typeof use.options)) throw Error(`\`Rule.use.parallel\` requires \`Rule.use.options\` to be an object.\nHowever the received value is \`${use.options}\` under option path \`${path}\`\nInternally, parallelism is provided by passing \`Rule.use.ident\` to the loader as an identifier to ident the parallelism option\nYou can either replace the \`Rule.use.loader\` with \`Rule.use.options = {}\` or remove \`Rule.use.parallel\`.`);
                    return use.options && "object" == typeof use.options && (ident || (ident = "[[missing ident]]"), compiler.__internal__ruleSet.references.set(ident, use.options), compiler.__internal__ruleSet.references.set(`${ident}$$parallelism`, parallelism), isBuiltin && compiler.__internal__ruleSet.builtinReferences.set(ident, use.options)), obj.path + obj.query + obj.fragment;
                }(use, `${path1}[${index}]`, options1.compiler, isBuiltin),
                options: o
            };
        }) : [];
    }
    function isUseSourceMap(devtool) {
        return !!devtool && devtool.includes("source-map") && (devtool.includes("module") || !devtool.includes("cheap"));
    }
    function getRawAlias(alias = {}) {
        return !("object" != typeof alias || null === alias || Array.isArray(alias)) && Object.entries(alias).map(([key, value])=>({
                path: key,
                redirect: Array.isArray(value) ? value : [
                    value
                ]
            }));
    }
    function getRawResolve(resolve) {
        var byDependency;
        return {
            ...resolve,
            alias: getRawAlias(resolve.alias),
            fallback: getRawAlias(resolve.fallback),
            extensionAlias: function(alias = {}) {
                if ("object" == typeof alias && null !== alias) return Object.fromEntries(Object.entries(alias).map(([key, value])=>Array.isArray(value) ? [
                        key,
                        value
                    ] : [
                        key,
                        [
                            value
                        ]
                    ]));
            }(resolve.extensionAlias),
            tsconfig: function(tsConfig) {
                if ("string" == typeof tsConfig) throw Error("should resolve string tsConfig in normalization");
                if (void 0 === tsConfig) return tsConfig;
                let { configFile, references } = tsConfig;
                return {
                    configFile,
                    referencesType: "auto" === references ? "auto" : references ? "manual" : "disabled",
                    references: "auto" === references ? void 0 : references
                };
            }(resolve.tsConfig),
            byDependency: void 0 === (byDependency = resolve.byDependency) ? byDependency : Object.fromEntries(Object.entries(byDependency).map(([k, v])=>[
                    k,
                    getRawResolve(v)
                ]))
        };
    }
    function tryMatch(payload, condition) {
        if ("string" == typeof condition) return payload.startsWith(condition);
        if (condition instanceof RegExp) return condition.test(payload);
        if ("function" == typeof condition) return condition(payload);
        if (Array.isArray(condition)) return condition.some((c)=>tryMatch(payload, c));
        if (condition && "object" == typeof condition) {
            if (condition.and) return condition.and.every((c)=>tryMatch(payload, c));
            if (condition.or) return condition.or.some((c)=>tryMatch(payload, c));
            if (condition.not) return !tryMatch(payload, condition.not);
        }
        return !1;
    }
    let getRawModuleRule = (rule, path, options, upperType)=>{
        let funcUse;
        if (rule.loader && (rule.use = [
            {
                loader: rule.loader,
                options: rule.options
            }
        ]), "function" == typeof rule.use) {
            let use = rule.use;
            funcUse = (rawContext)=>createRawModuleRuleUses(use({
                    ...rawContext,
                    compiler: options.compiler
                }) ?? [], `${path}.use`, options);
        }
        let rawModuleRule = {
            test: rule.test ? getRawRuleSetCondition(rule.test) : void 0,
            include: rule.include ? getRawRuleSetCondition(rule.include) : void 0,
            exclude: rule.exclude ? getRawRuleSetCondition(rule.exclude) : void 0,
            issuer: rule.issuer ? getRawRuleSetCondition(rule.issuer) : void 0,
            issuerLayer: rule.issuerLayer ? getRawRuleSetCondition(rule.issuerLayer) : void 0,
            dependency: rule.dependency ? getRawRuleSetCondition(rule.dependency) : void 0,
            descriptionData: rule.descriptionData ? Object.fromEntries(Object.entries(rule.descriptionData).map(([k, v])=>[
                    k,
                    getRawRuleSetCondition(v)
                ])) : void 0,
            with: rule.with ? Object.fromEntries(Object.entries(rule.with).map(([k, v])=>[
                    k,
                    getRawRuleSetCondition(v)
                ])) : void 0,
            resource: rule.resource ? getRawRuleSetCondition(rule.resource) : void 0,
            resourceQuery: rule.resourceQuery ? getRawRuleSetCondition(rule.resourceQuery) : void 0,
            resourceFragment: rule.resourceFragment ? getRawRuleSetCondition(rule.resourceFragment) : void 0,
            scheme: rule.scheme ? getRawRuleSetCondition(rule.scheme) : void 0,
            mimetype: rule.mimetype ? getRawRuleSetCondition(rule.mimetype) : void 0,
            sideEffects: rule.sideEffects,
            use: "function" == typeof rule.use ? funcUse : createRawModuleRuleUses(rule.use ?? [], `${path}.use`, options),
            type: rule.type,
            layer: rule.layer,
            parser: rule.parser ? getRawParserOptions(rule.parser, rule.type ?? upperType) : void 0,
            generator: rule.generator ? getRawGeneratorOptions(rule.generator, rule.type ?? upperType) : void 0,
            resolve: rule.resolve ? getRawResolve(rule.resolve) : void 0,
            oneOf: rule.oneOf ? rule.oneOf.filter(Boolean).map((rule, index)=>getRawModuleRule(rule, `${path}.oneOf[${index}]`, options, rule.type ?? upperType)) : void 0,
            rules: rule.rules ? rule.rules.filter(Boolean).map((rule, index)=>getRawModuleRule(rule, `${path}.rules[${index}]`, options, rule.type ?? upperType)) : void 0,
            enforce: rule.enforce,
            extractSourceMap: rule.extractSourceMap
        };
        return ("function" == typeof rule.test || "function" == typeof rule.resource || "function" == typeof rule.resourceQuery || "function" == typeof rule.resourceFragment) && (delete rawModuleRule.test, delete rawModuleRule.resource, delete rawModuleRule.resourceQuery, delete rawModuleRule.resourceFragment, rawModuleRule.rspackResource = getRawRuleSetCondition((resourceQueryFragment)=>{
            let { path, query, fragment } = parseResource(resourceQueryFragment);
            return (!rule.test || !!tryMatch(path, rule.test)) && (!rule.resource || !!tryMatch(path, rule.resource)) && (!rule.resourceQuery || !!tryMatch(query, rule.resourceQuery)) && (!rule.resourceFragment || !!tryMatch(fragment, rule.resourceFragment));
        })), rawModuleRule;
    };
    function getRawRuleSetCondition(condition) {
        if ("string" == typeof condition) return {
            type: binding_.RawRuleSetConditionType.string,
            string: condition
        };
        if (condition instanceof RegExp) return {
            type: binding_.RawRuleSetConditionType.regexp,
            regexp: condition
        };
        if ("function" == typeof condition) return {
            type: binding_.RawRuleSetConditionType.func,
            func: condition
        };
        if (Array.isArray(condition)) return {
            type: binding_.RawRuleSetConditionType.array,
            array: condition.map((i)=>getRawRuleSetCondition(i))
        };
        if ("object" == typeof condition && null !== condition) {
            var logical;
            return {
                type: binding_.RawRuleSetConditionType.logical,
                logical: [
                    {
                        and: (logical = condition).and ? logical.and.map((i)=>getRawRuleSetCondition(i)) : void 0,
                        or: logical.or ? logical.or.map((i)=>getRawRuleSetCondition(i)) : void 0,
                        not: logical.not ? getRawRuleSetCondition(logical.not) : void 0
                    }
                ]
            };
        }
        throw Error("unreachable: condition should be one of string, RegExp, Array, Object");
    }
    function getRawParserOptions(parser, type) {
        var parser1, parser2;
        if ("asset" === type) {
            return {
                type: "asset",
                asset: {
                    dataUrlCondition: (parser1 = parser).dataUrlCondition ? function(dataUrlCondition) {
                        if ("object" == typeof dataUrlCondition && null !== dataUrlCondition) return {
                            type: "options",
                            options: {
                                maxSize: dataUrlCondition.maxSize
                            }
                        };
                        throw Error(`unreachable: AssetParserDataUrl type should be one of "options", but got ${dataUrlCondition}`);
                    }(parser1.dataUrlCondition) : void 0
                }
            };
        }
        if ("javascript" === type) return {
            type: "javascript",
            javascript: getRawJavascriptParserOptions(parser)
        };
        if ("javascript/auto" === type) return {
            type: "javascript/auto",
            javascript: getRawJavascriptParserOptions(parser)
        };
        if ("javascript/dynamic" === type) return {
            type: "javascript/dynamic",
            javascript: getRawJavascriptParserOptions(parser)
        };
        if ("javascript/esm" === type) return {
            type: "javascript/esm",
            javascript: getRawJavascriptParserOptions(parser)
        };
        if ("css" === type) return {
            type: "css",
            css: getRawCssParserOptions(parser)
        };
        if ("css/auto" === type) return {
            type: "css/auto",
            cssAuto: getRawCssParserOptions(parser)
        };
        if ("css/module" === type) return {
            type: "css/module",
            cssModule: getRawCssParserOptions(parser)
        };
        if ("json" === type) {
            return {
                type: "json",
                json: {
                    exportsDepth: (parser2 = parser).exportsDepth,
                    parse: "function" == typeof parser2.parse ? (str)=>JSON.stringify(parser2.parse(str)) : void 0
                }
            };
        }
        throw Error(`unreachable: unknown module type: ${type}`);
    }
    function getRawJavascriptParserOptions(parser) {
        return {
            dynamicImportMode: parser.dynamicImportMode,
            dynamicImportPreload: parser.dynamicImportPreload?.toString(),
            dynamicImportPrefetch: parser.dynamicImportPrefetch?.toString(),
            dynamicImportFetchPriority: parser.dynamicImportFetchPriority,
            importMeta: parser.importMeta,
            url: parser.url?.toString(),
            exprContextCritical: parser.exprContextCritical,
            unknownContextCritical: parser.unknownContextCritical,
            wrappedContextCritical: parser.wrappedContextCritical,
            wrappedContextRegExp: parser.wrappedContextRegExp,
            exportsPresence: !1 === parser.exportsPresence ? "false" : parser.exportsPresence,
            importExportsPresence: !1 === parser.importExportsPresence ? "false" : parser.importExportsPresence,
            reexportExportsPresence: !1 === parser.reexportExportsPresence ? "false" : parser.reexportExportsPresence,
            strictExportPresence: parser.strictExportPresence,
            worker: "boolean" == typeof parser.worker ? parser.worker ? [
                "..."
            ] : [] : parser.worker,
            overrideStrict: parser.overrideStrict,
            requireAsExpression: parser.requireAsExpression,
            requireDynamic: parser.requireDynamic,
            requireResolve: parser.requireResolve,
            commonjs: parser.commonjs,
            importDynamic: parser.importDynamic,
            commonjsMagicComments: parser.commonjsMagicComments,
            inlineConst: parser.inlineConst,
            typeReexportsPresence: parser.typeReexportsPresence,
            jsx: parser.jsx,
            deferImport: parser.deferImport
        };
    }
    function getRawCssParserOptions(parser) {
        return {
            namedExports: parser.namedExports,
            url: parser.url
        };
    }
    function getRawGeneratorOptions(generator, type) {
        var options, options1;
        if ("asset" === type) {
            return {
                type: "asset",
                asset: generator ? {
                    ...getRawAssetInlineGeneratorOptions(options = generator),
                    ...getRawAssetResourceGeneratorOptions(options)
                } : void 0
            };
        }
        if ("asset/inline" === type) return {
            type: "asset/inline",
            assetInline: generator ? getRawAssetInlineGeneratorOptions(generator) : void 0
        };
        if ("asset/resource" === type) return {
            type: "asset/resource",
            assetResource: generator ? getRawAssetResourceGeneratorOptions(generator) : void 0
        };
        if ("css" === type) {
            return {
                type: "css",
                css: {
                    exportsOnly: (options1 = generator).exportsOnly,
                    esModule: options1.esModule
                }
            };
        }
        if ("css/auto" === type) return {
            type: "css/auto",
            cssAuto: getRawCssAutoOrModuleGeneratorOptions(generator)
        };
        if ("css/module" === type) return {
            type: "css/module",
            cssModule: getRawCssAutoOrModuleGeneratorOptions(generator)
        };
        if ("json" === type) return {
            type: "json",
            json: {
                JSONParse: generator.JSONParse
            }
        };
        if (![
            "asset/source",
            "javascript",
            "javascript/auto",
            "javascript/dynamic",
            "javascript/esm"
        ].includes(type)) throw Error(`unreachable: unknown module type: ${type}`);
    }
    function getRawAssetInlineGeneratorOptions(options) {
        return {
            dataUrl: options.dataUrl ? function(dataUrl) {
                if ("object" == typeof dataUrl && null !== dataUrl) return {
                    encoding: !1 === dataUrl.encoding ? "false" : dataUrl.encoding,
                    mimetype: dataUrl.mimetype
                };
                if ("function" == typeof dataUrl && null !== dataUrl) return (source, context)=>dataUrl(source, context);
                throw Error(`unreachable: AssetGeneratorDataUrl type should be one of "options", "function", but got ${dataUrl}`);
            }(options.dataUrl) : void 0,
            binary: options.binary
        };
    }
    function getRawAssetResourceGeneratorOptions(options) {
        return {
            emit: options.emit,
            filename: options.filename,
            outputPath: options.outputPath,
            publicPath: options.publicPath,
            importMode: options.importMode,
            binary: options.binary
        };
    }
    function getRawCssAutoOrModuleGeneratorOptions(options) {
        return {
            localIdentName: options.localIdentName,
            exportsConvention: options.exportsConvention,
            exportsOnly: options.exportsOnly,
            esModule: options.esModule
        };
    }
    class ExternalsPlugin extends RspackBuiltinPlugin {
        type;
        externals;
        placeInInitial;
        name = binding_.BuiltinPluginName.ExternalsPlugin;
        #resolveRequestCache = new Map();
        constructor(type, externals, placeInInitial){
            super(), this.type = type, this.externals = externals, this.placeInInitial = placeInInitial;
        }
        raw() {
            let type = this.type, externals = this.externals, raw = {
                type,
                externals: (Array.isArray(externals) ? externals : [
                    externals
                ]).filter(Boolean).map((item)=>this.#getRawExternalItem(item)),
                placeInInitial: this.placeInInitial ?? !1
            };
            return createBuiltinPlugin(this.name, raw);
        }
        #processResolveResult = (text)=>{
            if (!text) return;
            let resolveRequest = this.#resolveRequestCache.get(text);
            return resolveRequest || (resolveRequest = JSON.parse(text), this.#resolveRequestCache.set(text, resolveRequest)), Object.assign({}, resolveRequest);
        };
        #processRequest(req) {
            return `${req.path.replace(/#/g, "\u200b#")}${req.query.replace(/#/g, "\u200b#")}${req.fragment}`;
        }
        #getRawExternalItem = (item)=>{
            if ("string" == typeof item || item instanceof RegExp) return item;
            if ("function" == typeof item) {
                let processResolveResult = this.#processResolveResult;
                return async (ctx)=>await new Promise((resolve, reject)=>{
                        let data = ctx.data(), promise = item({
                            request: data.request,
                            dependencyType: data.dependencyType,
                            context: data.context,
                            contextInfo: {
                                issuer: data.contextInfo.issuer,
                                issuerLayer: data.contextInfo.issuerLayer ?? null
                            },
                            getResolve: (options)=>{
                                let rawResolve = options ? getRawResolve(options) : void 0, resolve = ctx.getResolve(rawResolve);
                                return (context, request, callback)=>{
                                    if (!callback) return new Promise((promiseResolve, promiseReject)=>{
                                        resolve(context, request, (error, text)=>{
                                            if (error) promiseReject(error);
                                            else {
                                                let req = processResolveResult(text);
                                                promiseResolve(req ? this.#processRequest(req) : void 0);
                                            }
                                        });
                                    });
                                    resolve(context, request, (error, text)=>{
                                        if (error) callback(error);
                                        else {
                                            let req = processResolveResult(text);
                                            callback(null, !!req && this.#processRequest(req), req);
                                        }
                                    });
                                };
                            }
                        }, (err, result, type)=>{
                            err && reject(err), resolve({
                                result: getRawExternalItemValueFormFnResult(result),
                                externalType: type
                            });
                        });
                        promise?.then ? promise.then((result)=>resolve({
                                result: getRawExternalItemValueFormFnResult(result),
                                externalType: void 0
                            }), (e)=>reject(e)) : 1 === item.length && resolve({
                            result: getRawExternalItemValueFormFnResult(promise),
                            externalType: void 0
                        });
                    });
            }
            if ("object" == typeof item) return Object.fromEntries(Object.entries(item).map(([k, v])=>[
                    k,
                    getRawExternalItemValue(v)
                ]));
            throw TypeError(`Unexpected type of external item: ${typeof item}`);
        };
    }
    function getRawExternalItemValueFormFnResult(result) {
        return void 0 === result ? result : getRawExternalItemValue(result);
    }
    function getRawExternalItemValue(value) {
        return value && "object" == typeof value && !Array.isArray(value) ? Object.fromEntries(Object.entries(value).map(([k, v])=>[
                k,
                Array.isArray(v) ? v : [
                    v
                ]
            ])) : value;
    }
    let FetchCompileAsyncWasmPlugin = base_create(binding_.BuiltinPluginName.FetchCompileAsyncWasmPlugin, ()=>{}, "thisCompilation"), FileUriPlugin = base_create(binding_.BuiltinPluginName.FileUriPlugin, ()=>{}, "compilation"), FlagDependencyExportsPlugin = base_create(binding_.BuiltinPluginName.FlagDependencyExportsPlugin, ()=>{}, "compilation");
    class FlagDependencyUsagePlugin extends RspackBuiltinPlugin {
        global;
        name = binding_.BuiltinPluginName.FlagDependencyUsagePlugin;
        affectedHooks = "compilation";
        constructor(global){
            super(), this.global = global;
        }
        raw() {
            return createBuiltinPlugin(this.name, this.global);
        }
    }
    class HotModuleReplacementPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.HotModuleReplacementPlugin;
        raw(compiler) {
            return void 0 === compiler.options.output.strictModuleErrorHandling && (compiler.options.output.strictModuleErrorHandling = !0), createBuiltinPlugin(this.name, void 0);
        }
    }
    let HttpExternalsRspackPlugin = base_create(binding_.BuiltinPluginName.HttpExternalsRspackPlugin, (css, webAsync)=>({
            css,
            webAsync
        })), getHttp = memoize(()=>__webpack_require__("node:http")), getHttps = memoize(()=>__webpack_require__("node:https")), defaultHttpClientForNode = async (url, headers)=>{
        let { res, body } = await function(url, options) {
            let send = "https:" === new URL(url).protocol ? getHttps() : getHttp(), { createBrotliDecompress, createGunzip, createInflate } = __webpack_require__("node:zlib");
            return new Promise((resolve, reject)=>{
                send.get(url, options, (res)=>{
                    let contentEncoding = res.headers["content-encoding"], stream = res;
                    "gzip" === contentEncoding ? stream = stream.pipe(createGunzip()) : "br" === contentEncoding ? stream = stream.pipe(createBrotliDecompress()) : "deflate" === contentEncoding && (stream = stream.pipe(createInflate()));
                    let chunks = [];
                    stream.on("data", (chunk)=>{
                        chunks.push(chunk);
                    }), stream.on("end", ()=>{
                        let bodyBuffer = Buffer.concat(chunks);
                        res.complete ? resolve({
                            res,
                            body: bodyBuffer
                        }) : reject(Error(`${url} request was terminated early`));
                    });
                }).on("error", reject);
            });
        }(url, {
            headers
        }), responseHeaders = {};
        for (let [key, value] of Object.entries(res.headers))Array.isArray(value) ? responseHeaders[key] = value.join(", ") : responseHeaders[key] = value;
        return {
            status: res.statusCode,
            headers: responseHeaders,
            body: Buffer.from(body)
        };
    };
    class HttpUriPlugin extends RspackBuiltinPlugin {
        options;
        name = binding_.BuiltinPluginName.HttpUriPlugin;
        affectedHooks = "compilation";
        constructor(options){
            super(), this.options = options;
        }
        raw(compiler) {
            let options = this.options, lockfileLocation = options.lockfileLocation ?? external_node_path_default().join(compiler.context, compiler.name ? `${compiler.name}.rspack.lock` : "rspack.lock"), cacheLocation = !1 === options.cacheLocation ? void 0 : options.cacheLocation ?? `${lockfileLocation}.data`, raw = {
                allowedUris: options.allowedUris,
                lockfileLocation,
                cacheLocation,
                upgrade: options.upgrade ?? !1,
                httpClient: options.httpClient ?? defaultHttpClientForNode
            };
            return createBuiltinPlugin(this.name, raw);
        }
    }
    let compilationOptionsMap = new WeakMap(), external_node_fs_namespaceObject = require("node:fs");
    var external_node_fs_default = __webpack_require__.n(external_node_fs_namespaceObject);
    let hooks_compilationHooksMap = new WeakMap(), HTML_PLUGIN_UID = 0, HtmlRspackPluginImpl = base_create(binding_.BuiltinPluginName.HtmlRspackPlugin, function(c = {}) {
        let templateFn, templateParameters, filenames, uid = HTML_PLUGIN_UID++, meta = {};
        for(let key in c.meta){
            let value = c.meta[key];
            "string" == typeof value ? meta[key] = {
                name: key,
                content: value
            } : meta[key] = {
                name: key,
                ...value
            };
        }
        let scriptLoading = c.scriptLoading ?? "defer", configInject = c.inject ?? !0, base = "string" == typeof c.base ? {
            href: c.base
        } : c.base, chunksSortMode = c.chunksSortMode ?? "auto", compilation = null;
        function generateRenderData(data) {
            let json = JSON.parse(data);
            "function" != typeof c.templateParameters && (json.compilation = compilation);
            let renderTag = function() {
                var tag;
                let attributes;
                return tag = this, attributes = Object.keys(tag.attributes || {}).filter((attributeName)=>"" === tag.attributes[attributeName] || tag.attributes[attributeName]).map((attributeName)=>"true" === tag.attributes[attributeName] ? attributeName : `${attributeName}="${tag.attributes[attributeName]}"`), `<${[
                    tag.tagName
                ].concat(attributes).join(" ")}${tag.voidTag && !tag.innerHTML ? "/" : ""}>${tag.innerHTML || ""}${tag.voidTag && !tag.innerHTML ? "" : `</${tag.tagName}>`}`;
            }, renderTagList = function() {
                return this.join("");
            };
            if (Array.isArray(json.htmlRspackPlugin?.tags?.headTags)) {
                for (let tag of json.htmlRspackPlugin.tags.headTags)tag.toString = renderTag;
                json.htmlRspackPlugin.tags.headTags.toString = renderTagList;
            }
            if (Array.isArray(json.htmlRspackPlugin?.tags?.bodyTags)) {
                for (let tag of json.htmlRspackPlugin.tags.bodyTags)tag.toString = renderTag;
                json.htmlRspackPlugin.tags.bodyTags.toString = renderTagList;
            }
            return json;
        }
        this.hooks.compilation.tap("HtmlRspackPlugin", (compilationInstance)=>{
            var compilation1, uid1, options;
            let optionsMap;
            compilation1 = compilation = compilationInstance, uid1 = uid, options = c, (optionsMap = compilationOptionsMap.get(compilation1) || {})[uid1] = options, compilationOptionsMap.set(compilation1, optionsMap);
        }), this.hooks.done.tap("HtmlRspackPlugin", (stats)=>{
            var compilation, compilation1, uid1;
            let optionsMap;
            compilation = stats.compilation, hooks_compilationHooksMap.delete(compilation), compilation1 = stats.compilation, uid1 = uid, optionsMap = compilationOptionsMap.get(compilation1) || {}, delete optionsMap[uid1], 0 === Object.keys(optionsMap).length ? compilationOptionsMap.delete(compilation1) : compilationOptionsMap.set(compilation1, optionsMap);
        });
        let templateContent = c.templateContent;
        if ("function" == typeof templateContent) templateFn = async (data)=>{
            try {
                let renderer = c.templateContent;
                if (!1 === c.templateParameters) return await renderer({});
                return await renderer(generateRenderData(data));
            } catch (e) {
                let error = Error(`HtmlRspackPlugin: render template function failed, ${e.message}`);
                throw error.stack = e.stack, error;
            }
        }, templateContent = "";
        else if (c.template) {
            let filename = c.template.split("?")[0];
            [
                ".js",
                ".cjs"
            ].includes(external_node_path_default().extname(filename)) && (templateFn = async (data)=>{
                let context = this.options.context || process.cwd(), templateFilePath = external_node_path_default().resolve(context, filename);
                if (!external_node_fs_default().existsSync(templateFilePath)) throw Error(`HtmlRspackPlugin: could not load file \`${filename}\` from \`${context}\``);
                try {
                    let renderer = require(templateFilePath);
                    if (!1 === c.templateParameters) return await renderer({});
                    return await renderer(generateRenderData(data));
                } catch (e) {
                    let error = Error(`HtmlRspackPlugin: render template function failed, ${e.message}`);
                    throw error.stack = e.stack, error;
                }
            });
        }
        let rawTemplateParameters = c.templateParameters;
        if (templateParameters = "function" == typeof rawTemplateParameters ? async (data)=>JSON.stringify(await rawTemplateParameters(JSON.parse(data))) : rawTemplateParameters, "string" == typeof c.filename) if (filenames = new Set(), c.filename.includes("[name]")) if ("object" == typeof this.options.entry) for (let entryName of Object.keys(this.options.entry))filenames.add(c.filename.replace(/\[name\]/g, entryName));
        else throw Error("HtmlRspackPlugin: filename with `[name]` does not support function entry");
        else filenames.add(c.filename);
        else if ("function" == typeof c.filename) if (filenames = new Set(), "object" == typeof this.options.entry) for (let entryName of Object.keys(this.options.entry))filenames.add(c.filename(entryName));
        else throw Error("HtmlRspackPlugin: function filename does not support function entry");
        return {
            filename: filenames ? Array.from(filenames) : void 0,
            template: c.template,
            hash: c.hash,
            title: c.title,
            favicon: c.favicon,
            publicPath: c.publicPath,
            chunks: c.chunks,
            excludeChunks: c.excludeChunks,
            chunksSortMode,
            sri: c.sri,
            minify: c.minify,
            meta,
            scriptLoading,
            inject: !0 === configInject ? "blocking" === scriptLoading ? "body" : "head" : !1 === configInject ? "false" : configInject,
            base,
            templateFn,
            templateContent,
            templateParameters,
            uid
        };
    }), HtmlRspackPlugin = HtmlRspackPluginImpl, voidTags = [
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "keygen",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr"
    ];
    HtmlRspackPlugin.createHtmlTagObject = (tagName, attributes, innerHTML)=>({
            tagName,
            voidTag: voidTags.includes(tagName),
            attributes: attributes || {},
            innerHTML
        }), HtmlRspackPlugin.getHooks = HtmlRspackPlugin.getCompilationHooks = (compilation)=>{
        checkCompilation(compilation);
        let hooks = hooks_compilationHooksMap.get(compilation);
        return void 0 === hooks && (hooks = {
            beforeAssetTagGeneration: new lite_tapable_namespaceObject.AsyncSeriesWaterfallHook([
                "data"
            ]),
            alterAssetTags: new lite_tapable_namespaceObject.AsyncSeriesWaterfallHook([
                "data"
            ]),
            alterAssetTagGroups: new lite_tapable_namespaceObject.AsyncSeriesWaterfallHook([
                "data"
            ]),
            afterTemplateExecution: new lite_tapable_namespaceObject.AsyncSeriesWaterfallHook([
                "data"
            ]),
            beforeEmit: new lite_tapable_namespaceObject.AsyncSeriesWaterfallHook([
                "data"
            ]),
            afterEmit: new lite_tapable_namespaceObject.AsyncSeriesWaterfallHook([
                "data"
            ])
        }, hooks_compilationHooksMap.set(compilation, hooks)), hooks;
    }, HtmlRspackPlugin.version = 5;
    let IgnorePlugin = base_create(binding_.BuiltinPluginName.IgnorePlugin, (options)=>options), InferAsyncModulesPlugin = base_create(binding_.BuiltinPluginName.InferAsyncModulesPlugin, ()=>{}, "compilation"), InlineExportsPlugin = base_create(binding_.BuiltinPluginName.InlineExportsPlugin, ()=>{}, "compilation"), JavascriptModulesPlugin_compilationHooksMap = new WeakMap();
    class JavascriptModulesPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.JavascriptModulesPlugin;
        affectedHooks = "compilation";
        raw() {
            return createBuiltinPlugin(this.name, void 0);
        }
        static getCompilationHooks(compilation) {
            checkCompilation(compilation);
            let hooks = JavascriptModulesPlugin_compilationHooksMap.get(compilation);
            return void 0 === hooks && (hooks = {
                chunkHash: new lite_tapable_namespaceObject.SyncHook([
                    "chunk",
                    "hash"
                ])
            }, JavascriptModulesPlugin_compilationHooksMap.set(compilation, hooks)), hooks;
        }
    }
    let JsLoaderRspackPlugin = base_create(binding_.BuiltinPluginName.JsLoaderRspackPlugin, (compiler)=>runLoaders.bind(null, compiler), "thisCompilation"), JsonModulesPlugin = base_create(binding_.BuiltinPluginName.JsonModulesPlugin, ()=>{}, "compilation"), LibManifestPlugin = base_create(binding_.BuiltinPluginName.LibManifestPlugin, (options)=>{
        let { context, entryOnly, format, name, path, type } = options;
        return {
            context,
            entryOnly,
            format,
            name,
            path,
            type
        };
    }), LightningCssMinimizerRspackPlugin = base_create(binding_.BuiltinPluginName.LightningCssMinimizerRspackPlugin, (options)=>{
        let { include, exclude, draft, nonStandard, pseudoClasses, drafts } = options?.minimizerOptions ?? {}, targets = options?.minimizerOptions?.targets ?? "fully supports es6";
        return {
            test: options?.test,
            include: options?.include,
            exclude: options?.exclude,
            removeUnusedLocalIdents: options?.removeUnusedLocalIdents ?? !0,
            minimizerOptions: {
                errorRecovery: options?.minimizerOptions?.errorRecovery ?? !0,
                unusedSymbols: options?.minimizerOptions?.unusedSymbols ?? [],
                include: include ? toFeatures(include) : void 0,
                exclude: exclude ? toFeatures(exclude) : void 0,
                targets: "string" == typeof targets ? [
                    targets
                ] : targets,
                draft: draft ? {
                    customMedia: draft.customMedia ?? !1
                } : void 0,
                drafts: drafts ? {
                    customMedia: drafts.customMedia ?? !1
                } : void 0,
                nonStandard: nonStandard ? {
                    deepSelectorCombinator: nonStandard.deepSelectorCombinator ?? !1
                } : void 0,
                pseudoClasses
            }
        };
    }), LimitChunkCountPlugin = base_create(binding_.BuiltinPluginName.LimitChunkCountPlugin, (options)=>options), BuiltinLazyCompilationPlugin = base_create(binding_.BuiltinPluginName.LazyCompilationPlugin, (currentActiveModules, entries, imports, client, test)=>({
            module,
            imports,
            entries,
            test,
            client,
            currentActiveModules
        }), "thisCompilation"), LAZY_COMPILATION_PREFIX = "/lazy-compilation-using-", noop = (_req, _res, next)=>{
        "function" == typeof next && next();
    }, DEPRECATED_LAZY_COMPILATION_OPTIONS_WARN = "The `experiments.lazyCompilation` option is deprecated, please use the configuration top level `lazyCompilation` instead.", REPEAT_LAZY_COMPILATION_OPTIONS_WARN = "Both top-level `lazyCompilation` and `experiments.lazyCompilation` options are set. The top-level `lazyCompilation` configuration will take precedence.";
    function applyPlugin(compiler, options, activeModules) {
        let compiler1;
        new BuiltinLazyCompilationPlugin(()=>{
            let res = new Set(activeModules);
            return activeModules.clear(), res;
        }, options.entries ?? !0, options.imports ?? !0, `${options.client || (compiler1 = compiler, require.resolve(`../hot/lazy-compilation-${compiler1.options.externalsPresets.node ? "node" : "web"}.js`))}?${encodeURIComponent((({ serverUrl, prefix })=>{
            let lazyCompilationPrefix = prefix || LAZY_COMPILATION_PREFIX;
            return serverUrl ? serverUrl + (serverUrl.endsWith("/") ? lazyCompilationPrefix.slice(1) : lazyCompilationPrefix) : lazyCompilationPrefix;
        })(options))}`, options.test).apply(compiler);
    }
    let lazyCompilationMiddlewareInternal = (compiler, activeModules, lazyCompilationPrefix)=>{
        let logger = compiler.getInfrastructureLogger("LazyCompilation");
        return (req, res, next)=>{
            if (!req.url?.startsWith(lazyCompilationPrefix)) return next?.();
            let modules = req.url.slice(lazyCompilationPrefix.length).split("@").map(decodeURIComponent);
            req.socket.setNoDelay(!0), res.setHeader("content-type", "text/event-stream"), res.writeHead(200), res.write("\n");
            let moduleActivated = [];
            for (let key of modules){
                let activated = activeModules.has(key);
                activeModules.add(key), activated || (logger.log(`${key} is now in use and will be compiled.`), moduleActivated.push(key));
            }
            moduleActivated.length && compiler.watching && compiler.watching.invalidate();
        };
    };
    class MangleExportsPlugin extends RspackBuiltinPlugin {
        deterministic;
        name = binding_.BuiltinPluginName.MangleExportsPlugin;
        affectedHooks = "compilation";
        constructor(deterministic){
            super(), this.deterministic = deterministic;
        }
        raw() {
            return createBuiltinPlugin(this.name, this.deterministic);
        }
    }
    let MergeDuplicateChunksPlugin = base_create(binding_.BuiltinPluginName.MergeDuplicateChunksPlugin, ()=>{}), ModuleChunkFormatPlugin = base_create(binding_.BuiltinPluginName.ModuleChunkFormatPlugin, ()=>{});
    class ModuleConcatenationPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.ModuleConcatenationPlugin;
        affectedHooks = "compilation";
        raw() {
            return createBuiltinPlugin(this.name, void 0);
        }
    }
    let ModuleInfoHeaderPlugin = base_create(binding_.BuiltinPluginName.ModuleInfoHeaderPlugin, (verbose)=>verbose, "compilation"), NamedChunkIdsPlugin = base_create(binding_.BuiltinPluginName.NamedChunkIdsPlugin, ()=>{}, "compilation"), NamedModuleIdsPlugin = base_create(binding_.BuiltinPluginName.NamedModuleIdsPlugin, ()=>{}, "compilation");
    class NaturalChunkIdsPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.NaturalChunkIdsPlugin;
        affectedHooks = "compilation";
        raw() {
            return createBuiltinPlugin(this.name, void 0);
        }
    }
    class NaturalModuleIdsPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.NaturalModuleIdsPlugin;
        affectedHooks = "compilation";
        raw() {
            return createBuiltinPlugin(this.name, void 0);
        }
    }
    let NodeTargetPlugin = base_create(binding_.BuiltinPluginName.NodeTargetPlugin, ()=>void 0), NoEmitOnErrorsPlugin = base_create(binding_.BuiltinPluginName.NoEmitOnErrorsPlugin, ()=>void 0), NormalModuleReplacementPlugin = base_create(binding_.BuiltinPluginName.NormalModuleReplacementPlugin, (resourceRegExp, newResource)=>({
            resourceRegExp,
            newResource: "function" == typeof newResource ? (data)=>(newResource(data), data) : newResource
        })), OccurrenceChunkIdsPlugin = base_create(binding_.BuiltinPluginName.OccurrenceChunkIdsPlugin, (options)=>({
            ...options
        }), "compilation"), ProgressPlugin = base_create(binding_.BuiltinPluginName.ProgressPlugin, (progress = {})=>"function" == typeof progress ? {
            handler: (percentage, msg, items)=>{
                progress(percentage, msg, ...items);
            }
        } : progress), ProvidePlugin = base_create(binding_.BuiltinPluginName.ProvidePlugin, (provide)=>Object.fromEntries(Object.entries(provide).map(([key, value])=>("string" == typeof value && (value = [
                value
            ]), [
                key,
                value
            ]))), "compilation"), RealContentHashPlugin = base_create(binding_.BuiltinPluginName.RealContentHashPlugin, ()=>{}, "compilation"), RemoveEmptyChunksPlugin = base_create(binding_.BuiltinPluginName.RemoveEmptyChunksPlugin, ()=>{}, "compilation"), RsdoctorPluginImpl = base_create(binding_.BuiltinPluginName.RsdoctorPlugin, function(c = {
        moduleGraphFeatures: !0,
        chunkGraphFeatures: !0
    }) {
        return {
            moduleGraphFeatures: c.moduleGraphFeatures ?? !0,
            chunkGraphFeatures: c.chunkGraphFeatures ?? !0,
            sourceMapFeatures: c.sourceMapFeatures
        };
    }), RsdoctorPlugin_compilationHooksMap = new WeakMap();
    RsdoctorPluginImpl.getHooks = RsdoctorPluginImpl.getCompilationHooks = (compilation)=>{
        checkCompilation(compilation);
        let hooks = RsdoctorPlugin_compilationHooksMap.get(compilation);
        return void 0 === hooks && (hooks = {
            moduleGraph: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                "moduleGraph"
            ]),
            chunkGraph: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                "chunkGraph"
            ]),
            moduleIds: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                "moduleIdsPatch"
            ]),
            moduleSources: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                "moduleSourcesPatch"
            ]),
            assets: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                "assetPatch"
            ])
        }, RsdoctorPlugin_compilationHooksMap.set(compilation, hooks)), hooks;
    };
    let RslibPlugin = base_create(binding_.BuiltinPluginName.RslibPlugin, (rslib)=>rslib), RstestPlugin = base_create(binding_.BuiltinPluginName.RstestPlugin, (rstest)=>rstest), RuntimeChunkPlugin = base_create(binding_.BuiltinPluginName.RuntimeChunkPlugin, (options)=>options, "thisCompilation"), RuntimePlugin = base_create(binding_default().BuiltinPluginName.RuntimePlugin, ()=>{}, "compilation"), RuntimePlugin_compilationHooksMap = new WeakMap();
    RuntimePlugin.getHooks = RuntimePlugin.getCompilationHooks = (compilation)=>{
        checkCompilation(compilation);
        let hooks = RuntimePlugin_compilationHooksMap.get(compilation);
        return void 0 === hooks && (hooks = {
            createScript: new lite_tapable_namespaceObject.SyncWaterfallHook([
                "code",
                "chunk"
            ]),
            createLink: new lite_tapable_namespaceObject.SyncWaterfallHook([
                "code",
                "chunk"
            ]),
            linkPreload: new lite_tapable_namespaceObject.SyncWaterfallHook([
                "code",
                "chunk"
            ]),
            linkPrefetch: new lite_tapable_namespaceObject.SyncWaterfallHook([
                "code",
                "chunk"
            ])
        }, RuntimePlugin_compilationHooksMap.set(compilation, hooks)), hooks;
    };
    let SideEffectsFlagPlugin = base_create(binding_.BuiltinPluginName.SideEffectsFlagPlugin, ()=>{}, "compilation"), SizeLimitsPlugin = base_create(binding_.BuiltinPluginName.SizeLimitsPlugin, (options)=>{
        let hints = !1 === options.hints ? void 0 : options.hints;
        return {
            ...options,
            hints
        };
    }), SourceMapDevToolPlugin = base_create(binding_.BuiltinPluginName.SourceMapDevToolPlugin, (options)=>options, "compilation");
    class JsSplitChunkSizes {
        static __to_binding(sizes) {
            return "number" == typeof sizes ? sizes : sizes && "object" == typeof sizes ? {
                sizes: sizes
            } : sizes;
        }
    }
    class SplitChunksPlugin extends RspackBuiltinPlugin {
        options;
        name = binding_.BuiltinPluginName.SplitChunksPlugin;
        affectedHooks = "thisCompilation";
        constructor(options){
            super(), this.options = options;
        }
        raw(compiler) {
            let rawOptions = function(sc, compiler) {
                if (!sc) return;
                function getName(name) {
                    return "function" == typeof name ? (ctx)=>void 0 === ctx.module ? name(void 0) : name(ctx.module, getChunks(ctx.chunks), ctx.cacheGroupKey) : name;
                }
                function getChunks(chunks) {
                    return "function" == typeof chunks ? (chunk)=>chunks(chunk) : chunks;
                }
                let { name, chunks, defaultSizeTypes, cacheGroups = {}, fallbackCacheGroup, minSize, minSizeReduction, maxSize, maxAsyncSize, maxInitialSize, ...passThrough } = sc;
                return {
                    name: getName(name),
                    chunks: getChunks(chunks),
                    defaultSizeTypes: defaultSizeTypes || [
                        "javascript",
                        "unknown"
                    ],
                    cacheGroups: Object.entries(cacheGroups).filter(([_key, group])=>!1 !== group).map(([key, group])=>{
                        var test;
                        let { test: test1, name, chunks, minSize, minSizeReduction, maxSize, maxAsyncSize, maxInitialSize, ...passThrough } = group;
                        return {
                            key,
                            test: "function" == typeof (test = test1) ? (ctx)=>{
                                let info = {
                                    moduleGraph: compiler._lastCompilation.moduleGraph,
                                    chunkGraph: compiler._lastCompilation.chunkGraph
                                };
                                return test(ctx.module, info);
                            } : test,
                            name: getName(name),
                            chunks: getChunks(chunks),
                            minSize: JsSplitChunkSizes.__to_binding(minSize),
                            minSizeReduction: JsSplitChunkSizes.__to_binding(minSizeReduction),
                            maxSize: JsSplitChunkSizes.__to_binding(maxSize),
                            maxAsyncSize: JsSplitChunkSizes.__to_binding(maxAsyncSize),
                            maxInitialSize: JsSplitChunkSizes.__to_binding(maxInitialSize),
                            ...passThrough
                        };
                    }),
                    fallbackCacheGroup: {
                        chunks: getChunks(chunks),
                        ...fallbackCacheGroup
                    },
                    minSize: JsSplitChunkSizes.__to_binding(minSize),
                    minSizeReduction: JsSplitChunkSizes.__to_binding(minSizeReduction),
                    maxSize: JsSplitChunkSizes.__to_binding(maxSize),
                    maxAsyncSize: JsSplitChunkSizes.__to_binding(maxAsyncSize),
                    maxInitialSize: JsSplitChunkSizes.__to_binding(maxInitialSize),
                    ...passThrough
                };
            }(this.options, compiler);
            if (void 0 === rawOptions) throw Error("rawOptions should not be undefined");
            return createBuiltinPlugin(this.name, rawOptions);
        }
    }
    let SubresourceIntegrityPlugin_PLUGIN_NAME = "SubresourceIntegrityPlugin", NATIVE_HTML_PLUGIN = "HtmlRspackPlugin", HTTP_PROTOCOL_REGEX = /^https?:/, NativeSubresourceIntegrityPlugin = base_create(binding_.BuiltinPluginName.SubresourceIntegrityPlugin, function(options) {
        let htmlPlugin = "Disabled";
        return options.htmlPlugin === NATIVE_HTML_PLUGIN ? htmlPlugin = "Native" : "string" == typeof options.htmlPlugin && (htmlPlugin = "JavaScript"), {
            hashFuncNames: options.hashFuncNames,
            htmlPlugin,
            integrityCallback: options.integrityCallback
        };
    });
    class SubresourceIntegrityPlugin extends NativeSubresourceIntegrityPlugin {
        integrities = new Map();
        options;
        constructor(options = {}){
            if ("object" != typeof options) throw Error("SubResourceIntegrity: argument must be an object");
            const finalOptions = {
                hashFuncNames: options.hashFuncNames ?? [
                    "sha384"
                ],
                htmlPlugin: options.htmlPlugin ?? NATIVE_HTML_PLUGIN,
                enabled: options.enabled ?? "auto"
            };
            super({
                ...finalOptions,
                integrityCallback: (data)=>{
                    this.integrities = new Map(data.integerities.map((item)=>[
                            item.asset,
                            item.integrity
                        ]));
                }
            }), this.options = finalOptions;
        }
        isEnabled(compiler) {
            return "auto" === this.options.enabled ? "development" !== compiler.options.mode : this.options.enabled;
        }
        getIntegrityChecksumForAsset(src) {
            if (this.integrities.has(src)) return this.integrities.get(src);
            let normalizedSrc = normalizePath(src), normalizedKey = Array.from(this.integrities.keys()).find((assetKey)=>normalizePath(assetKey) === normalizedSrc);
            return normalizedKey ? this.integrities.get(normalizedKey) : void 0;
        }
        handleHwpPluginArgs({ assets }) {
            let publicPath = assets.publicPath, jsIntegrity = [];
            for (let asset of assets.js)jsIntegrity.push(this.getIntegrityChecksumForAsset((0, external_node_path_namespaceObject.relative)(publicPath, decodeURIComponent(asset))));
            let cssIntegrity = [];
            for (let asset of assets.css)cssIntegrity.push(this.getIntegrityChecksumForAsset((0, external_node_path_namespaceObject.relative)(publicPath, decodeURIComponent(asset))));
            assets.jsIntegrity = jsIntegrity, assets.cssIntegrity = cssIntegrity;
        }
        handleHwpBodyTags({ headTags, bodyTags, publicPath }, outputPath, crossOriginLoading) {
            for (let tag of headTags.concat(bodyTags))this.processTag(tag, publicPath, outputPath, crossOriginLoading);
        }
        processTag(tag, publicPath, outputPath, crossOriginLoading) {
            if (tag.attributes && "integrity" in tag.attributes) return;
            let tagSrc = function(tag) {
                if (tag.attributes) {
                    if ("script" === tag.tagName && "string" == typeof tag.attributes.src) return tag.attributes.src;
                    if ("link" === tag.tagName && "string" == typeof tag.attributes.href) {
                        let rel = tag.attributes.rel;
                        if ("string" != typeof rel) return;
                        return "stylesheet" === rel || "modulepreload" === rel || "preload" === rel && ("script" === tag.attributes.as || "style" === tag.attributes.as) ? tag.attributes.href : void 0;
                    }
                }
            }(tag);
            if (!tagSrc) return;
            let isUrlSrc = !1;
            try {
                let url = new URL(tagSrc);
                isUrlSrc = "http:" === url.protocol || "https:" === url.protocol;
            } catch (_) {
                isUrlSrc = tagSrc.startsWith("//");
            }
            let src = "";
            if (isUrlSrc) {
                if (!publicPath) return;
                let protocolRelativePublicPath = publicPath.replace(HTTP_PROTOCOL_REGEX, ""), protocolRelativeTagSrc = tagSrc.replace(HTTP_PROTOCOL_REGEX, "");
                if (!protocolRelativeTagSrc.startsWith(protocolRelativePublicPath)) return;
                {
                    let tagSrcWithScheme = `http:${protocolRelativeTagSrc}`, publicPathWithScheme = protocolRelativePublicPath.startsWith("//") ? `http:${protocolRelativePublicPath}` : protocolRelativePublicPath;
                    src = (0, external_node_path_namespaceObject.relative)(publicPathWithScheme, decodeURIComponent(tagSrcWithScheme));
                }
            } else src = (0, external_node_path_namespaceObject.relative)(publicPath, decodeURIComponent(tagSrc));
            tag.attributes.integrity = this.getIntegrityChecksumForAsset(src) || function(hashFuncNames, source) {
                let { createHash } = __webpack_require__("node:crypto");
                return hashFuncNames.map((hashFuncName)=>`${hashFuncName}-${createHash(hashFuncName).update("string" == typeof source ? Buffer.from(source, "utf-8") : source).digest("base64")}`).join(" ");
            }(this.options.hashFuncNames, (0, external_node_fs_namespaceObject.readFileSync)((0, external_node_path_namespaceObject.join)(outputPath, src))), tag.attributes.crossorigin = crossOriginLoading || "anonymous";
        }
        apply(compiler) {
            if (this.isEnabled(compiler) && (super.apply(compiler), compiler.hooks.compilation.tap(SubresourceIntegrityPlugin_PLUGIN_NAME, (compilation)=>{
                compilation.hooks.statsFactory.tap(SubresourceIntegrityPlugin_PLUGIN_NAME, (statsFactory)=>{
                    statsFactory.hooks.extract.for("asset").tap(SubresourceIntegrityPlugin_PLUGIN_NAME, (object, asset)=>{
                        let contenthash = asset.info?.contenthash;
                        if (contenthash) {
                            let shaHashes = (Array.isArray(contenthash) ? contenthash : [
                                contenthash
                            ]).filter((hash)=>String(hash).match(/^sha[0-9]+-/));
                            shaHashes.length > 0 && (object.integrity = shaHashes.join(" "));
                        }
                    });
                });
            }), "string" == typeof this.options.htmlPlugin && this.options.htmlPlugin !== NATIVE_HTML_PLUGIN)) {
                var htmlPlugin, obj;
                let self = this;
                try {
                    let getHooks;
                    getHooks = (htmlPlugin = require(this.options.htmlPlugin)).getCompilationHooks || htmlPlugin.getHooks, "function" == typeof getHooks && compiler.hooks.thisCompilation.tap(SubresourceIntegrityPlugin_PLUGIN_NAME, (compilation)=>{
                        if ("string" == typeof compiler.options.output.chunkLoading && [
                            "require",
                            "async-node"
                        ].includes(compiler.options.output.chunkLoading)) return;
                        let hwpHooks = getHooks(compilation);
                        hwpHooks.beforeAssetTagGeneration.tapPromise(SubresourceIntegrityPlugin_PLUGIN_NAME, async (data)=>(self.handleHwpPluginArgs(data), data)), hwpHooks.alterAssetTagGroups.tapPromise({
                            name: SubresourceIntegrityPlugin_PLUGIN_NAME,
                            stage: 10000
                        }, async (data)=>(self.handleHwpBodyTags(data, compiler.outputPath, compiler.options.output.crossOriginLoading), data));
                    });
                } catch (e) {
                    if (!((obj = e) instanceof Error && "code" in obj && [
                        "string",
                        "undefined"
                    ].includes(typeof obj.code)) || "MODULE_NOT_FOUND" !== e.code) throw e;
                }
            }
        }
    }
    function normalizePath(path) {
        return path.replace(/\?.*$/, "").split(external_node_path_namespaceObject.sep).join("/");
    }
    let SwcJsMinimizerRspackPlugin = base_create(binding_.BuiltinPluginName.SwcJsMinimizerRspackPlugin, (options)=>{
        let compress = options?.minimizerOptions?.compress ?? !0, mangle = options?.minimizerOptions?.mangle ?? !0, ecma = options?.minimizerOptions?.ecma ?? 5, format = {
            comments: !1,
            ...options?.minimizerOptions?.format
        };
        return compress && "object" == typeof compress ? compress = {
            passes: 2,
            ...compress
        } : compress && (compress = {
            passes: 2
        }), {
            test: options?.test,
            include: options?.include,
            exclude: options?.exclude,
            extractComments: function(extractComments) {
                var value;
                let type, conditionStr = (condition)=>{
                    if (void 0 === condition || !0 === condition) return "@preserve|@lic|@cc_on|^\\**!";
                    if (!1 === condition) throw Error("unreachable");
                    return condition.source;
                };
                if ("boolean" == typeof extractComments) {
                    if (!extractComments) return;
                    return {
                        condition: conditionStr(extractComments)
                    };
                }
                if (extractComments instanceof RegExp) return {
                    condition: extractComments.source
                };
                if (type = typeof (value = extractComments), null != value && ("object" === type || "function" === type)) {
                    if (!1 === extractComments.condition) return;
                    return {
                        condition: conditionStr(extractComments.condition),
                        banner: extractComments.banner
                    };
                }
            }(options?.extractComments),
            minimizerOptions: {
                compress,
                mangle,
                ecma,
                format,
                minify: options?.minimizerOptions?.minify,
                module: options?.minimizerOptions?.module
            }
        };
    }, "compilation"), URLPlugin = base_create(binding_.BuiltinPluginName.URLPlugin, ()=>{}, "compilation"), WarnCaseSensitiveModulesPlugin = base_create(binding_.BuiltinPluginName.WarnCaseSensitiveModulesPlugin, ()=>{}, "compilation");
    class WebWorkerTemplatePlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.WebWorkerTemplatePlugin;
        raw(compiler) {
            return compiler.options.output.chunkLoading = "import-scripts", createBuiltinPlugin(this.name, void 0);
        }
    }
    class WorkerPlugin extends RspackBuiltinPlugin {
        chunkLoading;
        wasmLoading;
        module;
        workerPublicPath;
        name = binding_.BuiltinPluginName.WorkerPlugin;
        constructor(chunkLoading, wasmLoading, module1, workerPublicPath){
            super(), this.chunkLoading = chunkLoading, this.wasmLoading = wasmLoading, this.module = module1, this.workerPublicPath = workerPublicPath;
        }
        raw(compiler) {
            return this.chunkLoading && new EnableChunkLoadingPlugin(this.chunkLoading).apply(compiler), this.wasmLoading && new EnableWasmLoadingPlugin(this.wasmLoading).apply(compiler), createBuiltinPlugin(this.name, void 0);
        }
    }
    class ContextModuleFactory {
        hooks;
        constructor(){
            this.hooks = {
                beforeResolve: new lite_tapable_namespaceObject.AsyncSeriesWaterfallHook([
                    "resolveData"
                ]),
                afterResolve: new lite_tapable_namespaceObject.AsyncSeriesWaterfallHook([
                    "resolveData"
                ])
            };
        }
    }
    let DELTA_A_TO_Z = 26, NUMBER_OF_IDENTIFIER_START_CHARS = 54, NUMBER_OF_IDENTIFIER_CONTINUATION_CHARS = 64, FUNCTION_CONTENT_REGEX = /^function\s?\(\)\s?\{\r?\n?|\r?\n?\}$/g, INDENT_MULTILINE_REGEX = /^\t/gm, LINE_SEPARATOR_REGEX = /\r?\n/g, IDENTIFIER_NAME_REPLACE_REGEX = /^([^a-zA-Z$_])/, IDENTIFIER_ALPHA_NUMERIC_NAME_REPLACE_REGEX = /[^a-zA-Z0-9$]+/g, COMMENT_END_REGEX = /\*\//g, PATH_NAME_NORMALIZE_REPLACE_REGEX = /[^a-zA-Z0-9_!§$()=\-^°]+/g, MATCH_PADDED_HYPHENS_REPLACE_REGEX = /^-|-$/g;
    class Template {
        static getFunctionContent(fn) {
            return fn.toString().replace(FUNCTION_CONTENT_REGEX, "").replace(INDENT_MULTILINE_REGEX, "").replace(LINE_SEPARATOR_REGEX, "\n");
        }
        static toIdentifier(str) {
            return "string" != typeof str ? "" : str.replace(IDENTIFIER_NAME_REPLACE_REGEX, "_$1").replace(IDENTIFIER_ALPHA_NUMERIC_NAME_REPLACE_REGEX, "_");
        }
        static toComment(str) {
            return str ? `/*! ${str.replace(COMMENT_END_REGEX, "* /")} */` : "";
        }
        static toNormalComment(str) {
            return str ? `/* ${str.replace(COMMENT_END_REGEX, "* /")} */` : "";
        }
        static toPath(str) {
            return "string" != typeof str ? "" : str.replace(PATH_NAME_NORMALIZE_REPLACE_REGEX, "-").replace(MATCH_PADDED_HYPHENS_REPLACE_REGEX, "");
        }
        static numberToIdentifier(num) {
            let n = num;
            return n >= NUMBER_OF_IDENTIFIER_START_CHARS ? Template.numberToIdentifier(n % NUMBER_OF_IDENTIFIER_START_CHARS) + Template.numberToIdentifierContinuation(Math.floor(n / NUMBER_OF_IDENTIFIER_START_CHARS)) : n < DELTA_A_TO_Z ? String.fromCharCode(97 + n) : (n -= DELTA_A_TO_Z) < DELTA_A_TO_Z ? String.fromCharCode(65 + n) : n === DELTA_A_TO_Z ? "_" : "$";
        }
        static numberToIdentifierContinuation(num) {
            let n = num;
            return n >= NUMBER_OF_IDENTIFIER_CONTINUATION_CHARS ? Template.numberToIdentifierContinuation(n % NUMBER_OF_IDENTIFIER_CONTINUATION_CHARS) + Template.numberToIdentifierContinuation(Math.floor(n / NUMBER_OF_IDENTIFIER_CONTINUATION_CHARS)) : n < DELTA_A_TO_Z ? String.fromCharCode(97 + n) : (n -= DELTA_A_TO_Z) < DELTA_A_TO_Z ? String.fromCharCode(65 + n) : (n -= DELTA_A_TO_Z) < 10 ? `${n}` : 10 === n ? "_" : "$";
        }
        static indent(s) {
            if (Array.isArray(s)) return s.map(Template.indent).join("\n");
            let str = s.trimEnd();
            return str ? ("\n" === str[0] ? "" : "\t") + str.replace(/\n([^\n])/g, "\n\t$1") : "";
        }
        static prefix(s, prefix) {
            let str = Template.asString(s).trim();
            return str ? ("\n" === str[0] ? "" : prefix) + str.replace(/\n([^\n])/g, `\n${prefix}$1`) : "";
        }
        static asString(str) {
            return Array.isArray(str) ? str.join("\n") : str;
        }
        static getModulesArrayBounds(modules) {
            let maxId = -1 / 0, minId = 1 / 0;
            for (let module1 of modules){
                let moduleId = module1.id;
                if ("number" != typeof moduleId) return !1;
                maxId < moduleId && (maxId = moduleId), minId > moduleId && (minId = moduleId);
            }
            minId < 16 + `${minId}`.length && (minId = 0);
            let objectOverhead = -1;
            for (let module1 of modules)objectOverhead += `${module1.id}`.length + 2;
            return (0 === minId ? maxId : 16 + `${minId}`.length + maxId) < objectOverhead && [
                minId,
                maxId
            ];
        }
    }
    function assertNotNill(value) {
        if (null == value) throw Error(`${value} should not be undefined or null`);
    }
    let DYNAMIC_INFO = Symbol("cleverMerge dynamic info"), mergeCache = new WeakMap(), DELETE = Symbol("DELETE"), cachedCleverMerge = (first, second)=>{
        if (void 0 === second) return first;
        if (void 0 === first || "object" != typeof second || null === second) return second;
        if ("object" != typeof first || null === first) return first;
        let innerCache = mergeCache.get(first);
        void 0 === innerCache && (innerCache = new WeakMap(), mergeCache.set(first, innerCache));
        let prevMerge = innerCache.get(second);
        if (void 0 !== prevMerge) return prevMerge;
        let newMerge = _cleverMerge(first, second, !0);
        return innerCache.set(second, newMerge), newMerge;
    }, parseCache = new WeakMap(), cachedParseObject = (obj)=>{
        let entry = parseCache.get(obj);
        if (void 0 !== entry) return entry;
        let result = parseObject(obj);
        return parseCache.set(obj, result), result;
    }, parseObject = (obj)=>{
        let dynamicInfo, info = new Map(), getInfo = (p)=>{
            let entry = info.get(p);
            if (void 0 !== entry) return entry;
            let newEntry = {
                base: void 0,
                byProperty: void 0,
                byValues: new Map()
            };
            return info.set(p, newEntry), newEntry;
        };
        for (let key of Object.keys(obj))if (key.startsWith("by")) {
            let byObj = obj[key];
            if ("object" == typeof byObj) for (let byValue of Object.keys(byObj)){
                let obj = byObj[byValue];
                for (let key1 of Object.keys(obj)){
                    let entry = getInfo(key1);
                    if (void 0 === entry.byProperty) entry.byProperty = key;
                    else if (entry.byProperty !== key) throw Error(`${key} and ${entry.byProperty} for a single property is not supported`);
                    if (entry.byValues.set(byValue, obj[key1]), "default" === byValue) for (let otherByValue of Object.keys(byObj))entry.byValues.has(otherByValue) || entry.byValues.set(otherByValue, void 0);
                }
            }
            else if ("function" == typeof byObj) if (void 0 === dynamicInfo) dynamicInfo = {
                byProperty: key,
                fn: byObj
            };
            else throw Error(`${key} and ${dynamicInfo.byProperty} when both are functions is not supported`);
            else getInfo(key).base = obj[key];
        } else getInfo(key).base = obj[key];
        return {
            static: info,
            dynamic: dynamicInfo
        };
    }, cleverMerge_serializeObject = (info, dynamicInfo)=>{
        let obj = {};
        for (let entry of info.values())if (void 0 !== entry.byProperty) {
            let byObj = obj[entry.byProperty] = obj[entry.byProperty] || {};
            for (let byValue of entry.byValues.keys())byObj[byValue] = byObj[byValue] || {};
        }
        for (let [key, entry] of info)if (void 0 !== entry.base && (obj[key] = entry.base), void 0 !== entry.byProperty) {
            let byObj = obj[entry.byProperty] = obj[entry.byProperty] || {};
            for (let byValue of Object.keys(byObj)){
                let value = getFromByValues(entry.byValues, byValue);
                void 0 !== value && (byObj[byValue][key] = value);
            }
        }
        return void 0 !== dynamicInfo && (obj[dynamicInfo.byProperty] = dynamicInfo.fn), obj;
    }, getValueType = (value)=>void 0 === value ? 0 : value === DELETE ? 4 : Array.isArray(value) ? -1 !== value.lastIndexOf("...") ? 2 : 1 : "object" != typeof value || null === value || value.constructor && value.constructor !== Object ? 1 : 3, cleverMerge = (first, second)=>void 0 === second ? first : void 0 === first || "object" != typeof second || null === second ? second : "object" != typeof first || null === first ? first : _cleverMerge(first, second, !1), _cleverMerge = (first, second, internalCaching = !1)=>{
        let firstObject = internalCaching ? cachedParseObject(first) : parseObject(first), { static: firstInfo, dynamic: firstDynamicInfo } = firstObject, secondObj = second;
        if (void 0 !== firstDynamicInfo) {
            let { byProperty, fn } = firstDynamicInfo, fnInfo = fn[DYNAMIC_INFO];
            fnInfo && (secondObj = internalCaching ? cachedCleverMerge(fnInfo[1], second) : cleverMerge(fnInfo[1], second), fn = fnInfo[0]);
            let newFn = (...args)=>{
                let fnResult = fn(...args);
                return internalCaching ? cachedCleverMerge(fnResult, secondObj) : cleverMerge(fnResult, secondObj);
            };
            return newFn[DYNAMIC_INFO] = [
                fn,
                secondObj
            ], cleverMerge_serializeObject(firstObject.static, {
                byProperty,
                fn: newFn
            });
        }
        let { static: secondInfo, dynamic: secondDynamicInfo } = internalCaching ? cachedParseObject(second) : parseObject(second), resultInfo = new Map();
        for (let [key, firstEntry] of firstInfo){
            let secondEntry = secondInfo.get(key), entry = void 0 !== secondEntry ? mergeEntries(firstEntry, secondEntry, internalCaching) : firstEntry;
            resultInfo.set(key, entry);
        }
        for (let [key, secondEntry] of secondInfo)firstInfo.has(key) || resultInfo.set(key, secondEntry);
        return cleverMerge_serializeObject(resultInfo, secondDynamicInfo);
    }, mergeEntries = (firstEntry, secondEntry, internalCaching)=>{
        switch(getValueType(secondEntry.base)){
            case 1:
            case 4:
                return secondEntry;
            case 0:
                {
                    if (!firstEntry.byProperty) return {
                        base: firstEntry.base,
                        byProperty: secondEntry.byProperty,
                        byValues: secondEntry.byValues
                    };
                    if (firstEntry.byProperty !== secondEntry.byProperty) throw Error(`${firstEntry.byProperty} and ${secondEntry.byProperty} for a single property is not supported`);
                    let newByValues = new Map(firstEntry.byValues);
                    for (let [key, value] of secondEntry.byValues){
                        let firstValue = getFromByValues(firstEntry.byValues, key);
                        newByValues.set(key, mergeSingleValue(firstValue, value, internalCaching));
                    }
                    return {
                        base: firstEntry.base,
                        byProperty: firstEntry.byProperty,
                        byValues: newByValues
                    };
                }
            default:
                {
                    let newBase;
                    if (!firstEntry.byProperty) return {
                        base: mergeSingleValue(firstEntry.base, secondEntry.base, internalCaching),
                        byProperty: secondEntry.byProperty,
                        byValues: secondEntry.byValues
                    };
                    let intermediateByValues = new Map(firstEntry.byValues);
                    for (let [key, value] of intermediateByValues)intermediateByValues.set(key, mergeSingleValue(value, secondEntry.base, internalCaching));
                    if (Array.from(firstEntry.byValues.values()).every((value)=>{
                        let type = getValueType(value);
                        return 1 === type || 4 === type;
                    }) ? newBase = mergeSingleValue(firstEntry.base, secondEntry.base, internalCaching) : (newBase = firstEntry.base, intermediateByValues.has("default") || intermediateByValues.set("default", secondEntry.base)), !secondEntry.byProperty) return {
                        base: newBase,
                        byProperty: firstEntry.byProperty,
                        byValues: intermediateByValues
                    };
                    if (firstEntry.byProperty !== secondEntry.byProperty) throw Error(`${firstEntry.byProperty} and ${secondEntry.byProperty} for a single property is not supported`);
                    let newByValues = new Map(intermediateByValues);
                    for (let [key, value] of secondEntry.byValues){
                        let firstValue = getFromByValues(intermediateByValues, key);
                        newByValues.set(key, mergeSingleValue(firstValue, value, internalCaching));
                    }
                    return {
                        base: newBase,
                        byProperty: firstEntry.byProperty,
                        byValues: newByValues
                    };
                }
        }
    }, getFromByValues = (byValues, key)=>"default" !== key && byValues.has(key) ? byValues.get(key) : byValues.get("default"), mergeSingleValue = (a, b, internalCaching)=>{
        let bType = getValueType(b), aType = getValueType(a);
        switch(bType){
            case 4:
            case 1:
                return b;
            case 3:
                return 3 !== aType ? b : internalCaching ? cachedCleverMerge(a, b) : cleverMerge(a, b);
            case 0:
                return a;
            case 2:
                switch(1 !== aType ? aType : Array.isArray(a) ? 2 : 3){
                    case 0:
                        return b;
                    case 4:
                        return b.filter((item)=>"..." !== item);
                    case 2:
                        {
                            let newArray = [];
                            for (let item of b)if ("..." === item) for (let item of a)newArray.push(item);
                            else newArray.push(item);
                            return newArray;
                        }
                    case 3:
                        return b.map((item)=>"..." === item ? a : item);
                    default:
                        throw Error("Not implemented");
                }
            default:
                throw Error("Not implemented");
        }
    }, browserslistTargetHandler_resolve = (browsers)=>{
        let rawChecker = (versions)=>browsers.every((v)=>{
                let [name, parsedVersion] = v.split(" ");
                if (!name) return !1;
                let requiredVersion = versions[name];
                if (!requiredVersion) return !1;
                let [parsedMajor, parserMinor] = "TP" === parsedVersion ? [
                    1 / 0,
                    1 / 0
                ] : parsedVersion.includes("-") ? parsedVersion.split("-")[0].split(".") : parsedVersion.split(".");
                return "number" == typeof requiredVersion ? +parsedMajor >= requiredVersion : requiredVersion[0] === +parsedMajor ? +parserMinor >= requiredVersion[1] : +parsedMajor > requiredVersion[0];
            }), anyNode = browsers.some((b)=>b.startsWith("node ")), anyBrowser = browsers.some((b)=>/^(?!node)/.test(b)), browserProperty = !!anyBrowser && (!anyNode || null), nodeProperty = !!anyNode && (!anyBrowser || null), es6DynamicImport = rawChecker({
            chrome: 63,
            and_chr: 63,
            edge: 79,
            firefox: 67,
            and_ff: 67,
            opera: 50,
            op_mob: 46,
            safari: [
                11,
                1
            ],
            ios_saf: [
                11,
                3
            ],
            samsung: [
                8,
                2
            ],
            android: 63,
            and_qq: [
                10,
                4
            ],
            baidu: [
                13,
                18
            ],
            and_uc: [
                15,
                5
            ],
            kaios: [
                3,
                0
            ],
            node: [
                12,
                17
            ]
        });
        return {
            const: rawChecker({
                chrome: 49,
                and_chr: 49,
                edge: 12,
                firefox: 36,
                and_ff: 36,
                opera: 36,
                op_mob: 36,
                safari: [
                    10,
                    0
                ],
                ios_saf: [
                    10,
                    0
                ],
                samsung: [
                    5,
                    0
                ],
                android: 37,
                and_qq: [
                    10,
                    4
                ],
                baidu: [
                    13,
                    18
                ],
                and_uc: [
                    12,
                    12
                ],
                kaios: [
                    2,
                    5
                ],
                node: [
                    6,
                    0
                ]
            }),
            methodShorthand: rawChecker({
                chrome: 47,
                and_chr: 47,
                edge: 12,
                firefox: 34,
                and_ff: 34,
                opera: 34,
                op_mob: 34,
                safari: 9,
                ios_saf: 9,
                samsung: 5,
                android: 47,
                and_qq: [
                    14,
                    9
                ],
                and_uc: [
                    15,
                    5
                ],
                kaios: [
                    2,
                    5
                ],
                node: [
                    4,
                    9
                ]
            }),
            arrowFunction: rawChecker({
                chrome: 45,
                and_chr: 45,
                edge: 12,
                firefox: 39,
                and_ff: 39,
                opera: 32,
                op_mob: 32,
                safari: 10,
                ios_saf: 10,
                samsung: [
                    5,
                    0
                ],
                android: 45,
                and_qq: [
                    10,
                    4
                ],
                baidu: [
                    7,
                    12
                ],
                and_uc: [
                    12,
                    12
                ],
                kaios: [
                    2,
                    5
                ],
                node: [
                    6,
                    0
                ]
            }),
            forOf: rawChecker({
                chrome: 38,
                and_chr: 38,
                edge: 12,
                firefox: 51,
                and_ff: 51,
                opera: 25,
                op_mob: 25,
                safari: 7,
                ios_saf: 7,
                samsung: [
                    3,
                    0
                ],
                android: 38,
                kaios: [
                    3,
                    0
                ],
                node: [
                    0,
                    12
                ]
            }),
            destructuring: rawChecker({
                chrome: 49,
                and_chr: 49,
                edge: 14,
                firefox: 41,
                and_ff: 41,
                opera: 36,
                op_mob: 36,
                safari: 8,
                ios_saf: 8,
                samsung: [
                    5,
                    0
                ],
                android: 49,
                kaios: [
                    2,
                    5
                ],
                node: [
                    6,
                    0
                ]
            }),
            bigIntLiteral: rawChecker({
                chrome: 67,
                and_chr: 67,
                edge: 79,
                firefox: 68,
                and_ff: 68,
                opera: 54,
                op_mob: 48,
                safari: 14,
                ios_saf: 14,
                samsung: [
                    9,
                    2
                ],
                android: 67,
                and_qq: [
                    13,
                    1
                ],
                baidu: [
                    13,
                    18
                ],
                and_uc: [
                    15,
                    5
                ],
                kaios: [
                    3,
                    0
                ],
                node: [
                    10,
                    4
                ]
            }),
            module: rawChecker({
                chrome: 61,
                and_chr: 61,
                edge: 16,
                firefox: 60,
                and_ff: 60,
                opera: 48,
                op_mob: 45,
                safari: [
                    10,
                    1
                ],
                ios_saf: [
                    10,
                    3
                ],
                samsung: [
                    8,
                    0
                ],
                android: 61,
                and_qq: [
                    10,
                    4
                ],
                baidu: [
                    13,
                    18
                ],
                and_uc: [
                    15,
                    5
                ],
                kaios: [
                    3,
                    0
                ],
                node: [
                    12,
                    17
                ]
            }),
            dynamicImport: es6DynamicImport,
            dynamicImportInWorker: es6DynamicImport && !anyNode,
            globalThis: rawChecker({
                chrome: 71,
                and_chr: 71,
                edge: 79,
                firefox: 65,
                and_ff: 65,
                opera: 58,
                op_mob: 50,
                safari: [
                    12,
                    1
                ],
                ios_saf: [
                    12,
                    2
                ],
                samsung: [
                    10,
                    1
                ],
                android: 71,
                kaios: [
                    3,
                    0
                ],
                node: 12
            }),
            optionalChaining: rawChecker({
                chrome: 80,
                and_chr: 80,
                edge: 80,
                firefox: 74,
                and_ff: 79,
                opera: 67,
                op_mob: 64,
                safari: [
                    13,
                    1
                ],
                ios_saf: [
                    13,
                    4
                ],
                samsung: 13,
                android: 80,
                kaios: [
                    3,
                    0
                ],
                node: 14
            }),
            templateLiteral: rawChecker({
                chrome: 41,
                and_chr: 41,
                edge: 13,
                firefox: 34,
                and_ff: 34,
                opera: 29,
                op_mob: 64,
                safari: [
                    9,
                    1
                ],
                ios_saf: 9,
                samsung: 4,
                android: 41,
                and_qq: [
                    10,
                    4
                ],
                baidu: [
                    7,
                    12
                ],
                and_uc: [
                    12,
                    12
                ],
                kaios: [
                    2,
                    5
                ],
                node: 4
            }),
            asyncFunction: rawChecker({
                chrome: 55,
                and_chr: 55,
                edge: 15,
                firefox: 52,
                and_ff: 52,
                opera: 42,
                op_mob: 42,
                safari: 11,
                ios_saf: 11,
                samsung: [
                    6,
                    2
                ],
                android: 55,
                and_qq: [
                    13,
                    1
                ],
                baidu: [
                    13,
                    18
                ],
                and_uc: [
                    15,
                    5
                ],
                kaios: 3,
                node: [
                    7,
                    6
                ]
            }),
            browser: browserProperty,
            electron: !1,
            node: nodeProperty,
            nwjs: !1,
            web: browserProperty,
            webworker: !1,
            document: browserProperty,
            fetchWasm: browserProperty,
            global: nodeProperty,
            importScripts: !1,
            importScriptsInWorker: !0,
            nodeBuiltins: nodeProperty,
            nodePrefixForCoreModules: nodeProperty && !browsers.some((b)=>b.startsWith("node 15")) && rawChecker({
                node: [
                    14,
                    18
                ]
            }),
            require: nodeProperty
        };
    }, getBrowserslistTargetHandler = memoize(()=>browserslistTargetHandler_namespaceObject), hasBrowserslistConfig = (context)=>{
        let { findConfig } = __webpack_require__("browserslist-load-config");
        return !!findConfig(context);
    }, versionDependent = (major, minor)=>{
        if (!major) return ()=>void 0;
        let nMajor = +major, nMinor = minor ? +minor : 0;
        return (vMajor, vMinor = 0)=>nMajor > vMajor || nMajor === vMajor && nMinor >= vMinor;
    }, TARGETS = [
        [
            "browserslist / browserslist:env / browserslist:query / browserslist:path-to-config / browserslist:path-to-config:env",
            "Resolve features from browserslist. Will resolve browserslist config automatically. Only browser or node queries are supported (electron is not supported). Examples: 'browserslist:modern' to use 'modern' environment from browserslist config",
            /^browserslist(?::(.+))?$/,
            (rest, context)=>{
                let inlineQuery = rest ? rest.trim() : null, browsers = binding_default().loadBrowserslist(inlineQuery, context);
                if (!browsers || !inlineQuery && !hasBrowserslistConfig(context) && !process.env.BROWSERSLIST) throw Error(`No browserslist config found to handle the 'browserslist' target.
See https://github.com/browserslist/browserslist#queries for possible ways to provide a config.
The recommended way is to add a 'browserslist' key to your package.json and list supported browsers (resp. node.js versions).
You can also more options via the 'target' option: 'browserslist' / 'browserslist:env' / 'browserslist:query' / 'browserslist:path-to-config' / 'browserslist:path-to-config:env'`);
                if (Array.isArray(browsers) && 0 === browsers.length) throw Error("Rspack cannot parse the browserslist query. This may happen when the query contains version requirements that exceed the supported range in the browserslist-rs database. Check your browserslist configuration for invalid version numbers.");
                return getBrowserslistTargetHandler().resolve(browsers);
            }
        ],
        [
            "web",
            "Web browser.",
            /^web$/,
            ()=>({
                    web: !0,
                    browser: !0,
                    webworker: null,
                    node: !1,
                    electron: !1,
                    nwjs: !1,
                    document: !0,
                    importScriptsInWorker: !0,
                    fetchWasm: !0,
                    nodeBuiltins: !1,
                    importScripts: !1,
                    require: !1,
                    global: !1
                })
        ],
        [
            "webworker",
            "Web Worker, SharedWorker or Service Worker.",
            /^webworker$/,
            ()=>({
                    web: !0,
                    browser: !0,
                    webworker: !0,
                    node: !1,
                    electron: !1,
                    nwjs: !1,
                    importScripts: !0,
                    importScriptsInWorker: !0,
                    fetchWasm: !0,
                    nodeBuiltins: !1,
                    require: !1,
                    document: !1,
                    global: !1
                })
        ],
        [
            "[async-]node[X[.Y]]",
            "Node.js in version X.Y. The 'async-' prefix will load chunks asynchronously via 'fs' and 'vm' instead of 'require()'. Examples: node14.5, async-node10.",
            /^(async-)?node((\d+)(?:\.(\d+))?)?$/,
            (asyncFlag, _, major, minor)=>{
                let v = versionDependent(major, minor);
                return {
                    node: !0,
                    electron: !1,
                    nwjs: !1,
                    web: !1,
                    webworker: !1,
                    browser: !1,
                    require: !asyncFlag,
                    nodeBuiltins: !0,
                    nodePrefixForCoreModules: 15 > +major ? v(14, 18) : v(16),
                    global: !0,
                    document: !1,
                    fetchWasm: !1,
                    importScripts: !1,
                    importScriptsInWorker: !1,
                    globalThis: v(12),
                    const: v(6),
                    templateLiteral: v(4),
                    optionalChaining: v(14),
                    methodShorthand: v(4),
                    arrowFunction: v(6),
                    asyncFunction: v(7, 6),
                    forOf: v(5),
                    destructuring: v(6),
                    bigIntLiteral: v(10, 4),
                    dynamicImport: v(12, 17),
                    dynamicImportInWorker: !major && void 0,
                    module: v(12, 17)
                };
            }
        ],
        [
            "electron[X[.Y]]-main/preload/renderer",
            "Electron in version X.Y. Script is running in main, preload resp. renderer context.",
            /^electron((\d+)(?:\.(\d+))?)?-(main|preload|renderer)$/,
            (_, major, minor, context)=>{
                let v = versionDependent(major, minor);
                return {
                    node: !0,
                    electron: !0,
                    web: "main" !== context,
                    webworker: !1,
                    browser: !1,
                    nwjs: !1,
                    electronMain: "main" === context,
                    electronPreload: "preload" === context,
                    electronRenderer: "renderer" === context,
                    global: !0,
                    nodeBuiltins: !0,
                    nodePrefixForCoreModules: v(15),
                    require: !0,
                    document: "renderer" === context,
                    fetchWasm: "renderer" === context,
                    importScripts: !1,
                    importScriptsInWorker: !0,
                    globalThis: v(5),
                    const: v(1, 1),
                    templateLiteral: v(1, 1),
                    optionalChaining: v(8),
                    methodShorthand: v(1, 1),
                    arrowFunction: v(1, 1),
                    asyncFunction: v(1, 7),
                    forOf: v(0, 36),
                    destructuring: v(1, 1),
                    bigIntLiteral: v(4),
                    dynamicImport: v(11),
                    dynamicImportInWorker: !major && void 0,
                    module: v(11)
                };
            }
        ],
        [
            "nwjs[X[.Y]] / node-webkit[X[.Y]]",
            "NW.js in version X.Y.",
            /^(?:nwjs|node-webkit)((\d+)(?:\.(\d+))?)?$/,
            (_, major, minor)=>{
                let v = versionDependent(major, minor);
                return {
                    node: !0,
                    web: !0,
                    nwjs: !0,
                    webworker: null,
                    browser: !1,
                    electron: !1,
                    global: !0,
                    nodeBuiltins: !0,
                    document: !1,
                    importScriptsInWorker: !1,
                    fetchWasm: !1,
                    importScripts: !1,
                    require: !1,
                    globalThis: v(0, 43),
                    const: v(0, 15),
                    templateLiteral: v(0, 13),
                    optionalChaining: v(0, 44),
                    methodShorthand: v(0, 15),
                    arrowFunction: v(0, 15),
                    asyncFunction: v(0, 21),
                    forOf: v(0, 13),
                    destructuring: v(0, 15),
                    bigIntLiteral: v(0, 32),
                    dynamicImport: v(0, 43),
                    dynamicImportInWorker: !major && void 0,
                    module: v(0, 43)
                };
            }
        ],
        [
            "esX",
            "EcmaScript in this version. Examples: es2020, es5.",
            /^es(\d+)$/,
            (version)=>{
                let v = +version;
                return v < 1000 && (v += 2009), {
                    const: v >= 2015,
                    templateLiteral: v >= 2015,
                    optionalChaining: v >= 2020,
                    methodShorthand: v >= 2015,
                    arrowFunction: v >= 2015,
                    forOf: v >= 2015,
                    destructuring: v >= 2015,
                    module: v >= 2015,
                    asyncFunction: v >= 2017,
                    globalThis: v >= 2020,
                    bigIntLiteral: v >= 2020,
                    dynamicImport: v >= 2020,
                    dynamicImportInWorker: v >= 2020
                };
            }
        ]
    ], getTargetProperties = (target, context)=>{
        for (let [, , regExp, handler] of TARGETS){
            let match = regExp.exec(target);
            if (match) {
                let [, ...args] = match, result = handler(...args, context);
                if (result) return result;
            }
        }
        throw Error(`Unknown target '${target}'. The following targets are supported:\n${TARGETS.map(([name, description])=>`* ${name}: ${description}`).join("\n")}`);
    }, applyRspackOptionsDefaults = (options)=>{
        let targets, context;
        F(options, "context", ()=>process.cwd()), F(options, "target", ()=>hasBrowserslistConfig(options.context) ? "browserslist" : "web");
        let { mode, target } = options;
        if (isNil(target)) throw Error("target should not be nil after defaults");
        let targetProperties = !1 !== target && ("string" == typeof target ? getTargetProperties(target, options.context) : (targets = target, context = options.context, ((targetProperties)=>{
            let keys = new Set();
            for (let tp of targetProperties)for (let key of Object.keys(tp))keys.add(key);
            let result = {};
            for (let key of keys){
                let hasTrue = !1, hasFalse = !1;
                for (let tp of targetProperties)switch(tp[key]){
                    case !0:
                        hasTrue = !0;
                        break;
                    case !1:
                        hasFalse = !0;
                }
                (hasTrue || hasFalse) && (result[key] = hasFalse && hasTrue ? null : hasTrue);
            }
            return result;
        })(targets.map((t)=>getTargetProperties(t, context))))), development = "development" === mode, production = "production" === mode || !mode;
        if ("function" != typeof options.entry) for (let key of Object.keys(options.entry))F(options.entry[key], "import", ()=>[
                "./src"
            ]);
        F(options, "devtool", ()=>!!development && "eval"), D(options, "watch", !1), D(options, "profile", !1), D(options, "lazyCompilation", !1), D(options, "bail", !1), F(options, "cache", ()=>development), !1 === options.cache && (options.experiments.cache = !1), applyExperimentsDefaults(options.experiments, {
            development
        }), applyOptimizationDefaults(options.optimization, {
            production,
            development,
            css: options.experiments.css
        }), applySnapshotDefaults(options.snapshot, {
            production
        }), applyModuleDefaults(options.module, {
            cache: !!options.cache,
            asyncWebAssembly: options.experiments.asyncWebAssembly,
            css: options.experiments.css,
            targetProperties,
            mode: options.mode,
            uniqueName: options.output.uniqueName,
            usedExports: !!options.optimization.usedExports,
            inlineConst: options.experiments.inlineConst,
            deferImport: options.experiments.deferImport
        }), applyOutputDefaults(options.output, {
            context: options.context,
            targetProperties,
            isAffectedByBrowserslist: void 0 === target || "string" == typeof target && target.startsWith("browserslist") || Array.isArray(target) && target.some((target)=>target.startsWith("browserslist")),
            outputModule: options.experiments.outputModule,
            development,
            entry: options.entry,
            futureDefaults: options.experiments.futureDefaults
        }), applybundlerInfoDefaults(options.experiments.rspackFuture, options.output.library), applyExternalsPresetsDefaults(options.externalsPresets, {
            targetProperties,
            buildHttp: !!options.experiments.buildHttp
        }), F(options, "externalsType", ()=>options.output.library ? options.output.library.type : options.output.module ? "module-import" : "var"), applyNodeDefaults(options.node, {
            targetProperties,
            outputModule: options.output.module
        }), applyLoaderDefaults(options.loader, {
            targetProperties,
            environment: options.output.environment
        }), F(options, "performance", ()=>!!production && !!targetProperties && (!!targetProperties.browser || null === targetProperties.browser) && {}), applyPerformanceDefaults(options.performance, {
            production
        }), options.resolve = cleverMerge(getResolveDefaults({
            context: options.context,
            targetProperties,
            mode: options.mode,
            css: options.experiments.css
        }), options.resolve), options.resolveLoader = cleverMerge(getResolveLoaderDefaults(), options.resolveLoader);
    }, applyInfrastructureLoggingDefaults = (infrastructureLogging)=>{
        F(infrastructureLogging, "stream", ()=>process.stderr);
        let tty = infrastructureLogging.stream?.isTTY && "dumb" !== process.env.TERM;
        D(infrastructureLogging, "level", "info"), D(infrastructureLogging, "debug", !1), D(infrastructureLogging, "colors", tty), D(infrastructureLogging, "appendOnly", !tty);
    }, applyExperimentsDefaults = (experiments, { development })=>{
        F(experiments, "cache", ()=>development), D(experiments, "futureDefaults", !1), D(experiments, "lazyCompilation", !1), D(experiments, "asyncWebAssembly", experiments.futureDefaults), D(experiments, "css", !!experiments.futureDefaults || void 0), D(experiments, "topLevelAwait", !0), D(experiments, "deferImport", !1), D(experiments, "buildHttp", void 0), experiments.buildHttp && "object" == typeof experiments.buildHttp && D(experiments.buildHttp, "upgrade", !1), D(experiments, "incremental", {}), "object" == typeof experiments.incremental && (D(experiments.incremental, "silent", !0), D(experiments.incremental, "make", !0), D(experiments.incremental, "inferAsyncModules", !0), D(experiments.incremental, "providedExports", !0), D(experiments.incremental, "dependenciesDiagnostics", !0), D(experiments.incremental, "sideEffects", !0), D(experiments.incremental, "buildChunkGraph", !1), D(experiments.incremental, "moduleIds", !0), D(experiments.incremental, "chunkIds", !0), D(experiments.incremental, "modulesHashes", !0), D(experiments.incremental, "modulesCodegen", !0), D(experiments.incremental, "modulesRuntimeRequirements", !0), D(experiments.incremental, "chunksRuntimeRequirements", !0), D(experiments.incremental, "chunksHashes", !0), D(experiments.incremental, "chunksRender", !0), D(experiments.incremental, "emitAssets", !0)), D(experiments, "rspackFuture", {}), D(experiments, "parallelCodeSplitting", !1), D(experiments, "parallelLoader", !1), D(experiments, "useInputFileSystem", !1), D(experiments, "inlineConst", !1), D(experiments, "inlineEnum", !1), D(experiments, "typeReexportsPresence", !1), D(experiments, "lazyBarrel", !0);
    }, applybundlerInfoDefaults = (rspackFuture, library)=>{
        "object" == typeof rspackFuture && (D(rspackFuture, "bundlerInfo", {}), "object" == typeof rspackFuture.bundlerInfo && (D(rspackFuture.bundlerInfo, "version", "1.6.8"), D(rspackFuture.bundlerInfo, "bundler", "rspack"), D(rspackFuture.bundlerInfo, "force", !library)));
    }, applySnapshotDefaults = (_snapshot, _env)=>{}, applyModuleDefaults = (module1, { cache, asyncWebAssembly, css, targetProperties, mode, uniqueName, usedExports, inlineConst, deferImport })=>{
        if (assertNotNill(module1.parser), assertNotNill(module1.generator), cache ? D(module1, "unsafeCache", /[\\/]node_modules[\\/]/) : D(module1, "unsafeCache", !1), F(module1.parser, "asset", ()=>({})), assertNotNill(module1.parser.asset), F(module1.parser.asset, "dataUrlCondition", ()=>({})), "object" == typeof module1.parser.asset.dataUrlCondition && D(module1.parser.asset.dataUrlCondition, "maxSize", 8096), F(module1.parser, "javascript", ()=>({})), assertNotNill(module1.parser.javascript), ((parserOptions, { usedExports, inlineConst, deferImport })=>{
            D(parserOptions, "dynamicImportMode", "lazy"), D(parserOptions, "dynamicImportPrefetch", !1), D(parserOptions, "dynamicImportPreload", !1), D(parserOptions, "url", !0), D(parserOptions, "exprContextCritical", !0), D(parserOptions, "unknownContextCritical", !0), D(parserOptions, "wrappedContextCritical", !1), D(parserOptions, "wrappedContextRegExp", /.*/), D(parserOptions, "strictExportPresence", !1), D(parserOptions, "requireAsExpression", !0), D(parserOptions, "requireDynamic", !0), D(parserOptions, "requireResolve", !0), D(parserOptions, "commonjs", !0), D(parserOptions, "importDynamic", !0), D(parserOptions, "worker", [
                "..."
            ]), D(parserOptions, "importMeta", !0), D(parserOptions, "inlineConst", usedExports && inlineConst), D(parserOptions, "typeReexportsPresence", "no-tolerant"), D(parserOptions, "jsx", !1), D(parserOptions, "deferImport", deferImport);
        })(module1.parser.javascript, {
            usedExports,
            inlineConst,
            deferImport
        }), F(module1.parser, "json", ()=>({})), assertNotNill(module1.parser.json), D(module1.parser.json, "exportsDepth", "development" === mode ? 1 : Number.MAX_SAFE_INTEGER), F(module1.generator, "json", ()=>({})), assertNotNill(module1.generator.json), D(module1.generator.json, "JSONParse", !0), css) {
            F(module1.parser, "css", ()=>({})), assertNotNill(module1.parser.css), D(module1.parser.css, "namedExports", !0), D(module1.parser.css, "url", !0), F(module1.parser, "css/auto", ()=>({})), assertNotNill(module1.parser["css/auto"]), D(module1.parser["css/auto"], "namedExports", !0), D(module1.parser["css/auto"], "url", !0), F(module1.parser, "css/module", ()=>({})), assertNotNill(module1.parser["css/module"]), D(module1.parser["css/module"], "namedExports", !0), D(module1.parser["css/module"], "url", !0), F(module1.generator, "css", ()=>({})), assertNotNill(module1.generator.css), D(module1.generator.css, "exportsOnly", !targetProperties || !targetProperties.document), D(module1.generator.css, "esModule", !0), F(module1.generator, "css/auto", ()=>({})), assertNotNill(module1.generator["css/auto"]), D(module1.generator["css/auto"], "exportsOnly", !targetProperties || !targetProperties.document), D(module1.generator["css/auto"], "exportsConvention", "as-is");
            let localIdentName = uniqueName && uniqueName.length > 0 ? "[uniqueName]-[id]-[local]" : "[id]-[local]";
            D(module1.generator["css/auto"], "localIdentName", localIdentName), D(module1.generator["css/auto"], "esModule", !0), F(module1.generator, "css/module", ()=>({})), assertNotNill(module1.generator["css/module"]), D(module1.generator["css/module"], "exportsOnly", !targetProperties || !targetProperties.document), D(module1.generator["css/module"], "exportsConvention", "as-is"), D(module1.generator["css/module"], "localIdentName", localIdentName), D(module1.generator["css/module"], "esModule", !0);
        }
        A(module1, "defaultRules", ()=>{
            let esm = {
                type: "javascript/esm",
                resolve: {
                    byDependency: {
                        esm: {
                            fullySpecified: !0
                        }
                    }
                }
            }, commonjs = {
                type: "javascript/dynamic"
            }, rules = [
                {
                    mimetype: "application/node",
                    type: "javascript/auto"
                },
                {
                    test: /\.json$/i,
                    type: "json"
                },
                {
                    mimetype: "application/json",
                    type: "json"
                },
                {
                    test: /\.mjs$/i,
                    ...esm
                },
                {
                    test: /\.js$/i,
                    descriptionData: {
                        type: "module"
                    },
                    ...esm
                },
                {
                    test: /\.cjs$/i,
                    ...commonjs
                },
                {
                    test: /\.js$/i,
                    descriptionData: {
                        type: "commonjs"
                    },
                    ...commonjs
                },
                {
                    mimetype: {
                        or: [
                            "text/javascript",
                            "application/javascript"
                        ]
                    },
                    ...esm
                }
            ];
            if (asyncWebAssembly) {
                let wasm = {
                    type: "webassembly/async",
                    rules: [
                        {
                            descriptionData: {
                                type: "module"
                            },
                            resolve: {
                                fullySpecified: !0
                            }
                        }
                    ]
                };
                rules.push({
                    test: /\.wasm$/i,
                    ...wasm
                }), rules.push({
                    mimetype: "application/wasm",
                    ...wasm
                });
            }
            if (css) {
                let resolve = {
                    fullySpecified: !0,
                    preferRelative: !0
                };
                rules.push({
                    test: /\.css$/i,
                    type: "css/auto",
                    resolve
                }), rules.push({
                    mimetype: "text/css+module",
                    type: "css/module",
                    resolve
                }), rules.push({
                    mimetype: "text/css",
                    type: "css",
                    resolve
                });
            }
            return rules.push({
                dependency: "url",
                oneOf: [
                    {
                        scheme: /^data$/,
                        type: "asset/inline"
                    },
                    {
                        type: "asset/resource"
                    }
                ]
            }, {
                with: {
                    type: "json"
                },
                type: "json"
            }), rules;
        });
    }, applyOutputDefaults = (output, { context, outputModule, targetProperties: tp, isAffectedByBrowserslist, development, entry, futureDefaults })=>{
        let getLibraryName = (library)=>{
            let libraryName = "object" == typeof library && library && !Array.isArray(library) && "type" in library ? library.name : library;
            return Array.isArray(libraryName) ? libraryName.join(".") : "object" == typeof libraryName ? getLibraryName(libraryName.root) : "string" == typeof libraryName ? libraryName : "";
        };
        F(output, "uniqueName", ()=>{
            let libraryName = getLibraryName(output.library).replace(/^\[(\\*[\w:]+\\*)\](\.)|(\.)\[(\\*[\w:]+\\*)\](?=\.|$)|\[(\\*[\w:]+\\*)\]/g, (m, a, d1, d2, b, c)=>{
                let content = a || b || c;
                return content.startsWith("\\") && content.endsWith("\\") ? `${d2 || ""}[${content.slice(1, -1)}]${d1 || ""}` : "";
            });
            if (libraryName) return libraryName;
            let pkgPath = external_node_path_default().resolve(context, "package.json");
            try {
                return JSON.parse(external_node_fs_default().readFileSync(pkgPath, "utf-8")).name || "";
            } catch (err) {
                if ("ENOENT" !== err.code) throw err.message += `\nwhile determining default 'output.uniqueName' from 'name' in ${pkgPath}`, err;
                return "";
            }
        }), F(output, "devtoolNamespace", ()=>output.uniqueName), F(output, "module", ()=>!!outputModule);
        let environment = output.environment, conditionallyOptimistic = (v, c)=>void 0 === v && c || v;
        F(environment, "globalThis", ()=>tp?.globalThis), F(environment, "bigIntLiteral", ()=>{
            let v;
            return tp && ((v = tp.bigIntLiteral) || void 0 === v);
        }), F(environment, "const", ()=>{
            let v;
            return tp && ((v = tp.const) || void 0 === v);
        }), F(environment, "methodShorthand", ()=>{
            let v;
            return tp && ((v = tp.methodShorthand) || void 0 === v);
        }), F(environment, "arrowFunction", ()=>{
            let v;
            return tp && ((v = tp.arrowFunction) || void 0 === v);
        }), F(environment, "asyncFunction", ()=>{
            let v;
            return tp && ((v = tp.asyncFunction) || void 0 === v);
        }), F(environment, "forOf", ()=>{
            let v;
            return tp && ((v = tp.forOf) || void 0 === v);
        }), F(environment, "destructuring", ()=>{
            let v;
            return tp && ((v = tp.destructuring) || void 0 === v);
        }), F(environment, "optionalChaining", ()=>{
            let v;
            return tp && ((v = tp.optionalChaining) || void 0 === v);
        }), F(environment, "nodePrefixForCoreModules", ()=>{
            let v;
            return tp && ((v = tp.nodePrefixForCoreModules) || void 0 === v);
        }), F(environment, "templateLiteral", ()=>{
            let v;
            return tp && ((v = tp.templateLiteral) || void 0 === v);
        }), F(environment, "dynamicImport", ()=>conditionallyOptimistic(tp?.dynamicImport, output.module)), F(environment, "dynamicImportInWorker", ()=>conditionallyOptimistic(tp?.dynamicImportInWorker, output.module)), F(environment, "module", ()=>conditionallyOptimistic(tp?.module, output.module)), F(environment, "document", ()=>{
            let v;
            return tp && ((v = tp.document) || void 0 === v);
        }), D(output, "filename", output.module ? "[name].mjs" : "[name].js"), F(output, "iife", ()=>!output.module), F(output, "chunkFilename", ()=>{
            let filename = output.filename;
            if ("function" != typeof filename) {
                let hasName = filename.includes("[name]"), hasId = filename.includes("[id]"), hasChunkHash = filename.includes("[chunkhash]"), hasContentHash = filename.includes("[contenthash]");
                return hasChunkHash || hasContentHash || hasName || hasId ? filename : filename.replace(/(^|\/)([^/]*(?:\?|$))/, "$1[id].$2");
            }
            return "[id].js";
        }), F(output, "cssFilename", ()=>{
            let filename = output.filename;
            return "function" != typeof filename ? filename.replace(/\.[mc]?js(\?|$)/, ".css$1") : "[id].css";
        }), F(output, "cssChunkFilename", ()=>{
            let chunkFilename = output.chunkFilename;
            return "function" != typeof chunkFilename ? chunkFilename.replace(/\.[mc]?js(\?|$)/, ".css$1") : "[id].css";
        }), D(output, "hotUpdateChunkFilename", `[id].[fullhash].hot-update.${output.module ? "mjs" : "js"}`), F(output, "hotUpdateMainFilename", ()=>`[runtime].[fullhash].hot-update.${output.module ? "json.mjs" : "json"}`);
        let uniqueNameId = Template.toIdentifier(output.uniqueName);
        F(output, "hotUpdateGlobal", ()=>`webpackHotUpdate${uniqueNameId}`), F(output, "chunkLoadingGlobal", ()=>`webpackChunk${uniqueNameId}`), D(output, "assetModuleFilename", "[hash][ext][query]"), D(output, "webassemblyModuleFilename", "[hash].module.wasm"), D(output, "compareBeforeEmit", !0), F(output, "path", ()=>external_node_path_default().join(process.cwd(), "dist")), F(output, "pathinfo", ()=>!1), D(output, "publicPath", tp && (tp.document || tp.importScripts) ? "auto" : ""), D(output, "hashFunction", "xxhash64"), D(output, "hashDigest", "hex"), D(output, "hashDigestLength", 16), D(output, "strictModuleErrorHandling", !1), output.library && F(output.library, "type", ()=>output.module ? "module" : "var"), F(output, "chunkFormat", ()=>{
            if (tp) {
                let helpMessage = isAffectedByBrowserslist ? "Make sure that your 'browserslist' includes only platforms that support these features or select an appropriate 'target' to allow selecting a chunk format by default. Alternatively specify the 'output.chunkFormat' directly." : "Select an appropriate 'target' to allow selecting one by default, or specify the 'output.chunkFormat' directly.";
                if (output.module) {
                    if (environment.dynamicImport) return "module";
                    if (tp.document) return "array-push";
                    throw Error(`For the selected environment is no default ESM chunk format available:\nESM exports can be chosen when 'import()' is available.\nJSONP Array push can be chosen when 'document' is available.\n${helpMessage}`);
                }
                if (tp.document) return "array-push";
                if (tp.require || tp.nodeBuiltins) return "commonjs";
                if (tp.importScripts) return "array-push";
                throw Error(`For the selected environment is no default script chunk format available:\nJSONP Array push can be chosen when 'document' or 'importScripts' is available.\nCommonJs exports can be chosen when 'require' or node builtins are available.\n${helpMessage}`);
            }
            throw Error("Chunk format can't be selected by default when no target is specified");
        }), D(output, "asyncChunks", !0), F(output, "chunkLoading", ()=>{
            if (tp) {
                switch(output.chunkFormat){
                    case "array-push":
                        if (tp.document) return "jsonp";
                        if (tp.importScripts) return "import-scripts";
                        break;
                    case "commonjs":
                        if (tp.require) return "require";
                        if (tp.nodeBuiltins) return "async-node";
                        break;
                    case "module":
                        if (environment.dynamicImport) return "import";
                }
                if ((null === tp.require || null === tp.nodeBuiltins || null === tp.document || null === tp.importScripts) && output.module && environment.dynamicImport) return "universal";
            }
            return !1;
        }), F(output, "workerChunkLoading", ()=>{
            if (tp) {
                switch(output.chunkFormat){
                    case "array-push":
                        if (tp.importScriptsInWorker) return "import-scripts";
                        break;
                    case "commonjs":
                        if (tp.require) return "require";
                        if (tp.nodeBuiltins) return "async-node";
                        break;
                    case "module":
                        if (environment.dynamicImportInWorker) return "import";
                }
                if ((null === tp.require || null === tp.nodeBuiltins || null === tp.importScriptsInWorker) && output.module && environment.dynamicImport) return "universal";
            }
            return !1;
        }), F(output, "wasmLoading", ()=>{
            if (tp) {
                if (tp.fetchWasm) return "fetch";
                if (tp.nodeBuiltins) return "async-node";
                null === tp.nodeBuiltins || tp.fetchWasm;
            }
            return !1;
        }), F(output, "workerWasmLoading", ()=>output.wasmLoading), F(output, "globalObject", ()=>{
            if (tp) {
                if (tp.global) return "global";
                if (tp.globalThis) return "globalThis";
            }
            return "self";
        }), D(output, "importFunctionName", "import"), D(output, "importMetaName", "import.meta"), F(output, "clean", ()=>!!output.clean), D(output, "crossOriginLoading", !1), D(output, "workerPublicPath", ""), D(output, "sourceMapFilename", "[file].map[query]"), F(output, "scriptType", ()=>!!output.module && "module"), D(output, "charset", !1), D(output, "chunkLoadTimeout", 120000);
        let { trustedTypes } = output;
        trustedTypes && (F(trustedTypes, "policyName", ()=>output.uniqueName.replace(/[^a-zA-Z0-9\-#=_/@.%]+/g, "_") || "webpack"), D(trustedTypes, "onPolicyCreationFailure", "stop"));
        let forEachEntry = (fn)=>{
            if ("function" != typeof entry) for (let name of Object.keys(entry))fn(entry[name]);
        };
        A(output, "enabledLibraryTypes", ()=>{
            let enabledLibraryTypes = [];
            return output.library && enabledLibraryTypes.push(output.library.type), forEachEntry((desc)=>{
                desc.library && enabledLibraryTypes.push(desc.library.type);
            }), enabledLibraryTypes;
        }), A(output, "enabledChunkLoadingTypes", ()=>{
            let enabledChunkLoadingTypes = new Set();
            return output.chunkLoading && enabledChunkLoadingTypes.add(output.chunkLoading), output.workerChunkLoading && enabledChunkLoadingTypes.add(output.workerChunkLoading), forEachEntry((desc)=>{
                desc.chunkLoading && enabledChunkLoadingTypes.add(desc.chunkLoading);
            }), Array.from(enabledChunkLoadingTypes);
        }), A(output, "enabledWasmLoadingTypes", ()=>{
            let enabledWasmLoadingTypes = new Set();
            return output.wasmLoading && enabledWasmLoadingTypes.add(output.wasmLoading), output.workerWasmLoading && enabledWasmLoadingTypes.add(output.workerWasmLoading), Array.from(enabledWasmLoadingTypes);
        });
    }, applyExternalsPresetsDefaults = (externalsPresets, { targetProperties, buildHttp })=>{
        D(externalsPresets, "web", !buildHttp && targetProperties?.web), D(externalsPresets, "node", targetProperties?.node), D(externalsPresets, "electron", targetProperties?.electron), D(externalsPresets, "electronMain", targetProperties?.electron && targetProperties.electronMain), D(externalsPresets, "electronPreload", targetProperties?.electron && targetProperties.electronPreload), D(externalsPresets, "electronRenderer", targetProperties?.electron && targetProperties.electronRenderer), D(externalsPresets, "nwjs", targetProperties?.nwjs);
    }, applyLoaderDefaults = (loader, { targetProperties, environment })=>{
        F(loader, "target", ()=>{
            if (targetProperties) {
                if (targetProperties.electron) return targetProperties.electronMain ? "electron-main" : targetProperties.electronPreload ? "electron-preload" : targetProperties.electronRenderer ? "electron-renderer" : "electron";
                if (targetProperties.nwjs) return "nwjs";
                if (targetProperties.node) return "node";
                if (targetProperties.web) return "web";
            }
        }), D(loader, "environment", environment);
    }, applyNodeDefaults = (node, { outputModule, targetProperties })=>{
        !1 !== node && (F(node, "global", ()=>!targetProperties?.global && "warn"), F(node, "__dirname", ()=>targetProperties?.node ? outputModule ? "node-module" : "eval-only" : "warn-mock"), F(node, "__filename", ()=>targetProperties?.node ? outputModule ? "node-module" : "eval-only" : "warn-mock"));
    }, applyPerformanceDefaults = (performance, { production })=>{
        !1 !== performance && (D(performance, "maxAssetSize", 250000), D(performance, "maxEntrypointSize", 250000), F(performance, "hints", ()=>!!production && "warning"));
    }, applyOptimizationDefaults = (optimization, { production, development, css })=>{
        D(optimization, "removeAvailableModules", !0), D(optimization, "removeEmptyChunks", !0), D(optimization, "mergeDuplicateChunks", !0), F(optimization, "moduleIds", ()=>production ? "deterministic" : development ? "named" : "natural"), F(optimization, "chunkIds", ()=>production ? "deterministic" : development ? "named" : "natural"), F(optimization, "sideEffects", ()=>!!production || "flag"), D(optimization, "mangleExports", production), D(optimization, "providedExports", !0), D(optimization, "usedExports", production), D(optimization, "innerGraph", production), D(optimization, "emitOnErrors", !production), D(optimization, "runtimeChunk", !1), D(optimization, "realContentHash", production), D(optimization, "avoidEntryIife", !1), D(optimization, "minimize", production), D(optimization, "concatenateModules", production), A(optimization, "minimizer", ()=>[
                new SwcJsMinimizerRspackPlugin(),
                new LightningCssMinimizerRspackPlugin()
            ]), F(optimization, "nodeEnv", ()=>production ? "production" : !!development && "development");
        let { splitChunks } = optimization;
        if (splitChunks) {
            A(splitChunks, "defaultSizeTypes", ()=>css ? [
                    "javascript",
                    "css",
                    "unknown"
                ] : [
                    "javascript",
                    "unknown"
                ]), D(splitChunks, "hidePathInfo", production), D(splitChunks, "chunks", "async"), D(splitChunks, "usedExports", !0 === optimization.usedExports), D(splitChunks, "minChunks", 1), F(splitChunks, "minSize", ()=>production ? 20000 : 10000), F(splitChunks, "maxAsyncRequests", ()=>production ? 30 : 1 / 0), F(splitChunks, "maxInitialRequests", ()=>production ? 30 : 1 / 0), D(splitChunks, "automaticNameDelimiter", "-");
            let { cacheGroups } = splitChunks;
            cacheGroups && (F(cacheGroups, "default", ()=>({
                    idHint: "",
                    reuseExistingChunk: !0,
                    minChunks: 2,
                    priority: -20
                })), F(cacheGroups, "defaultVendors", ()=>({
                    idHint: "vendors",
                    reuseExistingChunk: !0,
                    test: /[\\/]node_modules[\\/]/i,
                    priority: -10
                })));
        }
    }, getResolveLoaderDefaults = ()=>({
            conditionNames: [
                "loader",
                "require",
                "node"
            ],
            exportsFields: [
                "exports"
            ],
            mainFields: [
                "loader",
                "main"
            ],
            extensions: [
                ".js"
            ],
            mainFiles: [
                "index"
            ]
        }), getResolveDefaults = ({ context, targetProperties, mode, css })=>{
        let conditions = [
            "webpack"
        ];
        conditions.push("development" === mode ? "development" : "production"), targetProperties && (targetProperties.webworker && conditions.push("worker"), targetProperties.node && conditions.push("node"), targetProperties.web && conditions.push("browser"), targetProperties.electron && conditions.push("electron"), targetProperties.nwjs && conditions.push("nwjs"));
        let jsExtensions = [
            ".js",
            ".json",
            ".wasm"
        ], browserField = targetProperties?.web && (!targetProperties.node || targetProperties.electron && targetProperties.electronRenderer), aliasFields = browserField ? [
            "browser"
        ] : [], mainFields = browserField ? [
            "browser",
            "module",
            "..."
        ] : [
            "module",
            "..."
        ], cjsDeps = ()=>({
                aliasFields,
                mainFields,
                conditionNames: [
                    "require",
                    "module",
                    "..."
                ],
                extensions: [
                    ...jsExtensions
                ]
            }), esmDeps = ()=>({
                aliasFields,
                mainFields,
                conditionNames: [
                    "import",
                    "module",
                    "..."
                ],
                extensions: [
                    ...jsExtensions
                ]
            }), resolveOptions = {
            pnp: getPnpDefault(),
            modules: [
                "node_modules"
            ],
            conditionNames: conditions,
            mainFiles: [
                "index"
            ],
            extensions: [],
            aliasFields: [],
            exportsFields: [
                "exports"
            ],
            roots: [
                context
            ],
            mainFields: [
                "main"
            ],
            importsFields: [
                "imports"
            ],
            byDependency: {
                wasm: esmDeps(),
                esm: esmDeps(),
                loaderImport: esmDeps(),
                url: {
                    preferRelative: !0
                },
                worker: {
                    ...esmDeps(),
                    preferRelative: !0
                },
                commonjs: cjsDeps(),
                amd: cjsDeps(),
                loader: cjsDeps(),
                unknown: cjsDeps()
            }
        };
        if (css) {
            let styleConditions = [];
            styleConditions.push("webpack"), styleConditions.push("development" === mode ? "development" : "production"), styleConditions.push("style"), resolveOptions.byDependency["css-import"] = {
                mainFiles: [],
                mainFields: [
                    "style",
                    "..."
                ],
                conditionNames: styleConditions,
                extensions: [
                    ".css"
                ],
                preferRelative: !0
            };
        }
        return resolveOptions;
    }, D = (obj, prop, value)=>{
        void 0 === obj[prop] && (obj[prop] = value);
    }, F = (obj, prop, factory)=>{
        void 0 === obj[prop] && (obj[prop] = factory());
    }, A = (obj, prop, factory)=>{
        let value = obj[prop];
        if (void 0 === value) obj[prop] = factory();
        else if (Array.isArray(value)) {
            let newArray;
            for(let i = 0; i < value.length; i++){
                let item = value[i];
                if ("..." === item) {
                    void 0 === newArray && (newArray = value.slice(0, i), obj[prop] = newArray);
                    let items = factory();
                    if (void 0 !== items) for (let item of items)newArray.push(item);
                } else void 0 !== newArray && newArray.push(item);
            }
        }
    }, getPnpDefault = ()=>!!process.versions.pnp, getNormalizedRspackOptions = (config)=>{
        let fn;
        return {
            ignoreWarnings: config.ignoreWarnings ? config.ignoreWarnings.map((ignore)=>{
                if ("function" == typeof ignore) return ignore;
                let i = ignore instanceof RegExp ? {
                    message: ignore
                } : ignore;
                return (warning)=>(!!i.message || !!i.module || !!i.file) && (!i.message || !!i.message.test(warning.message)) && (!i.module || !!warning.module && !!i.module.test(warning.module.readableIdentifier())) && (!i.file || !!warning.file && !!i.file.test(warning.file));
            }) : void 0,
            name: config.name,
            dependencies: config.dependencies,
            context: config.context,
            mode: config.mode,
            entry: void 0 === config.entry ? {
                main: {}
            } : "function" == typeof config.entry ? (fn = config.entry, ()=>Promise.resolve().then(fn).then(getNormalizedEntryStatic)) : getNormalizedEntryStatic(config.entry),
            output: nestedConfig(config.output, (output)=>{
                "cssHeadDataCompression" in output && external_node_util_default().deprecate(()=>{}, "cssHeadDataCompression is not used now, see https://github.com/web-infra-dev/rspack/pull/8534, this option could be removed in the future")();
                let { library } = output, libraryBase = "object" == typeof library && library && !Array.isArray(library) && "type" in library ? library : library || output.libraryTarget ? {
                    name: library
                } : void 0;
                return {
                    path: output.path,
                    pathinfo: output.pathinfo,
                    publicPath: output.publicPath,
                    filename: output.filename,
                    clean: output.clean,
                    chunkFormat: output.chunkFormat,
                    chunkLoading: output.chunkLoading,
                    chunkFilename: output.chunkFilename,
                    crossOriginLoading: output.crossOriginLoading,
                    cssFilename: output.cssFilename,
                    cssChunkFilename: output.cssChunkFilename,
                    hotUpdateMainFilename: output.hotUpdateMainFilename,
                    hotUpdateChunkFilename: output.hotUpdateChunkFilename,
                    hotUpdateGlobal: output.hotUpdateGlobal,
                    assetModuleFilename: output.assetModuleFilename,
                    wasmLoading: output.wasmLoading,
                    enabledChunkLoadingTypes: output.enabledChunkLoadingTypes ? [
                        ...output.enabledChunkLoadingTypes
                    ] : [
                        "..."
                    ],
                    enabledWasmLoadingTypes: output.enabledWasmLoadingTypes ? [
                        ...output.enabledWasmLoadingTypes
                    ] : [
                        "..."
                    ],
                    webassemblyModuleFilename: output.webassemblyModuleFilename,
                    uniqueName: output.uniqueName,
                    chunkLoadingGlobal: output.chunkLoadingGlobal,
                    enabledLibraryTypes: output.enabledLibraryTypes ? [
                        ...output.enabledLibraryTypes
                    ] : [
                        "..."
                    ],
                    globalObject: output.globalObject,
                    importFunctionName: output.importFunctionName,
                    importMetaName: output.importMetaName,
                    iife: output.iife,
                    module: output.module,
                    sourceMapFilename: output.sourceMapFilename,
                    library: libraryBase && {
                        type: void 0 !== output.libraryTarget ? output.libraryTarget : libraryBase.type,
                        auxiliaryComment: void 0 !== output.auxiliaryComment ? output.auxiliaryComment : libraryBase.auxiliaryComment,
                        amdContainer: libraryBase.amdContainer,
                        export: void 0 !== output.libraryExport ? output.libraryExport : libraryBase.export,
                        name: libraryBase.name,
                        umdNamedDefine: void 0 !== output.umdNamedDefine ? output.umdNamedDefine : libraryBase.umdNamedDefine
                    },
                    strictModuleErrorHandling: output.strictModuleErrorHandling ?? output.strictModuleExceptionHandling,
                    trustedTypes: optionalNestedConfig(output.trustedTypes, (trustedTypes)=>!0 === trustedTypes ? {} : "string" == typeof trustedTypes ? {
                            policyName: trustedTypes
                        } : {
                            ...trustedTypes
                        }),
                    hashDigest: output.hashDigest,
                    hashDigestLength: output.hashDigestLength,
                    hashFunction: output.hashFunction,
                    hashSalt: output.hashSalt,
                    asyncChunks: output.asyncChunks,
                    workerChunkLoading: output.workerChunkLoading,
                    workerWasmLoading: output.workerWasmLoading,
                    workerPublicPath: output.workerPublicPath,
                    scriptType: output.scriptType,
                    devtoolNamespace: output.devtoolNamespace,
                    devtoolModuleFilenameTemplate: output.devtoolModuleFilenameTemplate,
                    devtoolFallbackModuleFilenameTemplate: output.devtoolFallbackModuleFilenameTemplate,
                    chunkLoadTimeout: output.chunkLoadTimeout,
                    charset: output.charset,
                    environment: cloneObject(output.environment),
                    compareBeforeEmit: output.compareBeforeEmit
                };
            }),
            resolve: nestedConfig(config.resolve, (resolve)=>({
                    ...resolve,
                    tsConfig: optionalNestedConfig(resolve.tsConfig, (tsConfig)=>"string" == typeof tsConfig ? {
                            configFile: tsConfig
                        } : tsConfig)
                })),
            resolveLoader: nestedConfig(config.resolveLoader, (resolve)=>({
                    ...resolve,
                    tsConfig: optionalNestedConfig(resolve.tsConfig, (tsConfig)=>"string" == typeof tsConfig ? {
                            configFile: tsConfig
                        } : tsConfig)
                })),
            module: nestedConfig(config.module, (module1)=>({
                    noParse: module1.noParse,
                    parser: keyedNestedConfig(module1.parser, cloneObject, {}),
                    generator: keyedNestedConfig(module1.generator, cloneObject, {}),
                    defaultRules: optionalNestedArray(module1.defaultRules, (r)=>[
                            ...r
                        ]),
                    rules: nestedArray(module1.rules, (r)=>[
                            ...r
                        ]),
                    unsafeCache: module1.unsafeCache
                })),
            target: config.target,
            externals: config.externals,
            externalsType: config.externalsType,
            externalsPresets: cloneObject(config.externalsPresets),
            infrastructureLogging: cloneObject(config.infrastructureLogging),
            devtool: config.devtool,
            node: nestedConfig(config.node, (node)=>node && {
                    ...node
                }),
            loader: cloneObject(config.loader),
            snapshot: nestedConfig(config.snapshot, (_snapshot)=>({})),
            cache: optionalNestedConfig(config.cache, (cache)=>cache),
            stats: nestedConfig(config.stats, (stats)=>!1 === stats ? {
                    preset: "none"
                } : !0 === stats ? {
                    preset: "normal"
                } : "string" == typeof stats ? {
                    preset: stats
                } : {
                    ...stats
                }),
            optimization: nestedConfig(config.optimization, (optimization)=>({
                    ...optimization,
                    runtimeChunk: getNormalizedOptimizationRuntimeChunk(optimization.runtimeChunk),
                    splitChunks: nestedConfig(optimization.splitChunks, (splitChunks)=>splitChunks && {
                            ...splitChunks,
                            defaultSizeTypes: splitChunks.defaultSizeTypes ? [
                                ...splitChunks.defaultSizeTypes
                            ] : [
                                "..."
                            ],
                            cacheGroups: cloneObject(splitChunks.cacheGroups)
                        })
                })),
            performance: config.performance,
            plugins: nestedArray(config.plugins, (p)=>[
                    ...p
                ]),
            experiments: nestedConfig(config.experiments, (experiments)=>(experiments.layers && external_node_util_default().deprecate(()=>{}, "`experiments.layers` config has been deprecated and will be removed in Rspack v2.0. Feature layers will be always enabled. Please remove this option from your Rspack configuration.")(), !1 === experiments.topLevelAwait && external_node_util_default().deprecate(()=>{}, "`experiments.topLevelAwait` config has been deprecated and will be removed in Rspack v2.0. Top-level await will be always enabled. Please remove this option from your Rspack configuration.")(), experiments.parallelCodeSplitting && external_node_util_default().deprecate(()=>{}, "`experiments.parallelCodeSplitting` config has been deprecated and will be removed in next minor. It has huge regression in some edge cases where the chunk graph has lots of cycles, we'll improve the performance of build_chunk_graph in the future instead")(), {
                    ...experiments,
                    cache: optionalNestedConfig(experiments.cache, (cache)=>{
                        if ("boolean" == typeof cache || "memory" === cache.type) return cache;
                        let snapshot = cache.snapshot || {};
                        return {
                            type: "persistent",
                            buildDependencies: nestedArray(cache.buildDependencies, (deps)=>deps.map((d)=>external_node_path_default().resolve(config.context || process.cwd(), d))),
                            version: cache.version || "",
                            snapshot: {
                                immutablePaths: nestedArray(snapshot.immutablePaths, (p)=>[
                                        ...p
                                    ]),
                                unmanagedPaths: nestedArray(snapshot.unmanagedPaths, (p)=>[
                                        ...p
                                    ]),
                                managedPaths: optionalNestedArray(snapshot.managedPaths, (p)=>[
                                        ...p
                                    ]) || [
                                    /\/node_modules\//
                                ]
                            },
                            storage: {
                                type: "filesystem",
                                directory: external_node_path_default().resolve(config.context || process.cwd(), cache.storage?.directory || "node_modules/.cache/rspack")
                            }
                        };
                    }),
                    lazyCompilation: optionalNestedConfig(experiments.lazyCompilation, (options)=>!0 === options ? {} : options),
                    incremental: optionalNestedConfig(experiments.incremental, (options)=>getNormalizedIncrementalOptions(options)),
                    parallelCodeSplitting: experiments.parallelCodeSplitting,
                    buildHttp: experiments.buildHttp,
                    parallelLoader: experiments.parallelLoader,
                    useInputFileSystem: experiments.useInputFileSystem
                })),
            watch: config.watch,
            watchOptions: cloneObject(config.watchOptions),
            devServer: config.devServer,
            profile: config.profile,
            amd: config.amd,
            bail: config.bail,
            lazyCompilation: optionalNestedConfig(config.lazyCompilation, (options)=>!0 === options ? {} : options)
        };
    }, getNormalizedEntryStatic = (entry)=>{
        if ("string" == typeof entry) return {
            main: {
                import: [
                    entry
                ]
            }
        };
        if (Array.isArray(entry)) return {
            main: {
                import: entry
            }
        };
        let result = {};
        for (let key of Object.keys(entry)){
            let value = entry[key];
            "string" == typeof value ? result[key] = {
                import: [
                    value
                ]
            } : Array.isArray(value) ? result[key] = {
                import: value
            } : result[key] = {
                import: Array.isArray(value.import) ? value.import : [
                    value.import
                ],
                runtime: value.runtime,
                publicPath: value.publicPath,
                baseUri: value.baseUri,
                chunkLoading: value.chunkLoading,
                asyncChunks: value.asyncChunks,
                filename: value.filename,
                library: value.library,
                layer: value.layer,
                dependOn: Array.isArray(value.dependOn) ? value.dependOn : value.dependOn ? [
                    value.dependOn
                ] : void 0
            };
        }
        return result;
    }, getNormalizedOptimizationRuntimeChunk = (runtimeChunk)=>{
        if (void 0 !== runtimeChunk) {
            if (!1 === runtimeChunk) return !1;
            if ("single" === runtimeChunk) return {
                name: "single"
            };
            if (!0 === runtimeChunk || "multiple" === runtimeChunk) return {
                name: "multiple"
            };
            if (runtimeChunk.name) return {
                name: runtimeChunk.name
            };
        }
    }, getNormalizedIncrementalOptions = (incremental)=>!1 !== incremental && "none" !== incremental && ("safe" === incremental ? {
            silent: !0,
            make: !0,
            inferAsyncModules: !1,
            providedExports: !1,
            dependenciesDiagnostics: !1,
            sideEffects: !1,
            buildChunkGraph: !1,
            moduleIds: !1,
            chunkIds: !1,
            modulesHashes: !1,
            modulesCodegen: !1,
            modulesRuntimeRequirements: !1,
            chunksRuntimeRequirements: !1,
            chunksHashes: !1,
            chunksRender: !1,
            emitAssets: !0
        } : !0 === incremental || "advance-silent" === incremental ? {} : "advance" === incremental ? {
            silent: !1
        } : incremental), nestedConfig = (value, fn)=>fn(void 0 === value ? {} : value), optionalNestedConfig = (value, fn)=>void 0 === value ? void 0 : fn(value), nestedArray = (value, fn)=>fn(Array.isArray(value) ? value : []), optionalNestedArray = (value, fn)=>Array.isArray(value) ? fn(value) : void 0, cloneObject = (value)=>({
            ...value
        }), keyedNestedConfig = (value, fn, customKeys)=>{
        let result = void 0 === value ? {} : Object.keys(value).reduce((obj, key)=>(obj[key] = (customKeys && key in customKeys ? customKeys[key] : fn)(value[key]), obj), {});
        if (customKeys) for (let key of Object.keys(customKeys))key in result || (result[key] = customKeys[key]({}));
        return result;
    };
    function __from_binding_runtime_globals(runtimeRequirements, compilerRuntimeGlobals) {
        let res = new Set();
        for (let flag of runtimeRequirements.value)flag in compilerRuntimeGlobals ? res.add(compilerRuntimeGlobals[flag]) : res.add(flag);
        return res;
    }
    function __to_binding_runtime_globals(runtimeRequirements, compilerRuntimeGlobals) {
        let res = {
            value: []
        }, reversedCompilerRuntimeGlobals = Object.fromEntries(Object.entries(compilerRuntimeGlobals).map(([key, value])=>[
                value,
                key
            ]));
        for (let flag of Array.from(runtimeRequirements)){
            let item = reversedCompilerRuntimeGlobals[flag];
            "string" == typeof item ? res.value.push(item) : res.value.push(flag);
        }
        return res;
    }
    var RuntimeGlobals_RuntimeGlobals = ((RuntimeGlobals = RuntimeGlobals_RuntimeGlobals || {})[RuntimeGlobals.require = 0] = "require", RuntimeGlobals[RuntimeGlobals.requireScope = 1] = "requireScope", RuntimeGlobals[RuntimeGlobals.exports = 2] = "exports", RuntimeGlobals[RuntimeGlobals.thisAsExports = 3] = "thisAsExports", RuntimeGlobals[RuntimeGlobals.returnExportsFromRuntime = 4] = "returnExportsFromRuntime", RuntimeGlobals[RuntimeGlobals.module = 5] = "module", RuntimeGlobals[RuntimeGlobals.moduleId = 6] = "moduleId", RuntimeGlobals[RuntimeGlobals.moduleLoaded = 7] = "moduleLoaded", RuntimeGlobals[RuntimeGlobals.publicPath = 8] = "publicPath", RuntimeGlobals[RuntimeGlobals.entryModuleId = 9] = "entryModuleId", RuntimeGlobals[RuntimeGlobals.moduleCache = 10] = "moduleCache", RuntimeGlobals[RuntimeGlobals.moduleFactories = 11] = "moduleFactories", RuntimeGlobals[RuntimeGlobals.moduleFactoriesAddOnly = 12] = "moduleFactoriesAddOnly", RuntimeGlobals[RuntimeGlobals.ensureChunk = 13] = "ensureChunk", RuntimeGlobals[RuntimeGlobals.ensureChunkHandlers = 14] = "ensureChunkHandlers", RuntimeGlobals[RuntimeGlobals.ensureChunkIncludeEntries = 15] = "ensureChunkIncludeEntries", RuntimeGlobals[RuntimeGlobals.prefetchChunk = 16] = "prefetchChunk", RuntimeGlobals[RuntimeGlobals.prefetchChunkHandlers = 17] = "prefetchChunkHandlers", RuntimeGlobals[RuntimeGlobals.preloadChunk = 18] = "preloadChunk", RuntimeGlobals[RuntimeGlobals.preloadChunkHandlers = 19] = "preloadChunkHandlers", RuntimeGlobals[RuntimeGlobals.definePropertyGetters = 20] = "definePropertyGetters", RuntimeGlobals[RuntimeGlobals.makeNamespaceObject = 21] = "makeNamespaceObject", RuntimeGlobals[RuntimeGlobals.createFakeNamespaceObject = 22] = "createFakeNamespaceObject", RuntimeGlobals[RuntimeGlobals.compatGetDefaultExport = 23] = "compatGetDefaultExport", RuntimeGlobals[RuntimeGlobals.harmonyModuleDecorator = 24] = "harmonyModuleDecorator", RuntimeGlobals[RuntimeGlobals.nodeModuleDecorator = 25] = "nodeModuleDecorator", RuntimeGlobals[RuntimeGlobals.getFullHash = 26] = "getFullHash", RuntimeGlobals[RuntimeGlobals.wasmInstances = 27] = "wasmInstances", RuntimeGlobals[RuntimeGlobals.instantiateWasm = 28] = "instantiateWasm", RuntimeGlobals[RuntimeGlobals.uncaughtErrorHandler = 29] = "uncaughtErrorHandler", RuntimeGlobals[RuntimeGlobals.scriptNonce = 30] = "scriptNonce", RuntimeGlobals[RuntimeGlobals.loadScript = 31] = "loadScript", RuntimeGlobals[RuntimeGlobals.createScript = 32] = "createScript", RuntimeGlobals[RuntimeGlobals.createScriptUrl = 33] = "createScriptUrl", RuntimeGlobals[RuntimeGlobals.getTrustedTypesPolicy = 34] = "getTrustedTypesPolicy", RuntimeGlobals[RuntimeGlobals.hasFetchPriority = 35] = "hasFetchPriority", RuntimeGlobals[RuntimeGlobals.chunkName = 36] = "chunkName", RuntimeGlobals[RuntimeGlobals.runtimeId = 37] = "runtimeId", RuntimeGlobals[RuntimeGlobals.getChunkScriptFilename = 38] = "getChunkScriptFilename", RuntimeGlobals[RuntimeGlobals.getChunkCssFilename = 39] = "getChunkCssFilename", RuntimeGlobals[RuntimeGlobals.rspackVersion = 40] = "rspackVersion", RuntimeGlobals[RuntimeGlobals.hasCssModules = 41] = "hasCssModules", RuntimeGlobals[RuntimeGlobals.rspackUniqueId = 42] = "rspackUniqueId", RuntimeGlobals[RuntimeGlobals.getChunkUpdateScriptFilename = 43] = "getChunkUpdateScriptFilename", RuntimeGlobals[RuntimeGlobals.getChunkUpdateCssFilename = 44] = "getChunkUpdateCssFilename", RuntimeGlobals[RuntimeGlobals.startup = 45] = "startup", RuntimeGlobals[RuntimeGlobals.startupNoDefault = 46] = "startupNoDefault", RuntimeGlobals[RuntimeGlobals.startupOnlyAfter = 47] = "startupOnlyAfter", RuntimeGlobals[RuntimeGlobals.startupOnlyBefore = 48] = "startupOnlyBefore", RuntimeGlobals[RuntimeGlobals.chunkCallback = 49] = "chunkCallback", RuntimeGlobals[RuntimeGlobals.startupEntrypoint = 50] = "startupEntrypoint", RuntimeGlobals[RuntimeGlobals.startupChunkDependencies = 51] = "startupChunkDependencies", RuntimeGlobals[RuntimeGlobals.onChunksLoaded = 52] = "onChunksLoaded", RuntimeGlobals[RuntimeGlobals.externalInstallChunk = 53] = "externalInstallChunk", RuntimeGlobals[RuntimeGlobals.interceptModuleExecution = 54] = "interceptModuleExecution", RuntimeGlobals[RuntimeGlobals.global = 55] = "global", RuntimeGlobals[RuntimeGlobals.shareScopeMap = 56] = "shareScopeMap", RuntimeGlobals[RuntimeGlobals.initializeSharing = 57] = "initializeSharing", RuntimeGlobals[RuntimeGlobals.currentRemoteGetScope = 58] = "currentRemoteGetScope", RuntimeGlobals[RuntimeGlobals.getUpdateManifestFilename = 59] = "getUpdateManifestFilename", RuntimeGlobals[RuntimeGlobals.hmrDownloadManifest = 60] = "hmrDownloadManifest", RuntimeGlobals[RuntimeGlobals.hmrDownloadUpdateHandlers = 61] = "hmrDownloadUpdateHandlers", RuntimeGlobals[RuntimeGlobals.hmrModuleData = 62] = "hmrModuleData", RuntimeGlobals[RuntimeGlobals.hmrInvalidateModuleHandlers = 63] = "hmrInvalidateModuleHandlers", RuntimeGlobals[RuntimeGlobals.hmrRuntimeStatePrefix = 64] = "hmrRuntimeStatePrefix", RuntimeGlobals[RuntimeGlobals.amdDefine = 65] = "amdDefine", RuntimeGlobals[RuntimeGlobals.amdOptions = 66] = "amdOptions", RuntimeGlobals[RuntimeGlobals.system = 67] = "system", RuntimeGlobals[RuntimeGlobals.hasOwnProperty = 68] = "hasOwnProperty", RuntimeGlobals[RuntimeGlobals.systemContext = 69] = "systemContext", RuntimeGlobals[RuntimeGlobals.baseURI = 70] = "baseURI", RuntimeGlobals[RuntimeGlobals.relativeUrl = 71] = "relativeUrl", RuntimeGlobals[RuntimeGlobals.asyncModule = 72] = "asyncModule", RuntimeGlobals[RuntimeGlobals.asyncModuleExportSymbol = 73] = "asyncModuleExportSymbol", RuntimeGlobals[RuntimeGlobals.makeDeferredNamespaceObject = 74] = "makeDeferredNamespaceObject", RuntimeGlobals[RuntimeGlobals.makeDeferredNamespaceObjectSymbol = 75] = "makeDeferredNamespaceObjectSymbol", RuntimeGlobals);
    function renderRuntimeVariables(variable, _compilerOptions) {
        switch(variable){
            case 0:
                return "__webpack_require__";
            case 1:
                return "__webpack_modules__";
            case 2:
                return "__webpack_module_cache__";
            case 3:
                return "__webpack_module__";
            case 4:
                return "__webpack_exports__";
            case 5:
                return "__webpack_exec__";
        }
    }
    function createCompilerRuntimeGlobals(compilerOptions) {
        let res = {};
        for (let key of Object.keys(RuntimeGlobals_RuntimeGlobals))res[key] = function(runtimeGlobals, _compilerOptions) {
            let scope_name = renderRuntimeVariables(0, _compilerOptions), exports_name = renderRuntimeVariables(4, _compilerOptions);
            switch(runtimeGlobals){
                case 0:
                    return scope_name;
                case 1:
                    return `${scope_name}.*`;
                case 2:
                    return exports_name;
                case 3:
                    return "top-level-this-exports";
                case 4:
                    return "return-exports-from-runtime";
                case 5:
                    return "module";
                case 6:
                    return "module.id";
                case 7:
                    return "module.loaded";
                case 8:
                    return `${scope_name}.p`;
                case 9:
                    return `${scope_name}.s`;
                case 10:
                    return `${scope_name}.c`;
                case 11:
                    return `${scope_name}.m`;
                case 12:
                    return `${scope_name}.m (add only)`;
                case 13:
                    return `${scope_name}.e`;
                case 14:
                    return `${scope_name}.f`;
                case 15:
                    return `${scope_name}.f (include entries)`;
                case 16:
                    return `${scope_name}.E`;
                case 17:
                    return `${scope_name}.F`;
                case 18:
                    return `${scope_name}.G`;
                case 19:
                    return `${scope_name}.H`;
                case 20:
                    return `${scope_name}.d`;
                case 21:
                    return `${scope_name}.r`;
                case 22:
                    return `${scope_name}.t`;
                case 23:
                    return `${scope_name}.n`;
                case 24:
                    return `${scope_name}.hmd`;
                case 25:
                    return `${scope_name}.nmd`;
                case 26:
                    return `${scope_name}.h`;
                case 27:
                    return `${scope_name}.w`;
                case 28:
                    return `${scope_name}.v`;
                case 29:
                    return `${scope_name}.oe`;
                case 30:
                    return `${scope_name}.nc`;
                case 31:
                    return `${scope_name}.l`;
                case 32:
                    return `${scope_name}.ts`;
                case 33:
                    return `${scope_name}.tu`;
                case 34:
                    return `${scope_name}.tt`;
                case 35:
                    return "has fetch priority";
                case 36:
                    return `${scope_name}.cn`;
                case 37:
                    return `${scope_name}.j`;
                case 38:
                    return `${scope_name}.u`;
                case 39:
                    return `${scope_name}.k`;
                case 40:
                    return `${scope_name}.rv`;
                case 41:
                    return "has css modules";
                case 42:
                    return `${scope_name}.ruid`;
                case 43:
                    return `${scope_name}.hu`;
                case 44:
                    return `${scope_name}.hk`;
                case 45:
                    return `${scope_name}.x`;
                case 46:
                    return `${scope_name}.x (no default handler)`;
                case 47:
                    return `${scope_name}.x (only after)`;
                case 48:
                    return `${scope_name}.x (only before)`;
                case 49:
                    return "global chunk callback";
                case 50:
                    return `${scope_name}.X`;
                case 51:
                    return `${scope_name}.x (chunk dependencies)`;
                case 52:
                    return `${scope_name}.O`;
                case 53:
                    return `${scope_name}.C`;
                case 54:
                    return `${scope_name}.i`;
                case 55:
                    return `${scope_name}.g`;
                case 56:
                    return `${scope_name}.S`;
                case 57:
                    return `${scope_name}.I`;
                case 58:
                    return `${scope_name}.R`;
                case 59:
                    return `${scope_name}.hmrF`;
                case 60:
                    return `${scope_name}.hmrM`;
                case 61:
                    return `${scope_name}.hmrC`;
                case 62:
                    return `${scope_name}.hmrD`;
                case 63:
                    return `${scope_name}.hmrI`;
                case 64:
                    return `${scope_name}.hmrS`;
                case 65:
                    return `${scope_name}.amdD`;
                case 66:
                    return `${scope_name}.amdO`;
                case 67:
                    return `${scope_name}.System`;
                case 68:
                    return `${scope_name}.o`;
                case 69:
                    return `${scope_name}.y`;
                case 70:
                    return `${scope_name}.b`;
                case 71:
                    return `${scope_name}.U`;
                case 72:
                    return `${scope_name}.a`;
                case 73:
                    return `${scope_name}.aE`;
                case 74:
                    return `${scope_name}.z`;
                case 75:
                    return `${scope_name}.zS`;
                default:
                    return "";
            }
        }(RuntimeGlobals_RuntimeGlobals[key], compilerOptions);
        return res;
    }
    let DefaultRuntimeGlobals = createCompilerRuntimeGlobals();
    class ExecuteModulePlugin {
        apply(compiler) {
            compiler.hooks.thisCompilation.tap("executeModule", (compilation)=>{
                compiler.__internal__get_module_execution_results_map().clear(), compilation.hooks.executeModule.tap("executeModule", (options, context)=>{
                    let vm = __webpack_require__("node:vm"), moduleObject = options.moduleObject, source = options.codeGenerationResult.get("javascript");
                    if (void 0 !== source) try {
                        vm.runInThisContext(`(function(module, ${renderRuntimeVariables(3, compiler.options)}, ${renderRuntimeVariables(4, compiler.options)}, exports, ${renderRuntimeVariables(0, compiler.options)}) {\n${source}\n})`, {
                            filename: moduleObject.id
                        }).call(moduleObject.exports, moduleObject, moduleObject, moduleObject.exports, moduleObject.exports, context[renderRuntimeVariables(0, compiler.options)]);
                    } catch (e) {
                        let err = e instanceof Error ? e : Error(e);
                        throw err.stack += printGeneratedCodeForStack(moduleObject.id, source), err;
                    }
                });
            });
        }
    }
    let printGeneratedCodeForStack = (moduleId, code)=>{
        let lines = code.split("\n"), n = `${lines.length}`.length;
        return `\n\nGenerated code for ${moduleId}\n${lines.map((line, i)=>{
            let iStr = `${i + 1}`;
            return `${" ".repeat(n - iStr.length)}${iStr} | ${line}`;
        }).join("\n")}`;
    };
    class ConcurrentCompilationError extends Error {
        name;
        message;
        constructor(){
            super(), this.name = "ConcurrentCompilationError", this.message = "You ran rspack twice. Each instance only supports a single concurrent compilation at a time.";
        }
    }
    let join = (fs, rootPath, filename)=>{
        if (fs?.join) return fs.join(rootPath, filename);
        if (external_node_path_default().posix.isAbsolute(rootPath)) return external_node_path_default().posix.join(rootPath, filename);
        if (external_node_path_default().win32.isAbsolute(rootPath)) return external_node_path_default().win32.join(rootPath, filename);
        throw Error(`${rootPath} is neither a posix nor a windows path, and there is no 'join' method defined in the file system`);
    }, mkdirp = (fs, p, callback)=>{
        fs.mkdir(p, (err)=>{
            if (err) {
                if ("ENOENT" === err.code) {
                    let dir = ((fs, absPath)=>{
                        if (fs?.dirname) return fs.dirname(absPath);
                        if (external_node_path_default().posix.isAbsolute(absPath)) return external_node_path_default().posix.dirname(absPath);
                        if (external_node_path_default().win32.isAbsolute(absPath)) return external_node_path_default().win32.dirname(absPath);
                        throw Error(`${absPath} is neither a posix nor a windows path, and there is no 'dirname' method defined in the file system`);
                    })(fs, p);
                    return dir === p ? void callback(err) : void mkdirp(fs, dir, (err)=>{
                        err ? callback(err) : fs.mkdir(p, (err)=>{
                            err ? "EEXIST" === err.code ? callback() : callback(err) : callback();
                        });
                    });
                }
                return "EEXIST" === err.code ? void callback() : void callback(err);
            }
            callback();
        });
    }, ASYNC_NOOP = async ()=>{}, NOOP_FILESYSTEM = {
        writeFile: ASYNC_NOOP,
        removeFile: ASYNC_NOOP,
        mkdir: ASYNC_NOOP,
        mkdirp: ASYNC_NOOP,
        removeDirAll: ASYNC_NOOP,
        readDir: ASYNC_NOOP,
        readFile: ASYNC_NOOP,
        stat: ASYNC_NOOP,
        lstat: ASYNC_NOOP,
        chmod: ASYNC_NOOP,
        realpath: ASYNC_NOOP,
        open: ASYNC_NOOP,
        rename: ASYNC_NOOP,
        close: ASYNC_NOOP,
        write: ASYNC_NOOP,
        writeAll: ASYNC_NOOP,
        read: ASYNC_NOOP,
        readUntil: ASYNC_NOOP,
        readToEnd: ASYNC_NOOP
    };
    function __to_binding_stat(stat) {
        return {
            isFile: stat.isFile(),
            isDirectory: stat.isDirectory(),
            isSymlink: stat.isSymbolicLink(),
            atimeMs: stat.atimeMs ?? toMs(stat.atime),
            mtimeMs: stat.mtimeMs ?? toMs(stat.mtime),
            ctimeMs: stat.ctimeMs ?? toMs(stat.ctime),
            birthtimeMs: stat.birthtimeMs ?? toMs(stat.birthtime),
            size: stat.size,
            mode: stat.mode
        };
    }
    function toMs(i) {
        return i.getTime ? i.getTime() : i;
    }
    class ThreadsafeInputNodeFS {
        writeFile;
        removeFile;
        mkdir;
        mkdirp;
        removeDirAll;
        readDir;
        readFile;
        stat;
        lstat;
        chmod;
        realpath;
        open;
        rename;
        close;
        write;
        writeAll;
        read;
        readUntil;
        readToEnd;
        constructor(fs){
            if (Object.assign(this, NOOP_FILESYSTEM), !fs) return;
            this.readDir = memoizeFn(()=>{
                let readDirFn = external_node_util_default().promisify(fs.readdir.bind(fs));
                return async (filePath)=>await readDirFn(filePath);
            }), this.readFile = memoizeFn(()=>external_node_util_default().promisify(fs.readFile.bind(fs))), this.stat = memoizeFn(()=>(name)=>new Promise((resolve, reject)=>{
                        fs.stat(name, (err, stats)=>{
                            if (err) return reject(err);
                            resolve(stats && __to_binding_stat(stats));
                        });
                    })), this.lstat = memoizeFn(()=>(name)=>new Promise((resolve, reject)=>{
                        (fs.lstat || fs.stat)(name, (err, stats)=>{
                            if (err) return reject(err);
                            resolve(stats && __to_binding_stat(stats));
                        });
                    })), this.realpath = memoizeFn(()=>(name)=>new Promise((resolve, reject)=>{
                        fs.realpath ? fs.realpath(name, (err, path)=>{
                            if (err) return reject(err);
                            resolve(path);
                        }) : reject(Error("fs.realpath is not a function"));
                    }));
        }
        static __to_binding(fs) {
            return new this(fs);
        }
        static needsBinding(ifs) {
            return Array.isArray(ifs) && ifs.length > 0;
        }
    }
    class ThreadsafeOutputNodeFS {
        writeFile;
        removeFile;
        mkdir;
        mkdirp;
        removeDirAll;
        readDir;
        readFile;
        stat;
        lstat;
        chmod;
        realpath;
        open;
        rename;
        close;
        write;
        writeAll;
        read;
        readUntil;
        readToEnd;
        constructor(fs){
            if (Object.assign(this, NOOP_FILESYSTEM), !fs) return;
            this.writeFile = memoizeFn(()=>external_node_util_default().promisify(fs.writeFile.bind(fs))), this.removeFile = memoizeFn(()=>external_node_util_default().promisify(fs.unlink.bind(fs))), this.mkdir = memoizeFn(()=>external_node_util_default().promisify(fs.mkdir.bind(fs))), this.mkdirp = memoizeFn(()=>external_node_util_default().promisify(mkdirp.bind(null, fs))), this.removeDirAll = memoizeFn(()=>external_node_util_default().promisify((function rmrf(fs, p, callback) {
                    fs.stat(p, (err, stats)=>{
                        if (err) return "ENOENT" === err.code ? callback() : callback(err);
                        stats.isDirectory() ? fs.readdir(p, (err, files)=>{
                            if (err) return callback(err);
                            let count = files.length;
                            if (0 === count) fs.rmdir(p, callback);
                            else for (let file of files){
                                if ("string" != typeof file) throw Error("file should be a string");
                                let fullPath = join(fs, p, file);
                                rmrf(fs, fullPath, (err)=>{
                                    if (err) return callback(err);
                                    0 == --count && fs.rmdir(p, callback);
                                });
                            }
                        }) : fs.unlink(p, callback);
                    });
                }).bind(null, fs))), this.readDir = memoizeFn(()=>{
                let readDirFn = external_node_util_default().promisify(fs.readdir.bind(fs));
                return async (filePath)=>await readDirFn(filePath);
            }), this.readFile = memoizeFn(()=>external_node_util_default().promisify(fs.readFile.bind(fs))), this.stat = memoizeFn(()=>{
                let statFn = external_node_util_default().promisify(fs.stat.bind(fs));
                return async (filePath)=>{
                    let res = await statFn(filePath);
                    return res && __to_binding_stat(res);
                };
            }), this.lstat = memoizeFn(()=>{
                let statFn = external_node_util_default().promisify((fs.lstat || fs.stat).bind(fs));
                return async (filePath)=>{
                    let res = await statFn(filePath);
                    return res && __to_binding_stat(res);
                };
            }), this.chmod = memoizeFn(()=>external_node_util_default().promisify(fs.chmod.bind(fs)));
        }
        static __to_binding(fs) {
            return new this(fs);
        }
    }
    class ThreadsafeIntermediateNodeFS extends ThreadsafeOutputNodeFS {
        constructor(fs){
            if (super(fs), !fs) return;
            this.open = memoizeFn(()=>external_node_util_default().promisify(fs.open.bind(fs))), this.rename = memoizeFn(()=>external_node_util_default().promisify(fs.rename.bind(fs))), this.close = memoizeFn(()=>external_node_util_default().promisify(fs.close.bind(fs))), this.write = memoizeFn(()=>{
                let writeFn = external_node_util_default().promisify(fs.write.bind(fs));
                return async (fd, content, position)=>await writeFn(fd, content, {
                        position
                    });
            }), this.writeAll = memoizeFn(()=>{
                let writeFn = external_node_util_default().promisify(fs.writeFile.bind(fs));
                return async (fd, content)=>await writeFn(fd, content);
            }), this.read = memoizeFn(()=>{
                let readFn = fs.read.bind(fs);
                return async (fd, length, position)=>{
                    new Promise((resolve)=>{
                        readFn(fd, {
                            position,
                            length
                        }, (err, bytesRead, buffer)=>{
                            err ? resolve(err) : resolve(buffer);
                        });
                    });
                };
            }), this.readUntil = memoizeFn(()=>async (fd, delim, position)=>{
                    let res = [], current_position = position;
                    for(;;){
                        let buffer = await this.read(fd, 1000, current_position);
                        if (!buffer || 0 === buffer.length) break;
                        let pos = buffer.indexOf(delim);
                        if (pos >= 0) {
                            res.push(buffer.slice(0, pos));
                            break;
                        }
                        res.push(buffer), current_position += buffer.length;
                    }
                    return Buffer.concat(res);
                }), this.readToEnd = memoizeFn(()=>async (fd, position)=>{
                    let res = [], current_position = position;
                    for(;;){
                        let buffer = await this.read(fd, 1000, current_position);
                        if (!buffer || 0 === buffer.length) break;
                        res.push(buffer), current_position += buffer.length;
                    }
                    return Buffer.concat(res);
                });
        }
        static __to_binding(fs) {
            return new this(fs);
        }
    }
    class HookWebpackError extends lib_WebpackError {
        hook;
        error;
        constructor(error, hook){
            super(error.message), this.name = "HookWebpackError", this.hook = hook, this.error = error, this.hideStack = !0, this.details = `caused by plugins in ${hook}\n${error.stack}`, this.stack += `\n-- inner error --\n${error.stack}`;
        }
    }
    let makeWebpackErrorCallback = (callback, hook)=>(err, result)=>{
            err ? err instanceof lib_WebpackError ? callback(err) : callback(new HookWebpackError(err, hook)) : callback(null, result);
        };
    class Cache {
        static STAGE_DISK = 10;
        static STAGE_MEMORY = -10;
        static STAGE_DEFAULT = 0;
        static STAGE_NETWORK = 20;
        hooks;
        constructor(){
            this.hooks = {
                get: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                    "identifier",
                    "etag",
                    "gotHandlers"
                ]),
                store: new lite_tapable_namespaceObject.AsyncParallelHook([
                    "identifier",
                    "etag",
                    "data"
                ]),
                storeBuildDependencies: new lite_tapable_namespaceObject.AsyncParallelHook([
                    "dependencies"
                ]),
                beginIdle: new lite_tapable_namespaceObject.SyncHook([]),
                endIdle: new lite_tapable_namespaceObject.AsyncParallelHook([]),
                shutdown: new lite_tapable_namespaceObject.AsyncParallelHook([])
            };
        }
        get(identifier, etag, callback) {
            let gotHandlers = [];
            this.hooks.get.callAsync(identifier, etag, gotHandlers, (err, res)=>{
                var error, hook, times, callback1;
                if (err) return void callback((hook = "Cache.hooks.get", (error = err) instanceof lib_WebpackError ? error : new HookWebpackError(error, hook)));
                let result = res;
                if (null === result && (result = void 0), gotHandlers.length > 1) {
                    let leftTimes, innerCallback = (times = gotHandlers.length, callback1 = ()=>callback(null, result), leftTimes = times, (err)=>0 == --leftTimes ? callback1() : err && leftTimes > 0 ? (leftTimes = 0, callback1()) : void 0);
                    for (let gotHandler of gotHandlers)gotHandler(result, innerCallback);
                } else 1 === gotHandlers.length ? gotHandlers[0](result, ()=>callback(null, result)) : callback(null, result);
            });
        }
        store(identifier, etag, data, callback) {
            this.hooks.store.callAsync(identifier, etag, data, makeWebpackErrorCallback(callback, "Cache.hooks.store"));
        }
        storeBuildDependencies(dependencies, callback) {
            this.hooks.storeBuildDependencies.callAsync(dependencies, makeWebpackErrorCallback(callback, "Cache.hooks.storeBuildDependencies"));
        }
        beginIdle() {
            this.hooks.beginIdle.call();
        }
        endIdle(callback) {
            this.hooks.endIdle.callAsync(makeWebpackErrorCallback(callback, "Cache.hooks.endIdle"));
        }
        shutdown(callback) {
            this.hooks.shutdown.callAsync(makeWebpackErrorCallback(callback, "Cache.hooks.shutdown"));
        }
    }
    class LazyHashedEtag {
        _obj;
        _hash;
        _hashFunction;
        constructor(obj, hashFunction = "xxhash64"){
            this._obj = obj, this._hash = void 0, this._hashFunction = hashFunction;
        }
        toString() {
            if (void 0 === this._hash) {
                let hash = createHash_createHash(this._hashFunction);
                this._obj.updateHash(hash), this._hash = hash.digest("base64");
            }
            return this._hash;
        }
    }
    let mapStrings = new Map(), mapObjects = new WeakMap();
    class MergedEtag {
        a;
        b;
        constructor(a, b){
            this.a = a, this.b = b;
        }
        toString() {
            return `${this.a.toString()}|${this.b.toString()}`;
        }
    }
    let dualObjectMap = new WeakMap(), objectStringMap = new WeakMap();
    class ItemCacheFacade {
        _cache;
        _name;
        _etag;
        constructor(cache, name, etag){
            this._cache = cache, this._name = name, this._etag = etag;
        }
        get(callback) {
            this._cache.get(this._name, this._etag, callback);
        }
        getPromise() {
            return new Promise((resolve, reject)=>{
                this._cache.get(this._name, this._etag, (err, data)=>{
                    err ? reject(err) : resolve(data);
                });
            });
        }
        store(data, callback) {
            this._cache.store(this._name, this._etag, data, callback);
        }
        storePromise(data) {
            return new Promise((resolve, reject)=>{
                this._cache.store(this._name, this._etag, data, (err)=>{
                    err ? reject(err) : resolve();
                });
            });
        }
        provide(computer, callback) {
            this.get((err, cacheEntry)=>err ? callback(err) : void 0 !== cacheEntry ? cacheEntry : void computer((err, result)=>{
                    if (err) return callback(err);
                    this.store(result, (err)=>{
                        if (err) return callback(err);
                        callback(null, result);
                    });
                }));
        }
        async providePromise(computer) {
            let cacheEntry = await this.getPromise();
            if (void 0 !== cacheEntry) return cacheEntry;
            let result = await computer();
            return await this.storePromise(result), result;
        }
    }
    class CacheFacade {
        _name;
        _cache;
        _hashFunction;
        constructor(cache, name, hashFunction){
            this._cache = cache, this._name = name, this._hashFunction = hashFunction;
        }
        getChildCache(name) {
            return new CacheFacade(this._cache, `${this._name}|${name}`, this._hashFunction);
        }
        getItemCache(identifier, etag) {
            return new ItemCacheFacade(this._cache, `${this._name}|${identifier}`, etag);
        }
        getLazyHashedEtag(obj) {
            return ((obj, hashFunction = "xxhash64")=>{
                let innerMap;
                if ("string" == typeof hashFunction) {
                    if (void 0 === (innerMap = mapStrings.get(hashFunction))) {
                        let newHash = new LazyHashedEtag(obj, hashFunction);
                        return (innerMap = new WeakMap()).set(obj, newHash), mapStrings.set(hashFunction, innerMap), newHash;
                    }
                } else if (void 0 === (innerMap = mapObjects.get(hashFunction))) {
                    let newHash = new LazyHashedEtag(obj, hashFunction);
                    return (innerMap = new WeakMap()).set(obj, newHash), mapObjects.set(hashFunction, innerMap), newHash;
                }
                let hash = innerMap.get(obj);
                if (void 0 !== hash) return hash;
                let newHash = new LazyHashedEtag(obj, hashFunction);
                return innerMap.set(obj, newHash), newHash;
            })(obj, this._hashFunction);
        }
        mergeEtags(a, b) {
            return ((first, second)=>{
                let a = first, b = second;
                if ("string" == typeof a) {
                    if ("string" == typeof b) return `${a}|${b}`;
                    let temp = b;
                    b = a, a = temp;
                } else if ("string" != typeof b) {
                    let map = dualObjectMap.get(a);
                    void 0 === map && dualObjectMap.set(a, map = new WeakMap());
                    let mergedEtag = map.get(b);
                    if (void 0 === mergedEtag) {
                        let newMergedEtag = new MergedEtag(a, b);
                        return map.set(b, newMergedEtag), newMergedEtag;
                    }
                    return mergedEtag;
                }
                let map = objectStringMap.get(a);
                void 0 === map && objectStringMap.set(a, map = new Map());
                let mergedEtag = map.get(b);
                if (void 0 === mergedEtag) {
                    let newMergedEtag = new MergedEtag(a, b);
                    return map.set(b, newMergedEtag), newMergedEtag;
                }
                return mergedEtag;
            })(a, b);
        }
        get(identifier, etag, callback) {
            this._cache.get(`${this._name}|${identifier}`, etag, callback);
        }
        getPromise(identifier, etag) {
            return new Promise((resolve, reject)=>{
                this._cache.get(`${this._name}|${identifier}`, etag, (err, data)=>{
                    err ? reject(err) : resolve(data);
                });
            });
        }
        store(identifier, etag, data, callback) {
            this._cache.store(`${this._name}|${identifier}`, etag, data, callback);
        }
        storePromise(identifier, etag, data) {
            return new Promise((resolve, reject)=>{
                this._cache.store(`${this._name}|${identifier}`, etag, data, (err)=>{
                    err ? reject(err) : resolve();
                });
            });
        }
        provide(identifier, etag, computer, callback) {
            this.get(identifier, etag, (err, cacheEntry)=>err ? callback(err) : void 0 !== cacheEntry ? cacheEntry : void computer((err, result)=>{
                    if (err) return callback(err);
                    this.store(identifier, etag, result, (err)=>{
                        if (err) return callback(err);
                        callback(null, result);
                    });
                }));
        }
        async providePromise(identifier, etag, computer) {
            let cacheEntry = await this.getPromise(identifier, etag);
            if (void 0 !== cacheEntry) return cacheEntry;
            let result = await computer();
            return await this.storePromise(identifier, etag, result), result;
        }
    }
    class NormalModuleFactory {
        hooks;
        resolverFactory;
        constructor(resolverFactory){
            this.hooks = {
                resolveForScheme: new lite_tapable_namespaceObject.HookMap(()=>new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                        "resourceData"
                    ])),
                beforeResolve: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                    "resolveData"
                ]),
                factorize: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                    "resolveData"
                ]),
                resolve: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                    "resolveData"
                ]),
                afterResolve: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                    "resolveData"
                ]),
                createModule: new lite_tapable_namespaceObject.AsyncSeriesBailHook([
                    "createData",
                    "resolveData"
                ])
            }, this.resolverFactory = resolverFactory;
        }
        getResolver(type, resolveOptions) {
            return this.resolverFactory.get(type, resolveOptions);
        }
    }
    class Resolver {
        #binding;
        constructor(binding){
            this.#binding = binding;
        }
        resolveSync(context, path, request) {
            return this.#binding.resolveSync(path, request) ?? !1;
        }
        resolve(context, path, request, resolveContext, callback) {
            this.#binding.resolve(path, request, (error, text)=>{
                if (error) return void callback(error);
                let req = text ? JSON.parse(text) : void 0;
                req?.fileDependencies && req.fileDependencies.forEach((file)=>{
                    resolveContext.fileDependencies?.add(file);
                }), req?.missingDependencies && req.missingDependencies.forEach((missing)=>{
                    resolveContext.missingDependencies?.add(missing);
                }), callback(error, !!req && `${req.path.replace(/#/g, "\u200b#")}${req.query.replace(/#/g, "\u200b#")}${req.fragment}`, req);
            });
        }
    }
    let EMPTY_RESOLVE_OPTIONS = {};
    class ResolverFactory {
        #binding;
        #cache = new Map();
        static __to_binding(resolver_factory) {
            return resolver_factory.#binding;
        }
        constructor(pnp, resolveOptions, loaderResolveOptions){
            this.#binding = new (binding_default()).JsResolverFactory(pnp, getRawResolve(resolveOptions), getRawResolve(loaderResolveOptions));
        }
        #create(type, resolveOptionsWithDepType) {
            let { dependencyType, resolveToContext, ...resolve } = resolveOptionsWithDepType, resolver = new Resolver(this.#binding.get(type, {
                ...getRawResolve(resolve),
                dependencyType,
                resolveToContext
            })), childCache = new WeakMap();
            return resolver.withOptions = (options)=>{
                let cacheEntry = childCache.get(options);
                if (void 0 !== cacheEntry) return cacheEntry;
                let mergedOptions = cachedCleverMerge(resolveOptionsWithDepType, options), newResolver = this.get(type, mergedOptions);
                return childCache.set(options, newResolver), newResolver;
            }, resolver;
        }
        get(type, resolveOptions = EMPTY_RESOLVE_OPTIONS) {
            let typedCaches = this.#cache.get(type);
            typedCaches || (typedCaches = {
                direct: new WeakMap(),
                stringified: new Map()
            }, this.#cache.set(type, typedCaches));
            let cachedResolver = typedCaches.direct.get(resolveOptions);
            if (cachedResolver) return cachedResolver;
            let ident = JSON.stringify(resolveOptions), resolver = typedCaches.stringified.get(ident);
            if (resolver) return typedCaches.direct.set(resolveOptions, resolver), resolver;
            let newResolver = this.#create(type, resolveOptions);
            return typedCaches.direct.set(resolveOptions, newResolver), typedCaches.stringified.set(ident, newResolver), newResolver;
        }
    }
    class RuleSetCompiler {
        references;
        builtinReferences;
        constructor(){
            this.references = new Map(), this.builtinReferences = new Map();
        }
    }
    class CodeGenerationResult {
        #inner;
        constructor(result){
            this.#inner = result;
        }
        get(sourceType) {
            return this.#inner.sources[sourceType];
        }
    }
    class ContextModuleFactoryBeforeResolveData {
        #inner;
        static __from_binding(binding) {
            return new ContextModuleFactoryBeforeResolveData(binding);
        }
        static __to_binding(data) {
            return data.#inner;
        }
        constructor(binding){
            this.#inner = binding, Object.defineProperties(this, {
                context: {
                    enumerable: !0,
                    get: ()=>binding.context,
                    set (val) {
                        binding.context = val;
                    }
                },
                request: {
                    enumerable: !0,
                    get: ()=>binding.request,
                    set (val) {
                        binding.request = val;
                    }
                },
                regExp: {
                    enumerable: !0,
                    get: ()=>binding.regExp,
                    set (val) {
                        binding.regExp = val;
                    }
                },
                recursive: {
                    enumerable: !0,
                    get: ()=>binding.recursive,
                    set (val) {
                        binding.recursive = val;
                    }
                }
            });
        }
    }
    class ContextModuleFactoryAfterResolveData {
        #inner;
        static __from_binding(binding) {
            return new ContextModuleFactoryAfterResolveData(binding);
        }
        static __to_binding(data) {
            return data.#inner;
        }
        constructor(binding){
            this.#inner = binding, Object.defineProperties(this, {
                resource: {
                    enumerable: !0,
                    get: ()=>binding.resource,
                    set (val) {
                        binding.resource = val;
                    }
                },
                context: {
                    enumerable: !0,
                    get: ()=>binding.context,
                    set (val) {
                        binding.context = val;
                    }
                },
                request: {
                    enumerable: !0,
                    get: ()=>binding.request,
                    set (val) {
                        binding.request = val;
                    }
                },
                regExp: {
                    enumerable: !0,
                    get: ()=>binding.regExp,
                    set (val) {
                        binding.regExp = val;
                    }
                },
                recursive: {
                    enumerable: !0,
                    get: ()=>binding.recursive,
                    set (val) {
                        binding.recursive = val;
                    }
                },
                dependencies: {
                    enumerable: !0,
                    get: ()=>binding.dependencies
                }
            });
        }
    }
    Object.defineProperty(binding_default().Module.prototype, "identifier", {
        enumerable: !0,
        configurable: !0,
        value () {
            return this[binding_default().MODULE_IDENTIFIER_SYMBOL];
        }
    }), Object.defineProperty(binding_default().Module.prototype, "originalSource", {
        enumerable: !0,
        configurable: !0,
        value () {
            let originalSource = this._originalSource();
            return originalSource ? SourceAdapter.fromBinding(originalSource) : null;
        }
    }), Object.defineProperty(binding_default().Module.prototype, "emitFile", {
        enumerable: !0,
        configurable: !0,
        value (filename, source, assetInfo) {
            return this._emitFile(filename, SourceAdapter.toBinding(source), assetInfo);
        }
    });
    let traceHookPlugin_PLUGIN_NAME = "TraceHookPlugin", PLUGIN_PROCESS_NAME = "Plugin Analysis", makeInterceptorFor = (compilerName, tracer)=>(hookName)=>({
                register: (tapInfo)=>{
                    let { name, type, fn: internalFn } = tapInfo, newFn = name === traceHookPlugin_PLUGIN_NAME ? internalFn : makeNewTraceTapFn(compilerName, hookName, tracer, {
                        name,
                        type,
                        fn: internalFn
                    });
                    return {
                        ...tapInfo,
                        fn: newFn
                    };
                }
            }), interceptAllHooksFor = (instance, tracer, logLabel)=>{
        if (Reflect.has(instance, "hooks")) for (let hookName of Object.keys(instance.hooks)){
            let hook = instance.hooks[hookName];
            hook && !hook._fakeHook && hook.intercept(makeInterceptorFor(logLabel, tracer)(hookName));
        }
    }, makeNewTraceTapFn = (compilerName, hookName, tracer, { name: pluginName, type, fn })=>{
        switch(type){
            case "promise":
                return (...args)=>{
                    let uuid = tracer.uuid();
                    return tracer.startAsync({
                        name: hookName,
                        trackName: pluginName,
                        processName: PLUGIN_PROCESS_NAME,
                        uuid,
                        args: {
                            compilerName,
                            hookName,
                            pluginName
                        }
                    }), fn(...args).then((r)=>(tracer.endAsync({
                            name: hookName,
                            trackName: pluginName,
                            processName: PLUGIN_PROCESS_NAME,
                            uuid,
                            args: {
                                compilerName,
                                hookName,
                                pluginName
                            }
                        }), r));
                };
            case "async":
                return (...args)=>{
                    let uuid = tracer.uuid();
                    tracer.startAsync({
                        name: hookName,
                        trackName: pluginName,
                        processName: PLUGIN_PROCESS_NAME,
                        uuid,
                        args: {
                            compilerName,
                            hookName,
                            pluginName
                        }
                    });
                    let callback = args.pop();
                    fn(...args, (...r)=>{
                        tracer.endAsync({
                            name: hookName,
                            trackName: pluginName,
                            processName: PLUGIN_PROCESS_NAME,
                            uuid,
                            args: {
                                compilerName,
                                hookName,
                                pluginName
                            }
                        }), callback(...r);
                    });
                };
            case "sync":
                return (...args)=>{
                    let r, uuid = tracer.uuid();
                    if (pluginName === traceHookPlugin_PLUGIN_NAME) return fn(...args);
                    tracer.startAsync({
                        name: hookName,
                        trackName: pluginName,
                        processName: PLUGIN_PROCESS_NAME,
                        uuid,
                        args: {
                            compilerName,
                            hookName,
                            pluginName
                        }
                    });
                    try {
                        r = fn(...args);
                    } catch (err) {
                        throw tracer.endAsync({
                            name: hookName,
                            trackName: pluginName,
                            processName: PLUGIN_PROCESS_NAME,
                            uuid,
                            args: {
                                hookName,
                                pluginName
                            }
                        }), err;
                    }
                    return tracer.endAsync({
                        name: hookName,
                        trackName: pluginName,
                        processName: PLUGIN_PROCESS_NAME,
                        uuid,
                        args: {
                            compilerName,
                            hookName,
                            pluginName
                        }
                    }), r;
                };
            default:
                return fn;
        }
    }, compilerId = 0;
    class TraceHookPlugin {
        name = traceHookPlugin_PLUGIN_NAME;
        apply(compiler) {
            let compilerName = compiler.name || (compilerId++).toString();
            for (let hookName of Object.keys(compiler.hooks)){
                let hook = compiler.hooks[hookName];
                hook && hook.intercept(makeInterceptorFor(compilerName, JavaScriptTracer)(hookName));
            }
            compiler.hooks.compilation.tap(traceHookPlugin_PLUGIN_NAME, (compilation, { normalModuleFactory, contextModuleFactory })=>{
                interceptAllHooksFor(compilation, JavaScriptTracer, "Compilation"), interceptAllHooksFor(normalModuleFactory, JavaScriptTracer, "Normal Module Factory"), interceptAllHooksFor(contextModuleFactory, JavaScriptTracer, "Context Module Factory");
            });
        }
    }
    let CORE_VERSION = "1.6.8", bindingVersionCheck_errorMessage = (coreVersion, expectedCoreVersion)=>process.env.RSPACK_BINDING ? `Unmatched version @rspack/core@${coreVersion} and binding version.

Help:
	Looks like you are using a custom binding (via environment variable 'RSPACK_BINDING=${process.env.RSPACK_BINDING}').
	The expected version of @rspack/core to the current binding is ${expectedCoreVersion}.
` : `Unmatched version @rspack/core@${coreVersion} and @rspack/binding@${expectedCoreVersion}.

Help:
	Please ensure the version of @rspack/binding and @rspack/core is the same.
	The expected version of @rspack/core to the current binding is ${expectedCoreVersion}.
`;
    class NativeWatchFileSystem {
        #inner;
        #isFirstWatch = !0;
        #inputFileSystem;
        constructor(inputFileSystem){
            this.#inputFileSystem = inputFileSystem;
        }
        watch(files, directories, missing, startTime, options, callback, callbackUndelayed) {
            if ((!files.added || "function" != typeof files.added[Symbol.iterator]) && (!files.removed || "function" != typeof files.removed[Symbol.iterator])) throw Error("Invalid arguments: 'files'");
            if ((!directories.added || "function" != typeof directories.added[Symbol.iterator]) && (!directories.removed || "function" != typeof directories.removed[Symbol.iterator])) throw Error("Invalid arguments: 'directories'");
            if ("function" != typeof callback) throw Error("Invalid arguments: 'callback'");
            if ("object" != typeof options) throw Error("Invalid arguments: 'options'");
            if ("function" != typeof callbackUndelayed && callbackUndelayed) throw Error("Invalid arguments: 'callbackUndelayed'");
            let nativeWatcher = this.getNativeWatcher(options);
            return nativeWatcher.watch(this.formatWatchDependencies(files), this.formatWatchDependencies(directories), this.formatWatchDependencies(missing), BigInt(startTime), (err, result)=>{
                if (err) return void callback(err, new Map(), new Map(), new Set(), new Set());
                nativeWatcher.pause();
                let changedFiles = result.changedFiles, removedFiles = result.removedFiles;
                if (this.#inputFileSystem?.purge) {
                    let fs = this.#inputFileSystem;
                    for (let item of changedFiles)fs.purge?.(item);
                    for (let item of removedFiles)fs.purge?.(item);
                }
                callback(err, new Map(), new Map(), new Set(changedFiles), new Set(removedFiles));
            }, (fileName)=>{
                callbackUndelayed(fileName, Date.now());
            }), this.#isFirstWatch = !1, {
                close: ()=>{
                    nativeWatcher.close().then(()=>{
                        this.#inner = void 0;
                    }, (err)=>{
                        console.error("Error closing native watcher:", err);
                    });
                },
                pause: ()=>{
                    nativeWatcher.pause();
                },
                getInfo: ()=>({
                        changes: new Set(),
                        removals: new Set(),
                        fileTimeInfoEntries: new Map(),
                        contextTimeInfoEntries: new Map()
                    })
            };
        }
        getNativeWatcher(options) {
            if (this.#inner) return this.#inner;
            let nativeWatcherOptions = {
                followSymlinks: options.followSymlinks,
                aggregateTimeout: options.aggregateTimeout,
                pollInterval: "boolean" == typeof options.poll ? 0 : options.poll,
                ignored: ((ignored)=>{
                    if (Array.isArray(ignored) || "string" == typeof ignored || ignored instanceof RegExp) return ignored;
                    if ("function" == typeof ignored) throw Error("NativeWatcher does not support using a function for the 'ignored' option");
                })(options.ignored)
            }, nativeWatcher = new (binding_default()).NativeWatcher(nativeWatcherOptions);
            return this.#inner = nativeWatcher, nativeWatcher;
        }
        triggerEvent(kind, path) {
            this.#inner?.triggerEvent(kind, path);
        }
        formatWatchDependencies(dependencies) {
            return this.#isFirstWatch ? [
                Array.from(dependencies),
                []
            ] : [
                Array.from(dependencies.added ?? []),
                Array.from(dependencies.removed ?? [])
            ];
        }
    }
    let VFILES_BY_COMPILER = new WeakMap();
    class VirtualModulesPlugin {
        #staticModules;
        #compiler;
        #store;
        constructor(modules){
            this.#staticModules = modules || null;
        }
        apply(compiler) {
            this.#compiler = compiler, compiler.hooks.afterEnvironment.tap("VirtualModulesPlugin", ()=>{
                let record = VFILES_BY_COMPILER.get(compiler) || {};
                if (this.#staticModules) for (let [filePath, content] of Object.entries(this.#staticModules))record[external_node_path_default().resolve(compiler.context, filePath)] = content;
                VFILES_BY_COMPILER.set(compiler, record);
            });
        }
        writeModule(filePath, contents) {
            var compiler, fullPath, time;
            if (!this.#compiler) throw Error("Plugin has not been initialized");
            let store = this.getVirtualFileStore(), fullPath1 = external_node_path_default().resolve(this.#compiler.context, filePath);
            store.writeVirtualFileSync(fullPath1, contents), compiler = this.#compiler, fullPath = fullPath1, time = Date.now(), compiler.watchFileSystem instanceof NativeWatchFileSystem ? compiler.watchFileSystem.triggerEvent("change", fullPath) : function(compiler, fullPath, time) {
                var fs;
                if (compiler.watchFileSystem && "watch" in (fs = compiler.watchFileSystem)) {
                    let watcher = compiler.watchFileSystem.watcher;
                    if (!watcher) return;
                    let fileWatcher = watcher.fileWatchers.get(fullPath);
                    fileWatcher && fileWatcher.watcher.emit("change", time, null);
                }
            }(compiler, fullPath, time);
        }
        getVirtualFileStore() {
            if (this.#store) return this.#store;
            let store = this.#compiler?.__internal__get_virtual_file_store();
            if (!store) throw Error("Virtual file store has not been initialized");
            return this.#store = store, store;
        }
        static __internal__take_virtual_files(compiler) {
            let record = VFILES_BY_COMPILER.get(compiler);
            if (record) return VFILES_BY_COMPILER.delete(compiler), Object.entries(record).map(([path, content])=>({
                    path,
                    content
                }));
        }
    }
    class Watching {
        watcher;
        pausedWatcher;
        compiler;
        handler;
        callbacks;
        watchOptions;
        lastWatcherStartTime;
        running;
        blocked;
        isBlocked;
        onChange;
        onInvalid;
        invalid;
        startTime;
        #invalidReported;
        #closeCallbacks;
        #initial;
        #closed;
        #collectedChangedFiles;
        #collectedRemovedFiles;
        suspended;
        constructor(compiler, watchOptions, handler){
            this.callbacks = [], this.invalid = !1, this.#invalidReported = !0, this.blocked = !1, this.isBlocked = ()=>!1, this.onChange = ()=>{}, this.onInvalid = ()=>{}, this.compiler = compiler, this.running = !1, this.#initial = !0, this.#closed = !1, this.watchOptions = watchOptions, this.handler = handler, this.suspended = !1, "number" != typeof this.watchOptions.aggregateTimeout && (this.watchOptions.aggregateTimeout = 5), void 0 === this.watchOptions.ignored && (this.watchOptions.ignored = /[\\/](?:\.git|node_modules)[\\/]/), process.nextTick(()=>{
                this.#initial && this.#invalidate();
            });
        }
        watch(files, dirs, missing) {
            this.pausedWatcher = void 0, this.watcher = this.compiler.watchFileSystem.watch(files, dirs, missing, this.lastWatcherStartTime, this.watchOptions, (err, fileTimeInfoEntries, contextTimeInfoEntries, changedFiles, removedFiles)=>{
                if (err) return this.compiler.fileTimestamps = void 0, this.compiler.contextTimestamps = void 0, this.compiler.modifiedFiles = void 0, this.compiler.removedFiles = void 0, this.handler(err);
                this.#invalidate(fileTimeInfoEntries, contextTimeInfoEntries, changedFiles, removedFiles), this.onChange();
            }, (fileName, changeTime)=>{
                this.#invalidReported || (this.#invalidReported = !0, this.compiler.hooks.invalid.call(fileName, changeTime)), this.onInvalid();
            });
        }
        close(callback) {
            if (this.#closeCallbacks) {
                callback && this.#closeCallbacks.push(callback);
                return;
            }
            let finalCallback = (err)=>{
                this.running = !1, this.compiler.running = !1, this.compiler.watching = void 0, this.compiler.watchMode = !1, this.compiler.modifiedFiles = void 0, this.compiler.removedFiles = void 0, this.compiler.fileTimestamps = void 0, this.compiler.contextTimestamps = void 0, ((err)=>{
                    this.compiler.hooks.watchClose.call();
                    let closeCallbacks = this.#closeCallbacks;
                    for (let cb of (this.#closeCallbacks = void 0, closeCallbacks))cb(err);
                })(err);
            };
            this.#closed = !0, this.watcher && (this.watcher.close(), this.watcher = void 0), this.pausedWatcher && (this.pausedWatcher.close(), this.pausedWatcher = void 0), this.compiler.watching = void 0, this.compiler.watchMode = !1, this.#closeCallbacks = [], callback && this.#closeCallbacks.push(callback), this.running ? (this.invalid = !0, this._done = finalCallback) : finalCallback(null);
        }
        invalidate(callback) {
            callback && this.callbacks.push(callback), this.#invalidReported || (this.#invalidReported = !0, this.compiler.hooks.invalid.call(null, Date.now())), this.onChange(), this.#invalidate();
        }
        invalidateWithChangesAndRemovals(changedFiles, removedFiles, callback) {
            callback && this.callbacks.push(callback), this.#invalidReported || (this.#invalidReported = !0, this.compiler.hooks.invalid.call(null, Date.now())), this.onChange(), this.#invalidate(void 0, void 0, changedFiles, removedFiles);
        }
        #invalidate(fileTimeInfoEntries, contextTimeInfoEntries, changedFiles, removedFiles) {
            if (this.#mergeWithCollected(changedFiles, removedFiles), !(this.suspended || this.isBlocked() && (this.blocked = !0))) {
                if (this.running) {
                    this.invalid = !0;
                    return;
                }
                this.#go(fileTimeInfoEntries, contextTimeInfoEntries, changedFiles, removedFiles);
            }
        }
        #go(fileTimeInfoEntries, contextTimeInfoEntries, changedFiles, removedFiles) {
            if (this.#initial = !1, void 0 === this.startTime && (this.startTime = Date.now()), this.running = !0, this.watcher ? (this.pausedWatcher = this.watcher, this.lastWatcherStartTime = Date.now(), this.watcher.pause(), this.watcher = void 0) : this.lastWatcherStartTime || (this.lastWatcherStartTime = Date.now()), fileTimeInfoEntries && contextTimeInfoEntries && changedFiles && removedFiles) this.#mergeWithCollected(changedFiles, removedFiles), this.compiler.fileTimestamps = fileTimeInfoEntries, this.compiler.contextTimestamps = contextTimeInfoEntries;
            else if (this.pausedWatcher) {
                let { changes, removals, fileTimeInfoEntries, contextTimeInfoEntries } = this.pausedWatcher.getInfo();
                this.#mergeWithCollected(changes, removals), this.compiler.fileTimestamps = fileTimeInfoEntries, this.compiler.contextTimestamps = contextTimeInfoEntries;
            }
            this.compiler.modifiedFiles = this.#collectedChangedFiles, this.compiler.removedFiles = this.#collectedRemovedFiles, this.#collectedChangedFiles = void 0, this.#collectedRemovedFiles = void 0, this.invalid = !1, this.#invalidReported = !1, this.compiler.hooks.watchRun.callAsync(this.compiler, (err)=>{
                if (err) return this._done(err);
                let onCompiled = (err, _compilation)=>{
                    if (err) return this._done(err);
                    if (_compilation.hooks.needAdditionalPass.call()) {
                        _compilation.needAdditionalPass = !0, _compilation.startTime = this.startTime, _compilation.endTime = Date.now();
                        let stats = new Stats(_compilation);
                        this.compiler.hooks.done.callAsync(stats, (err)=>{
                            if (err) return this._done(err, _compilation);
                            this.compiler.hooks.additionalPass.callAsync((err)=>{
                                if (err) return this._done(err, _compilation);
                                this.compiler.compile(onCompiled);
                            });
                        });
                        return;
                    }
                    this._done(null, this.compiler._lastCompilation);
                };
                this.compiler.compile(onCompiled);
            });
        }
        _done(error, compilation) {
            let stats;
            this.running = !1;
            let handleError = (err, cbs)=>{
                for (let cb of (this.compiler.hooks.failed.call(err), this.handler(err, stats), cbs || this.callbacks.splice(0)))cb(err);
            };
            if (error) return handleError(error);
            if (!compilation) throw Error("compilation is required if no error");
            if (stats = new Stats(compilation), this.invalid && !this.suspended && !this.blocked && !(this.isBlocked() && (this.blocked = !0))) return void this.#go();
            let startTime = this.startTime;
            this.startTime = void 0, compilation.startTime = startTime, compilation.endTime = Date.now();
            let cbs = this.callbacks;
            this.callbacks = [];
            let fileDependencies = new Set([
                ...compilation.fileDependencies
            ]);
            fileDependencies.added = new Set(compilation.__internal__addedFileDependencies), fileDependencies.removed = new Set(compilation.__internal__removedFileDependencies);
            let contextDependencies = new Set([
                ...compilation.contextDependencies
            ]);
            contextDependencies.added = new Set(compilation.__internal__addedContextDependencies), contextDependencies.removed = new Set(compilation.__internal__removedContextDependencies);
            let missingDependencies = new Set([
                ...compilation.missingDependencies
            ]);
            missingDependencies.added = new Set(compilation.__internal__addedMissingDependencies), missingDependencies.removed = new Set(compilation.__internal__removedMissingDependencies), this.compiler.hooks.done.callAsync(stats, (err)=>{
                if (err) return handleError(err, cbs);
                for (let cb of (this.handler(null, stats), process.nextTick(()=>{
                    this.#closed || this.watch(fileDependencies, contextDependencies, missingDependencies);
                }), cbs))cb(null);
                this.compiler.hooks.afterDone.call(stats);
            });
        }
        #mergeWithCollected(changedFiles, removedFiles) {
            if (!this.#collectedChangedFiles || !this.#collectedRemovedFiles) {
                this.#collectedChangedFiles = new Set(changedFiles), this.#collectedRemovedFiles = new Set(removedFiles);
                return;
            }
            if (changedFiles) for (let file of changedFiles)this.#collectedChangedFiles.add(file), this.#collectedRemovedFiles.delete(file);
            if (removedFiles) for (let file of removedFiles)this.#collectedChangedFiles.delete(file), this.#collectedRemovedFiles.add(file);
        }
        suspend() {
            this.suspended = !0;
        }
        resume() {
            this.suspended && (this.suspended = !1, this.#invalidate());
        }
    }
    let COMPILATION_WEAK_MAP = new WeakMap();
    class Compiler {
        #instance;
        #initial;
        #compilation;
        #compilationParams;
        #builtinPlugins;
        #moduleExecutionResultsMap;
        #nonSkippableRegisters;
        #registers;
        #ruleSet;
        hooks;
        webpack;
        rspack;
        name;
        parentCompilation;
        root;
        outputPath;
        running;
        idle;
        resolverFactory;
        infrastructureLogger;
        watching;
        inputFileSystem;
        intermediateFileSystem;
        outputFileSystem;
        watchFileSystem;
        records;
        modifiedFiles;
        removedFiles;
        fileTimestamps;
        contextTimestamps;
        fsStartTime;
        watchMode;
        context;
        cache;
        compilerPath;
        options;
        unsafeFastDrop = !1;
        __internal_browser_require;
        constructor(context, options){
            this.#initial = !0, this.#builtinPlugins = [], this.#nonSkippableRegisters = [], this.#moduleExecutionResultsMap = new Map(), this.#ruleSet = new RuleSetCompiler(), this.hooks = {
                initialize: new lite_tapable_namespaceObject.SyncHook([]),
                shouldEmit: new lite_tapable_namespaceObject.SyncBailHook([
                    "compilation"
                ]),
                done: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "stats"
                ]),
                afterDone: new lite_tapable_namespaceObject.SyncHook([
                    "stats"
                ]),
                beforeRun: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "compiler"
                ]),
                run: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "compiler"
                ]),
                emit: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "compilation"
                ]),
                assetEmitted: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "file",
                    "info"
                ]),
                afterEmit: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "compilation"
                ]),
                thisCompilation: new lite_tapable_namespaceObject.SyncHook([
                    "compilation",
                    "params"
                ]),
                compilation: new lite_tapable_namespaceObject.SyncHook([
                    "compilation",
                    "params"
                ]),
                invalid: new lite_tapable_namespaceObject.SyncHook([
                    "filename",
                    "changeTime"
                ]),
                compile: new lite_tapable_namespaceObject.SyncHook([
                    "params"
                ]),
                infrastructureLog: new lite_tapable_namespaceObject.SyncBailHook([
                    "origin",
                    "type",
                    "args"
                ]),
                failed: new lite_tapable_namespaceObject.SyncHook([
                    "error"
                ]),
                shutdown: new lite_tapable_namespaceObject.AsyncSeriesHook([]),
                normalModuleFactory: new lite_tapable_namespaceObject.SyncHook([
                    "normalModuleFactory"
                ]),
                contextModuleFactory: new lite_tapable_namespaceObject.SyncHook([
                    "contextModuleFactory"
                ]),
                watchRun: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "compiler"
                ]),
                watchClose: new lite_tapable_namespaceObject.SyncHook([]),
                environment: new lite_tapable_namespaceObject.SyncHook([]),
                afterEnvironment: new lite_tapable_namespaceObject.SyncHook([]),
                afterPlugins: new lite_tapable_namespaceObject.SyncHook([
                    "compiler"
                ]),
                afterResolvers: new lite_tapable_namespaceObject.SyncHook([
                    "compiler"
                ]),
                make: new lite_tapable_namespaceObject.AsyncParallelHook([
                    "compilation"
                ]),
                beforeCompile: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "params"
                ]),
                afterCompile: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "compilation"
                ]),
                finishMake: new lite_tapable_namespaceObject.AsyncSeriesHook([
                    "compilation"
                ]),
                entryOption: new lite_tapable_namespaceObject.SyncBailHook([
                    "context",
                    "entry"
                ]),
                additionalPass: new lite_tapable_namespaceObject.AsyncSeriesHook([])
            };
            const compilerRuntimeGlobals = createCompilerRuntimeGlobals(options);
            this.webpack = {
                ...src_rspack_0,
                RuntimeGlobals: compilerRuntimeGlobals
            }, this.rspack = {
                ...src_rspack_0,
                RuntimeGlobals: compilerRuntimeGlobals
            }, this.root = this, this.outputPath = "", this.inputFileSystem = null, this.intermediateFileSystem = null, this.outputFileSystem = null, this.watchFileSystem = null, this.records = {}, this.options = options, this.context = context, this.cache = new Cache(), this.compilerPath = "", this.running = !1, this.idle = !1, this.watchMode = !1, this.__internal_browser_require = ()=>{
                throw Error("Cannot execute user defined code in browser without `BrowserRequirePlugin`");
            }, this.resolverFactory = new ResolverFactory(options.resolve.pnp ?? getPnpDefault(), options.resolve, options.resolveLoader), new JsLoaderRspackPlugin(this).apply(this), new ExecuteModulePlugin().apply(this), new TraceHookPlugin().apply(this);
        }
        get recordsInputPath() {
            return unsupported("Compiler.recordsInputPath");
        }
        get recordsOutputPath() {
            return unsupported("Compiler.recordsOutputPath");
        }
        get managedPaths() {
            return unsupported("Compiler.managedPaths");
        }
        get immutablePaths() {
            return unsupported("Compiler.immutablePaths");
        }
        get _lastCompilation() {
            return this.#compilation;
        }
        get __internal__builtinPlugins() {
            return this.#builtinPlugins;
        }
        get __internal__ruleSet() {
            return this.#ruleSet;
        }
        getCache(name) {
            return new CacheFacade(this.cache, `${this.compilerPath}${name}`, this.options.output.hashFunction);
        }
        getInfrastructureLogger(name) {
            if (!name) throw TypeError("Compiler.getInfrastructureLogger(name) called without a name");
            let normalizedName = name;
            return new Logger((type, args)=>{
                if ("function" == typeof normalizedName) {
                    if (!(normalizedName = normalizedName())) throw TypeError("Compiler.getInfrastructureLogger(name) called with a function not returning a name");
                } else void 0 === this.hooks.infrastructureLog.call(normalizedName, type, args) && void 0 !== this.infrastructureLogger && this.infrastructureLogger(normalizedName, type, args);
            }, (childName)=>{
                let normalizedChildName = childName;
                return "function" == typeof normalizedName ? "function" == typeof normalizedChildName ? this.getInfrastructureLogger(()=>{
                    if ("function" == typeof normalizedName && !(normalizedName = normalizedName())) throw TypeError("Compiler.getInfrastructureLogger(name) called with a function not returning a name");
                    if ("function" == typeof normalizedChildName && !(normalizedChildName = normalizedChildName())) throw TypeError("Logger.getChildLogger(name) called with a function not returning a name");
                    return `${normalizedName}/${normalizedChildName}`;
                }) : this.getInfrastructureLogger(()=>{
                    if ("function" == typeof normalizedName && !(normalizedName = normalizedName())) throw TypeError("Compiler.getInfrastructureLogger(name) called with a function not returning a name");
                    return `${normalizedName}/${normalizedChildName}`;
                }) : "function" == typeof normalizedChildName ? this.getInfrastructureLogger(()=>{
                    if ("function" == typeof normalizedChildName && !(normalizedChildName = normalizedChildName())) throw TypeError("Logger.getChildLogger(name) called with a function not returning a name");
                    return `${normalizedName}/${normalizedChildName}`;
                }) : this.getInfrastructureLogger(`${normalizedName}/${normalizedChildName}`);
            });
        }
        watch(watchOptions, handler) {
            return this.running ? handler(new ConcurrentCompilationError()) : (this.running = !0, this.watchMode = !0, this.watching = new Watching(this, watchOptions, handler), this.watching);
        }
        run(callback, options = {}) {
            if (this.running) return callback(new ConcurrentCompilationError());
            this.modifiedFiles = options.modifiedFiles, this.removedFiles = options.removedFiles;
            let startTime = Date.now();
            this.running = !0;
            let finalCallback = (err, stats)=>{
                this.idle = !0, this.cache.beginIdle(), this.idle = !0, this.running = !1, err && this.hooks.failed.call(err), callback && callback(err, stats), this.hooks.afterDone.call(stats);
            }, onCompiled = (err, _compilation)=>{
                if (err) return finalCallback(err);
                if (_compilation.hooks.needAdditionalPass.call()) {
                    _compilation.needAdditionalPass = !0, _compilation.startTime = startTime, _compilation.endTime = Date.now();
                    let stats = new Stats(_compilation);
                    this.hooks.done.callAsync(stats, (err)=>{
                        if (err) return finalCallback(err);
                        this.hooks.additionalPass.callAsync((err)=>{
                            if (err) return finalCallback(err);
                            this.compile(onCompiled);
                        });
                    });
                    return;
                }
                _compilation.startTime = startTime, _compilation.endTime = Date.now();
                let stats = new Stats(_compilation);
                this.hooks.done.callAsync(stats, (err)=>err ? finalCallback(err) : finalCallback(null, stats));
            }, run = ()=>{
                this.hooks.beforeRun.callAsync(this, (err)=>{
                    if (err) return finalCallback(err);
                    this.hooks.run.callAsync(this, (err)=>{
                        if (err) return finalCallback(err);
                        this.compile(onCompiled);
                    });
                });
            };
            this.idle ? this.cache.endIdle((err)=>{
                if (err) return callback(err);
                this.idle = !1, run();
            }) : run();
        }
        runAsChild(callback) {
            let finalCallback = (err, entries, compilation)=>{
                try {
                    callback(err, entries, compilation);
                } catch (e) {
                    let err = Error(`compiler.runAsChild callback error: ${e}`);
                    this.parentCompilation.errors.push(err);
                }
            };
            this.compile((err, compilation)=>{
                if (err) return finalCallback(err);
                for (let { name, source, info } of (assertNotNill(compilation), this.parentCompilation.children.push(compilation), compilation.getAssets()))source && this.parentCompilation.emitAsset(name, source, info);
                let entries = [];
                for (let ep of compilation.entrypoints.values())entries.push(...ep.chunks);
                return finalCallback(null, entries, compilation);
            });
        }
        purgeInputFileSystem() {
            this.inputFileSystem?.purge?.();
        }
        createChildCompiler(compilation, compilerName, compilerIndex, outputOptions, plugins) {
            let options = {
                ...this.options,
                output: {
                    ...this.options.output,
                    ...outputOptions
                }
            };
            applyRspackOptionsDefaults(options);
            let childCompiler = new Compiler(this.context, options);
            childCompiler.name = compilerName, childCompiler.outputPath = this.outputPath, childCompiler.inputFileSystem = this.inputFileSystem, childCompiler.outputFileSystem = null, childCompiler.modifiedFiles = this.modifiedFiles, childCompiler.removedFiles = this.removedFiles, childCompiler.fileTimestamps = this.fileTimestamps, childCompiler.contextTimestamps = this.contextTimestamps, childCompiler.fsStartTime = this.fsStartTime, childCompiler.cache = this.cache, childCompiler.compilerPath = `${this.compilerPath}${compilerName}|${compilerIndex}|`;
            let relativeCompilerName = makePathsRelative(this.context, compilerName, this.root);
            if (this.records[relativeCompilerName] || (this.records[relativeCompilerName] = []), this.records[relativeCompilerName][compilerIndex] ? childCompiler.records = this.records[relativeCompilerName][compilerIndex] : this.records[relativeCompilerName].push(childCompiler.records = {}), childCompiler.parentCompilation = compilation, childCompiler.root = this.root, Array.isArray(plugins)) for (let plugin of plugins)plugin && plugin.apply(childCompiler);
            for(let hookName in childCompiler.#builtinPlugins = [
                ...childCompiler.#builtinPlugins,
                ...this.#builtinPlugins.filter((plugin)=>!0 === plugin.canInherentFromParent)
            ], this.hooks)canInherentFromParent(hookName) && childCompiler.hooks[hookName] && (childCompiler.hooks[hookName].taps = this.hooks[hookName].taps.slice());
            return compilation.hooks.childCompiler.call(childCompiler, compilerName, compilerIndex), childCompiler;
        }
        isChild() {
            return this.root !== this;
        }
        compile(callback) {
            let startTime = Date.now(), params = this.#newCompilationParams();
            this.hooks.beforeCompile.callAsync(params, (err)=>{
                if (err) return callback(err);
                this.hooks.compile.call(params), this.#resetThisCompilation(), this.#build((err)=>{
                    if (err) return callback(err);
                    this.#compilation.startTime = startTime, this.#compilation.endTime = Date.now(), this.hooks.afterCompile.callAsync(this.#compilation, (err)=>err ? callback(err) : callback(null, this.#compilation));
                });
            });
        }
        close(callback) {
            this.watching ? this.watching.close(()=>{
                this.close(callback);
            }) : this.hooks.shutdown.callAsync((err)=>{
                if (err) return callback(err);
                this.cache.shutdown(()=>{
                    this.#instance?.close(), callback();
                });
            });
        }
        #build(callback) {
            this.#getInstance((error, instance)=>error ? callback(error) : this.#initial ? void (this.#initial = !1, instance.build(callback)) : void instance.rebuild(Array.from(this.modifiedFiles || []), Array.from(this.removedFiles || []), callback));
        }
        __internal__rebuild(modifiedFiles, removedFiles, callback) {
            this.#getInstance((error, instance)=>{
                if (error) return callback?.(error);
                instance.rebuild(Array.from(modifiedFiles || []), Array.from(removedFiles || []), (error)=>{
                    if (error) return callback?.(error);
                    callback?.(null);
                });
            });
        }
        __internal__create_compilation(native) {
            let compilation = COMPILATION_WEAK_MAP.get(native);
            return compilation || ((compilation = new Compilation(this, native)).name = this.name, COMPILATION_WEAK_MAP.set(native, compilation)), this.#compilation = compilation, compilation;
        }
        __internal__get_virtual_file_store() {
            return this.#instance?.getVirtualFileStore();
        }
        #resetThisCompilation() {
            this.#compilation = void 0, this.hooks.thisCompilation.intercept({
                call: ()=>{}
            });
        }
        #newCompilationParams() {
            let normalModuleFactory = new NormalModuleFactory(this.resolverFactory);
            this.hooks.normalModuleFactory.call(normalModuleFactory);
            let contextModuleFactory = new ContextModuleFactory();
            this.hooks.contextModuleFactory.call(contextModuleFactory);
            let params = {
                normalModuleFactory,
                contextModuleFactory
            };
            return this.#compilationParams = params, params;
        }
        #getInstance(callback) {
            var options, compiler, output, stats;
            let mode, experiments, error = CORE_VERSION === binding_default().EXPECTED_RSPACK_CORE_VERSION || CORE_VERSION.includes("canary") ? null : Error(bindingVersionCheck_errorMessage(CORE_VERSION, binding_default().EXPECTED_RSPACK_CORE_VERSION));
            if (error) return callback(error);
            if (this.#instance) return callback(null, this.#instance);
            let { options: options1 } = this, rawOptions = (options = options1, compiler = this, mode = options.mode, experiments = options.experiments, {
                name: options.name,
                mode,
                context: options.context,
                output: {
                    ...output = options.output,
                    environment: function(environment = {}) {
                        return {
                            const: !!environment.const,
                            methodShorthand: !!environment.methodShorthand,
                            arrowFunction: !!environment.arrowFunction,
                            nodePrefixForCoreModules: !!environment.nodePrefixForCoreModules,
                            asyncFunction: !!environment.asyncFunction,
                            bigIntLiteral: !!environment.bigIntLiteral,
                            destructuring: !!environment.destructuring,
                            document: !!environment.document,
                            dynamicImport: !!environment.dynamicImport,
                            forOf: !!environment.forOf,
                            globalThis: !!environment.globalThis,
                            module: !!environment.module,
                            optionalChaining: !!environment.optionalChaining,
                            templateLiteral: !!environment.templateLiteral
                        };
                    }(output.environment)
                },
                resolve: getRawResolve(options.resolve),
                resolveLoader: getRawResolve(options.resolveLoader),
                module: function(module1, options) {
                    var parser, generator;
                    if (isNil(module1.defaultRules)) throw Error("module.defaultRules should not be nil after defaults");
                    return {
                        rules: [
                            {
                                rules: module1.defaultRules
                            },
                            {
                                rules: module1.rules
                            }
                        ].map((rule, index)=>getRawModuleRule(rule, `ruleSet[${index}]`, options, "javascript/auto")),
                        parser: Object.fromEntries(Object.entries(parser = module1.parser).map(([k, v])=>[
                                k,
                                getRawParserOptions(v, k)
                            ]).filter(([k, v])=>void 0 !== v)),
                        generator: Object.fromEntries(Object.entries(generator = module1.generator).map(([k, v])=>[
                                k,
                                getRawGeneratorOptions(v, k)
                            ]).filter(([k, v])=>void 0 !== v)),
                        noParse: module1.noParse,
                        unsafeCache: module1.unsafeCache
                    };
                }(options.module, {
                    compiler,
                    mode,
                    context: options.context,
                    experiments
                }),
                optimization: options.optimization,
                stats: {
                    colors: !!function(options) {
                        if ("boolean" == typeof options || "string" == typeof options) return presetToOptions(options);
                        if (!options) return {};
                        let obj = {
                            ...presetToOptions(options.preset),
                            ...options
                        };
                        return delete obj.preset, obj;
                    }(stats = options.stats).colors
                },
                cache: {
                    type: options.cache ? "memory" : "disable"
                },
                experiments,
                node: function(node) {
                    if (!1 !== node) {
                        if (isNil(node.__dirname) || isNil(node.global) || isNil(node.__filename)) throw Error("node.__dirname, node.global, node.__filename should not be nil");
                        return {
                            dirname: String(node.__dirname),
                            filename: String(node.__filename),
                            global: String(node.global)
                        };
                    }
                }(options.node),
                profile: options.profile,
                amd: options.amd ? JSON.stringify(options.amd || {}) : void 0,
                bail: options.bail,
                __references: {}
            });
            rawOptions.__references = Object.fromEntries(this.#ruleSet.builtinReferences.entries()), rawOptions.__virtual_files = VirtualModulesPlugin.__internal__take_virtual_files(this);
            let instanceBinding = __webpack_require__("@rspack/binding");
            this.#registers = this.#createHooksRegisters();
            let inputFileSystem = this.inputFileSystem && ThreadsafeInputNodeFS.needsBinding(options1.experiments.useInputFileSystem) ? ThreadsafeInputNodeFS.__to_binding(this.inputFileSystem) : void 0;
            try {
                this.#instance = new instanceBinding.JsCompiler(this.compilerPath, rawOptions, this.#builtinPlugins, this.#registers, ThreadsafeOutputNodeFS.__to_binding(this.outputFileSystem), this.intermediateFileSystem ? ThreadsafeIntermediateNodeFS.__to_binding(this.intermediateFileSystem) : void 0, inputFileSystem, ResolverFactory.__to_binding(this.resolverFactory), this.unsafeFastDrop), callback(null, this.#instance);
            } catch (err) {
                err instanceof Error && delete err.stack, callback(Error("Failed to create Rspack compiler instance, check the Rspack configuration.", {
                    cause: err
                }));
            }
        }
        #createHooksRegisters() {
            var getCompiler, createTap;
            let getCompiler1, createTap1, getCompiler2, createTap2, createMapTap, getCompiler3, createTap3, createMapTap1, getCompiler4, createTap4, getCompiler5, getOptions, getCompiler6, createTap5, getCompiler7, createTap6, ref = new WeakRef(this), getCompiler8 = ()=>ref.deref(), createTap7 = this.#createHookRegisterTaps.bind(this), createMapTap2 = this.#createHookMapRegisterTaps.bind(this);
            return {
                ...(getCompiler1 = getCompiler8, {
                    registerCompilerThisCompilationTaps: (createTap1 = createTap7)(binding_default().RegisterJsTapKind.CompilerThisCompilation, function() {
                        return getCompiler1().hooks.thisCompilation;
                    }, function(queried) {
                        return function(native) {
                            return getCompiler1().__internal__create_compilation(native), queried.call(getCompiler1().__internal__get_compilation(), getCompiler1().__internal__get_compilation_params());
                        };
                    }),
                    registerCompilerCompilationTaps: createTap1(binding_default().RegisterJsTapKind.CompilerCompilation, function() {
                        return getCompiler1().hooks.compilation;
                    }, function(queried) {
                        return function() {
                            return queried.call(getCompiler1().__internal__get_compilation(), getCompiler1().__internal__get_compilation_params());
                        };
                    }),
                    registerCompilerMakeTaps: createTap1(binding_default().RegisterJsTapKind.CompilerMake, function() {
                        return getCompiler1().hooks.make;
                    }, function(queried) {
                        return async function() {
                            return await queried.promise(getCompiler1().__internal__get_compilation());
                        };
                    }),
                    registerCompilerFinishMakeTaps: createTap1(binding_default().RegisterJsTapKind.CompilerFinishMake, function() {
                        return getCompiler1().hooks.finishMake;
                    }, function(queried) {
                        return async function() {
                            return await queried.promise(getCompiler1().__internal__get_compilation());
                        };
                    }),
                    registerCompilerShouldEmitTaps: createTap1(binding_default().RegisterJsTapKind.CompilerShouldEmit, function() {
                        return getCompiler1().hooks.shouldEmit;
                    }, function(queried) {
                        return function() {
                            return queried.call(getCompiler1().__internal__get_compilation());
                        };
                    }),
                    registerCompilerEmitTaps: createTap1(binding_default().RegisterJsTapKind.CompilerEmit, function() {
                        return getCompiler1().hooks.emit;
                    }, function(queried) {
                        return async function() {
                            return await queried.promise(getCompiler1().__internal__get_compilation());
                        };
                    }),
                    registerCompilerAfterEmitTaps: createTap1(binding_default().RegisterJsTapKind.CompilerAfterEmit, function() {
                        return getCompiler1().hooks.afterEmit;
                    }, function(queried) {
                        return async function() {
                            return await queried.promise(getCompiler1().__internal__get_compilation());
                        };
                    }),
                    registerCompilerAssetEmittedTaps: createTap1(binding_default().RegisterJsTapKind.CompilerAssetEmitted, function() {
                        return getCompiler1().hooks.assetEmitted;
                    }, function(queried) {
                        return async function({ filename, targetPath, outputPath }) {
                            return queried.promise(filename, {
                                compilation: getCompiler1().__internal__get_compilation(),
                                targetPath,
                                outputPath,
                                get source () {
                                    let source = getCompiler1().__internal__get_compilation().getAsset(filename)?.source;
                                    if (!source) throw Error(`Asset ${filename} not found`);
                                    return source;
                                },
                                get content () {
                                    return this.source?.buffer();
                                }
                            });
                        };
                    })
                }),
                ...(getCompiler2 = getCompiler8, createTap2 = createTap7, createMapTap = createMapTap2, {
                    registerCompilationAdditionalTreeRuntimeRequirementsTaps: createTap2(binding_default().RegisterJsTapKind.CompilationAdditionalTreeRuntimeRequirements, function() {
                        return getCompiler2().__internal__get_compilation().hooks.additionalTreeRuntimeRequirements;
                    }, function(queried) {
                        return function({ chunk, runtimeRequirements }) {
                            let set = __from_binding_runtime_globals(runtimeRequirements, getCompiler2().rspack.RuntimeGlobals);
                            return queried.call(chunk, set), {
                                runtimeRequirements: __to_binding_runtime_globals(set, getCompiler2().rspack.RuntimeGlobals)
                            };
                        };
                    }),
                    registerCompilationRuntimeRequirementInTreeTaps: createMapTap(binding_default().RegisterJsTapKind.CompilationRuntimeRequirementInTree, function() {
                        return getCompiler2().__internal__get_compilation().hooks.runtimeRequirementInTree;
                    }, function(queried) {
                        return function({ chunk, allRuntimeRequirements, runtimeRequirements }) {
                            let set = __from_binding_runtime_globals(runtimeRequirements, getCompiler2().rspack.RuntimeGlobals), all = __from_binding_runtime_globals(allRuntimeRequirements, getCompiler2().rspack.RuntimeGlobals), customRuntimeGlobals = new Set(), originalAdd = all.add.bind(all), add = function(r) {
                                let r1;
                                return all.has(r) ? all : (r1 = r, Object.values(getCompiler2().rspack.RuntimeGlobals).includes(r1) || customRuntimeGlobals.add(r), originalAdd(r));
                            };
                            for (let r of (all.add = add.bind(add), set))queried.for(r).call(chunk, all);
                            for (let r of customRuntimeGlobals)queried.for(r).call(chunk, all);
                            return {
                                allRuntimeRequirements: __to_binding_runtime_globals(all, getCompiler2().rspack.RuntimeGlobals)
                            };
                        };
                    }),
                    registerCompilationRuntimeModuleTaps: createTap2(binding_default().RegisterJsTapKind.CompilationRuntimeModule, function() {
                        return getCompiler2().__internal__get_compilation().hooks.runtimeModule;
                    }, function(queried) {
                        return function({ module: module1, chunk }) {
                            let originSource = module1.source?.source;
                            queried.call(module1, chunk);
                            let newSource = module1.source?.source;
                            if (newSource && newSource !== originSource) return module1;
                        };
                    }),
                    registerCompilationBuildModuleTaps: createTap2(binding_default().RegisterJsTapKind.CompilationBuildModule, function() {
                        return getCompiler2().__internal__get_compilation().hooks.buildModule;
                    }, function(queried) {
                        return function(module1) {
                            return queried.call(module1);
                        };
                    }),
                    registerCompilationStillValidModuleTaps: createTap2(binding_default().RegisterJsTapKind.CompilationStillValidModule, function() {
                        return getCompiler2().__internal__get_compilation().hooks.stillValidModule;
                    }, function(queried) {
                        return function(module1) {
                            return queried.call(module1);
                        };
                    }),
                    registerCompilationSucceedModuleTaps: createTap2(binding_default().RegisterJsTapKind.CompilationSucceedModule, function() {
                        return getCompiler2().__internal__get_compilation().hooks.succeedModule;
                    }, function(queried) {
                        return function(module1) {
                            return queried.call(module1);
                        };
                    }),
                    registerCompilationExecuteModuleTaps: createTap2(binding_default().RegisterJsTapKind.CompilationExecuteModule, function() {
                        return getCompiler2().__internal__get_compilation().hooks.executeModule;
                    }, function(queried) {
                        return function({ entry, id, codegenResults, runtimeModules }) {
                            try {
                                let RuntimeGlobals = getCompiler2().rspack.RuntimeGlobals, moduleRequireFn = (id)=>{
                                    let cached = moduleCache[id];
                                    if (void 0 !== cached) {
                                        if (cached.error) throw cached.error;
                                        return cached.exports;
                                    }
                                    let execOptions = {
                                        id,
                                        module: {
                                            id,
                                            exports: {},
                                            loaded: !1,
                                            error: void 0
                                        },
                                        require: moduleRequireFn
                                    };
                                    for (let handler of interceptModuleExecution)handler(execOptions);
                                    let result = codegenResults.map[id]["build time"], moduleObject = execOptions.module;
                                    return id && (moduleCache[id] = moduleObject), ((fn, hook)=>{
                                        try {
                                            fn();
                                        } catch (err) {
                                            if (err instanceof lib_WebpackError) throw err;
                                            throw new HookWebpackError(err, hook);
                                        }
                                    })(()=>queried.call({
                                            codeGenerationResult: new CodeGenerationResult(result),
                                            moduleObject
                                        }, {
                                            [`${RuntimeGlobals.require}`]: moduleRequireFn
                                        }), "Compilation.hooks.executeModule"), moduleObject.loaded = !0, moduleObject.exports;
                                }, moduleCache = moduleRequireFn[`${RuntimeGlobals.moduleCache}`.replace(`${RuntimeGlobals.require}.`, "")] = {}, interceptModuleExecution = moduleRequireFn[`${RuntimeGlobals.interceptModuleExecution}`.replace(`${RuntimeGlobals.require}.`, "")] = [];
                                for (let runtimeModule of runtimeModules)moduleRequireFn(runtimeModule);
                                let executeResult = moduleRequireFn(entry);
                                getCompiler2().__internal__get_module_execution_results_map().set(id, executeResult);
                            } catch (e) {
                                throw getCompiler2().__internal__get_module_execution_results_map().set(id, e), e;
                            }
                        };
                    }),
                    registerCompilationFinishModulesTaps: createTap2(binding_default().RegisterJsTapKind.CompilationFinishModules, function() {
                        return getCompiler2().__internal__get_compilation().hooks.finishModules;
                    }, function(queried) {
                        return async function() {
                            return await queried.promise(getCompiler2().__internal__get_compilation().modules);
                        };
                    }),
                    registerCompilationOptimizeModulesTaps: createTap2(binding_default().RegisterJsTapKind.CompilationOptimizeModules, function() {
                        return getCompiler2().__internal__get_compilation().hooks.optimizeModules;
                    }, function(queried) {
                        return function() {
                            return queried.call(getCompiler2().__internal__get_compilation().modules.values());
                        };
                    }),
                    registerCompilationAfterOptimizeModulesTaps: createTap2(binding_default().RegisterJsTapKind.CompilationAfterOptimizeModules, function() {
                        return getCompiler2().__internal__get_compilation().hooks.afterOptimizeModules;
                    }, function(queried) {
                        return function() {
                            queried.call(getCompiler2().__internal__get_compilation().modules.values());
                        };
                    }),
                    registerCompilationOptimizeTreeTaps: createTap2(binding_default().RegisterJsTapKind.CompilationOptimizeTree, function() {
                        return getCompiler2().__internal__get_compilation().hooks.optimizeTree;
                    }, function(queried) {
                        return async function() {
                            return await queried.promise(getCompiler2().__internal__get_compilation().chunks, getCompiler2().__internal__get_compilation().modules);
                        };
                    }),
                    registerCompilationOptimizeChunkModulesTaps: createTap2(binding_default().RegisterJsTapKind.CompilationOptimizeChunkModules, function() {
                        return getCompiler2().__internal__get_compilation().hooks.optimizeChunkModules;
                    }, function(queried) {
                        return async function() {
                            return await queried.promise(getCompiler2().__internal__get_compilation().chunks, getCompiler2().__internal__get_compilation().modules);
                        };
                    }),
                    registerCompilationChunkHashTaps: createTap2(binding_default().RegisterJsTapKind.CompilationChunkHash, function() {
                        return getCompiler2().__internal__get_compilation().hooks.chunkHash;
                    }, function(queried) {
                        return function(chunk) {
                            let digestResult;
                            if (!getCompiler2().options.output.hashFunction) throw Error("'output.hashFunction' cannot be undefined");
                            let hash = createHash_createHash(getCompiler2().options.output.hashFunction);
                            return queried.call(chunk, hash), "string" == typeof (digestResult = getCompiler2().options.output.hashDigest ? hash.digest(getCompiler2().options.output.hashDigest) : hash.digest()) ? Buffer.from(digestResult) : digestResult;
                        };
                    }),
                    registerCompilationChunkAssetTaps: createTap2(binding_default().RegisterJsTapKind.CompilationChunkAsset, function() {
                        return getCompiler2().__internal__get_compilation().hooks.chunkAsset;
                    }, function(queried) {
                        return function({ chunk, filename }) {
                            return queried.call(chunk, filename);
                        };
                    }),
                    registerCompilationProcessAssetsTaps: createTap2(binding_default().RegisterJsTapKind.CompilationProcessAssets, function() {
                        return getCompiler2().__internal__get_compilation().hooks.processAssets;
                    }, function(queried) {
                        return async function() {
                            return await queried.promise(getCompiler2().__internal__get_compilation().assets);
                        };
                    }),
                    registerCompilationAfterProcessAssetsTaps: createTap2(binding_default().RegisterJsTapKind.CompilationAfterProcessAssets, function() {
                        return getCompiler2().__internal__get_compilation().hooks.afterProcessAssets;
                    }, function(queried) {
                        return function() {
                            return queried.call(getCompiler2().__internal__get_compilation().assets);
                        };
                    }),
                    registerCompilationSealTaps: createTap2(binding_default().RegisterJsTapKind.CompilationSeal, function() {
                        return getCompiler2().__internal__get_compilation().hooks.seal;
                    }, function(queried) {
                        return function() {
                            return queried.call();
                        };
                    }),
                    registerCompilationAfterSealTaps: createTap2(binding_default().RegisterJsTapKind.CompilationAfterSeal, function() {
                        return getCompiler2().__internal__get_compilation().hooks.afterSeal;
                    }, function(queried) {
                        return async function() {
                            return await queried.promise();
                        };
                    })
                }),
                ...(getCompiler3 = getCompiler8, createTap3 = createTap7, createMapTap1 = createMapTap2, {
                    registerNormalModuleFactoryBeforeResolveTaps: createTap3(binding_default().RegisterJsTapKind.NormalModuleFactoryBeforeResolve, function() {
                        return getCompiler3().__internal__get_compilation_params().normalModuleFactory.hooks.beforeResolve;
                    }, function(queried) {
                        return async function(resolveData) {
                            return [
                                await queried.promise(resolveData),
                                resolveData
                            ];
                        };
                    }),
                    registerNormalModuleFactoryFactorizeTaps: createTap3(binding_default().RegisterJsTapKind.NormalModuleFactoryFactorize, function() {
                        return getCompiler3().__internal__get_compilation_params().normalModuleFactory.hooks.factorize;
                    }, function(queried) {
                        return async function(resolveData) {
                            return await queried.promise(resolveData), resolveData;
                        };
                    }),
                    registerNormalModuleFactoryResolveTaps: createTap3(binding_default().RegisterJsTapKind.NormalModuleFactoryResolve, function() {
                        return getCompiler3().__internal__get_compilation_params().normalModuleFactory.hooks.resolve;
                    }, function(queried) {
                        return async function(resolveData) {
                            return await queried.promise(resolveData), resolveData;
                        };
                    }),
                    registerNormalModuleFactoryResolveForSchemeTaps: createMapTap1(binding_default().RegisterJsTapKind.NormalModuleFactoryResolveForScheme, function() {
                        return getCompiler3().__internal__get_compilation_params().normalModuleFactory.hooks.resolveForScheme;
                    }, function(queried) {
                        return async function(args) {
                            return [
                                await queried.for(args.scheme).promise(args.resourceData),
                                args.resourceData
                            ];
                        };
                    }),
                    registerNormalModuleFactoryAfterResolveTaps: createTap3(binding_default().RegisterJsTapKind.NormalModuleFactoryAfterResolve, function() {
                        return getCompiler3().__internal__get_compilation_params().normalModuleFactory.hooks.afterResolve;
                    }, function(queried) {
                        return async function(resolveData) {
                            return [
                                await queried.promise(resolveData),
                                resolveData
                            ];
                        };
                    }),
                    registerNormalModuleFactoryCreateModuleTaps: createTap3(binding_default().RegisterJsTapKind.NormalModuleFactoryCreateModule, function() {
                        return getCompiler3().__internal__get_compilation_params().normalModuleFactory.hooks.createModule;
                    }, function(queried) {
                        return async function(args) {
                            let data = {
                                ...args,
                                settings: {}
                            };
                            await queried.promise(data, {});
                        };
                    })
                }),
                ...(getCompiler4 = getCompiler8, {
                    registerContextModuleFactoryBeforeResolveTaps: (createTap4 = createTap7)(binding_default().RegisterJsTapKind.ContextModuleFactoryBeforeResolve, function() {
                        return getCompiler4().__internal__get_compilation_params().contextModuleFactory.hooks.beforeResolve;
                    }, function(queried) {
                        return async function(bindingData) {
                            let data = !!bindingData && ContextModuleFactoryBeforeResolveData.__from_binding(bindingData), result = await queried.promise(data);
                            return !!result && ContextModuleFactoryBeforeResolveData.__to_binding(result);
                        };
                    }),
                    registerContextModuleFactoryAfterResolveTaps: createTap4(binding_default().RegisterJsTapKind.ContextModuleFactoryAfterResolve, function() {
                        return getCompiler4().__internal__get_compilation_params().contextModuleFactory.hooks.afterResolve;
                    }, function(queried) {
                        return async function(bindingData) {
                            let data = !!bindingData && ContextModuleFactoryAfterResolveData.__from_binding(bindingData), result = await queried.promise(data);
                            return !!result && ContextModuleFactoryAfterResolveData.__to_binding(result);
                        };
                    })
                }),
                ...(getCompiler5 = getCompiler8, {
                    registerJavascriptModulesChunkHashTaps: createTap7(binding_default().RegisterJsTapKind.JavascriptModulesChunkHash, function() {
                        return JavascriptModulesPlugin.getCompilationHooks(getCompiler5().__internal__get_compilation()).chunkHash;
                    }, function(queried) {
                        return function(chunk) {
                            let digestResult;
                            if (!getCompiler5().options.output.hashFunction) throw Error("'output.hashFunction' cannot be undefined");
                            let hash = createHash_createHash(getCompiler5().options.output.hashFunction);
                            return queried.call(chunk, hash), "string" == typeof (digestResult = getCompiler5().options.output.hashDigest ? hash.digest(getCompiler5().options.output.hashDigest) : hash.digest()) ? Buffer.from(digestResult) : digestResult;
                        };
                    })
                }),
                ...(getCompiler = getCompiler8, createTap = createTap7, getOptions = (uid)=>((compilation, uid)=>{
                        if (!(compilation instanceof Compilation)) throw TypeError("The 'compilation' argument must be an instance of Compilation");
                        return compilationOptionsMap.get(compilation)?.[uid];
                    })(getCompiler().__internal__get_compilation(), uid), {
                    registerHtmlPluginBeforeAssetTagGenerationTaps: createTap(binding_default().RegisterJsTapKind.HtmlPluginBeforeAssetTagGeneration, function() {
                        return HtmlRspackPlugin.getCompilationHooks(getCompiler().__internal__get_compilation()).beforeAssetTagGeneration;
                    }, function(queried) {
                        return async function(data) {
                            let { compilationId, uid } = data, res = await queried.promise({
                                ...data,
                                plugin: {
                                    options: getOptions(uid)
                                }
                            });
                            return res.compilationId = compilationId, res.uid = uid, res;
                        };
                    }),
                    registerHtmlPluginAlterAssetTagsTaps: createTap(binding_default().RegisterJsTapKind.HtmlPluginAlterAssetTags, function() {
                        return HtmlRspackPlugin.getCompilationHooks(getCompiler().__internal__get_compilation()).alterAssetTags;
                    }, function(queried) {
                        return async function(data) {
                            let { compilationId, uid } = data, res = await queried.promise({
                                ...data,
                                plugin: {
                                    options: getOptions(uid)
                                }
                            });
                            return res.compilationId = compilationId, res.uid = uid, res;
                        };
                    }),
                    registerHtmlPluginAlterAssetTagGroupsTaps: createTap(binding_default().RegisterJsTapKind.HtmlPluginAlterAssetTagGroups, function() {
                        return HtmlRspackPlugin.getCompilationHooks(getCompiler().__internal__get_compilation()).alterAssetTagGroups;
                    }, function(queried) {
                        return async function(data) {
                            let { compilationId, uid } = data, res = await queried.promise({
                                ...data,
                                plugin: {
                                    options: getOptions(uid)
                                }
                            });
                            return res.compilationId = compilationId, res.uid = uid, res;
                        };
                    }),
                    registerHtmlPluginAfterTemplateExecutionTaps: createTap(binding_default().RegisterJsTapKind.HtmlPluginAfterTemplateExecution, function() {
                        return HtmlRspackPlugin.getCompilationHooks(getCompiler().__internal__get_compilation()).afterTemplateExecution;
                    }, function(queried) {
                        return async function(data) {
                            let { compilationId, uid } = data, res = await queried.promise({
                                ...data,
                                plugin: {
                                    options: getOptions(uid)
                                }
                            });
                            return res.compilationId = compilationId, res;
                        };
                    }),
                    registerHtmlPluginBeforeEmitTaps: createTap(binding_default().RegisterJsTapKind.HtmlPluginBeforeEmit, function() {
                        return HtmlRspackPlugin.getCompilationHooks(getCompiler().__internal__get_compilation()).beforeEmit;
                    }, function(queried) {
                        return async function(data) {
                            let { compilationId, uid } = data, res = await queried.promise({
                                ...data,
                                plugin: {
                                    options: getOptions(uid)
                                }
                            });
                            return res.compilationId = compilationId, res.uid = uid, res;
                        };
                    }),
                    registerHtmlPluginAfterEmitTaps: createTap(binding_default().RegisterJsTapKind.HtmlPluginAfterEmit, function() {
                        return HtmlRspackPlugin.getCompilationHooks(getCompiler().__internal__get_compilation()).afterEmit;
                    }, function(queried) {
                        return async function(data) {
                            let { compilationId, uid } = data, res = await queried.promise({
                                ...data,
                                plugin: {
                                    options: getOptions(uid)
                                }
                            });
                            return res.compilationId = compilationId, res.uid = uid, res;
                        };
                    })
                }),
                ...(getCompiler6 = getCompiler8, {
                    registerRuntimePluginCreateScriptTaps: (createTap5 = createTap7)(binding_default().RegisterJsTapKind.RuntimePluginCreateScript, function() {
                        return RuntimePlugin.getCompilationHooks(getCompiler6().__internal__get_compilation()).createScript;
                    }, function(queried) {
                        return function(data) {
                            return queried.call(data.code, data.chunk);
                        };
                    }),
                    registerRuntimePluginCreateLinkTaps: createTap5(binding_default().RegisterJsTapKind.RuntimePluginCreateLink, function() {
                        return RuntimePlugin.getCompilationHooks(getCompiler6().__internal__get_compilation()).createLink;
                    }, function(queried) {
                        return function(data) {
                            return queried.call(data.code, data.chunk);
                        };
                    }),
                    registerRuntimePluginLinkPreloadTaps: createTap5(binding_default().RegisterJsTapKind.RuntimePluginLinkPreload, function() {
                        return RuntimePlugin.getCompilationHooks(getCompiler6().__internal__get_compilation()).linkPreload;
                    }, function(queried) {
                        return function(data) {
                            return queried.call(data.code, data.chunk);
                        };
                    }),
                    registerRuntimePluginLinkPrefetchTaps: createTap5(binding_default().RegisterJsTapKind.RuntimePluginLinkPrefetch, function() {
                        return RuntimePlugin.getCompilationHooks(getCompiler6().__internal__get_compilation()).linkPrefetch;
                    }, function(queried) {
                        return function(data) {
                            return queried.call(data.code, data.chunk);
                        };
                    })
                }),
                ...(getCompiler7 = getCompiler8, {
                    registerRsdoctorPluginModuleGraphTaps: (createTap6 = createTap7)(binding_.RegisterJsTapKind.RsdoctorPluginModuleGraph, function() {
                        return RsdoctorPluginImpl.getCompilationHooks(getCompiler7().__internal__get_compilation()).moduleGraph;
                    }, function(queried) {
                        return async function(data) {
                            return await queried.promise(data);
                        };
                    }),
                    registerRsdoctorPluginChunkGraphTaps: createTap6(binding_.RegisterJsTapKind.RsdoctorPluginChunkGraph, function() {
                        return RsdoctorPluginImpl.getCompilationHooks(getCompiler7().__internal__get_compilation()).chunkGraph;
                    }, function(queried) {
                        return async function(data) {
                            return await queried.promise(data);
                        };
                    }),
                    registerRsdoctorPluginModuleIdsTaps: createTap6(binding_.RegisterJsTapKind.RsdoctorPluginModuleIds, function() {
                        return RsdoctorPluginImpl.getCompilationHooks(getCompiler7().__internal__get_compilation()).moduleIds;
                    }, function(queried) {
                        return async function(data) {
                            return await queried.promise(data);
                        };
                    }),
                    registerRsdoctorPluginModuleSourcesTaps: createTap6(binding_.RegisterJsTapKind.RsdoctorPluginModuleSources, function() {
                        return RsdoctorPluginImpl.getCompilationHooks(getCompiler7().__internal__get_compilation()).moduleSources;
                    }, function(queried) {
                        return async function(data) {
                            return await queried.promise(data);
                        };
                    }),
                    registerRsdoctorPluginAssetsTaps: createTap6(binding_.RegisterJsTapKind.RsdoctorPluginAssets, function() {
                        return RsdoctorPluginImpl.getCompilationHooks(getCompiler7().__internal__get_compilation()).assets;
                    }, function(queried) {
                        return async function(data) {
                            return await queried.promise(data);
                        };
                    })
                })
            };
        }
        #updateNonSkippableRegisters() {
            let kinds = [];
            for (let { getHook, getHookMap, registerKind } of Object.values(this.#registers))(getHook ?? getHookMap)().isUsed() && kinds.push(registerKind);
            this.#nonSkippableRegisters.join() !== kinds.join() && this.#getInstance((_error, instance)=>{
                instance.setNonSkippableRegisters(kinds), this.#nonSkippableRegisters = kinds;
            });
        }
        #decorateJsTaps(jsTaps) {
            if (jsTaps.length > 0) {
                let last = jsTaps[jsTaps.length - 1], old = last.function;
                last.function = (...args)=>{
                    let result = old(...args);
                    return result && "function" == typeof result.then ? result.then((r)=>(this.#updateNonSkippableRegisters(), r)) : (this.#updateNonSkippableRegisters(), result);
                };
            }
        }
        #createHookRegisterTaps(registerKind, getHook, createTap) {
            let that = new WeakRef(this), getTaps = (stages)=>{
                let compiler = that.deref(), hook = getHook();
                if (!hook.isUsed()) return [];
                let breakpoints = [
                    lite_tapable_namespaceObject.minStage,
                    ...stages,
                    lite_tapable_namespaceObject.maxStage
                ], jsTaps = [];
                for(let i = 0; i < breakpoints.length - 1; i++){
                    let from = breakpoints[i], stageRange = [
                        from,
                        breakpoints[i + 1]
                    ], queried = hook.queryStageRange(stageRange);
                    queried.isUsed() && jsTaps.push({
                        function: createTap(queried),
                        stage: lite_tapable_namespaceObject.safeStage(from + 1)
                    });
                }
                return compiler.#decorateJsTaps(jsTaps), jsTaps;
            };
            return getTaps.registerKind = registerKind, getTaps.getHook = getHook, getTaps;
        }
        #createHookMapRegisterTaps(registerKind, getHookMap, createTap) {
            let that = new WeakRef(this), getTaps = (stages)=>{
                let compiler = that.deref(), map = getHookMap();
                if (!map.isUsed()) return [];
                let breakpoints = [
                    lite_tapable_namespaceObject.minStage,
                    ...stages,
                    lite_tapable_namespaceObject.maxStage
                ], jsTaps = [];
                for(let i = 0; i < breakpoints.length - 1; i++){
                    let from = breakpoints[i], stageRange = [
                        from,
                        breakpoints[i + 1]
                    ], queried = map.queryStageRange(stageRange);
                    queried.isUsed() && jsTaps.push({
                        function: createTap(queried),
                        stage: lite_tapable_namespaceObject.safeStage(from + 1)
                    });
                }
                return compiler.#decorateJsTaps(jsTaps), jsTaps;
            };
            return getTaps.registerKind = registerKind, getTaps.getHookMap = getHookMap, getTaps;
        }
        __internal__registerBuiltinPlugin(plugin) {
            this.#builtinPlugins.push(plugin);
        }
        __internal__takeModuleExecutionResult(id) {
            let result = this.#moduleExecutionResultsMap.get(id);
            return this.#moduleExecutionResultsMap.delete(id), result;
        }
        __internal__get_compilation() {
            return this.#compilation;
        }
        __internal__get_compilation_params() {
            return this.#compilationParams;
        }
        __internal__get_module_execution_results_map() {
            return this.#moduleExecutionResultsMap;
        }
    }
    class MultiStats {
        stats;
        constructor(stats){
            this.stats = stats;
        }
        get hash() {
            return this.stats.map((stat)=>stat.hash).join("");
        }
        hasErrors() {
            return this.stats.some((stat)=>stat.hasErrors());
        }
        hasWarnings() {
            return this.stats.some((stat)=>stat.hasWarnings());
        }
        #createChildOptions(options = {}, context) {
            let { children: childrenOptions, ...baseOptions } = "string" == typeof options || "boolean" == typeof options ? {
                preset: options
            } : options, children = this.stats.map((stat, idx)=>{
                let childOptions = Array.isArray(childrenOptions) ? childrenOptions[idx] : childrenOptions;
                return stat.compilation.createStatsOptions({
                    ...baseOptions,
                    ..."string" == typeof childOptions ? {
                        preset: childOptions
                    } : childOptions && "object" == typeof childOptions ? childOptions : void 0
                }, context);
            });
            return {
                hash: children.every((o)=>o.hash),
                errorsCount: children.every((o)=>o.errorsCount),
                warningsCount: children.every((o)=>o.warningsCount),
                errors: children.every((o)=>o.errors),
                warnings: children.every((o)=>o.warnings),
                children,
                context: "",
                version: ""
            };
        }
        toJson(options) {
            let childOptions = this.#createChildOptions(options, {
                forToString: !1
            }), obj = {};
            obj.children = this.stats.map((stat, idx)=>{
                let obj = stat.toJson(childOptions.children[idx]), compilationName = stat.compilation.name;
                return obj.name = compilationName && makePathsRelative(childOptions.context, compilationName, stat.compilation.compiler.root), obj;
            }), childOptions.version && (obj.rspackVersion = "1.6.8", obj.version = "5.75.0"), childOptions.hash && (obj.hash = obj.children.map((j)=>j.hash).join(""));
            let mapError = (j, obj)=>({
                    ...obj,
                    compilerPath: obj.compilerPath ? `${j.name}.${obj.compilerPath}` : j.name
                });
            if (childOptions.errors) for (let j of (obj.errors = [], obj.children))for (let i of j.errors || [])obj.errors.push(mapError(j, i));
            if (childOptions.warnings) for (let j of (obj.warnings = [], obj.children))for (let i of j.warnings || [])obj.warnings.push(mapError(j, i));
            if (childOptions.errorsCount) for (let j of (obj.errorsCount = 0, obj.children))obj.errorsCount += j.errorsCount || 0;
            if (childOptions.warningsCount) for (let j of (obj.warningsCount = 0, obj.children))obj.warningsCount += j.warningsCount || 0;
            return obj;
        }
        toString(options) {
            let childOptions = this.#createChildOptions(options, {
                forToString: !0
            });
            return this.stats.map((stat, idx)=>{
                let rem, str = stat.toString(childOptions.children[idx]), compilationName = stat.compilation.name, name = compilationName && makePathsRelative(childOptions.context, compilationName, stat.compilation.compiler.root).replace(/\|/g, " ");
                return str ? name ? `${name}:\n${"  " + (rem = str.replace(/\n([^\n])/g, `\n  $1`))}` : str : str;
            }).filter(Boolean).join("\n\n");
        }
    }
    function throwError() {
        throw Error("Callback was already called.");
    }
    function asyncLib_noop() {}
    function once(func) {
        return (err)=>{
            let fn = func;
            func = asyncLib_noop, fn(err);
        };
    }
    let asyncLib_each = function(collection, iterator, originalCallback) {
        let callback = once(originalCallback), size = 0, completed = 0;
        if (Array.isArray(collection)) {
            size = collection.length;
            var array = collection, iterator1 = iterator, callback1 = (err)=>{
                err ? (callback = once(callback))(err) : ++completed === size && callback(null);
            };
            let index = -1;
            for(; ++index < array.length;)iterator1(array[index], function(func) {
                return (err)=>{
                    let fn = func;
                    func = throwError, fn(err);
                };
            }(callback1));
        }
        size || callback(null);
    }, src_MultiWatching = class {
        watchings;
        compiler;
        constructor(watchings, compiler){
            this.watchings = watchings, this.compiler = compiler;
        }
        invalidate(callback) {
            if (callback) asyncLib_each(this.watchings, (watching, callback)=>watching.invalidate(callback), callback);
            else for (let watching of this.watchings)watching.invalidate();
        }
        invalidateWithChangesAndRemovals(changedFiles, removedFiles, callback) {
            if (callback) asyncLib_each(this.watchings, (watching, callback)=>watching.invalidateWithChangesAndRemovals(changedFiles, removedFiles, callback), callback);
            else for (let watching of this.watchings)watching.invalidateWithChangesAndRemovals(changedFiles, removedFiles);
        }
        close(callback) {
            asyncLib_each(this.watchings, (watching, finishedCallback)=>{
                watching.close(finishedCallback);
            }, (err)=>{
                this.compiler.hooks.watchClose.call(), "function" == typeof callback && (this.compiler.running = !1, callback(err));
            });
        }
        suspend() {
            for (let watching of this.watchings)watching.suspend();
        }
        resume() {
            for (let watching of this.watchings)watching.resume();
        }
    };
    ArrayQueue_computedKey = Symbol.iterator;
    let util_ArrayQueue = class {
        _list;
        _listReversed;
        constructor(items){
            this._list = items ? Array.from(items) : [], this._listReversed = [];
        }
        get length() {
            return this._list.length + this._listReversed.length;
        }
        clear() {
            this._list.length = 0, this._listReversed.length = 0;
        }
        enqueue(item) {
            this._list.push(item);
        }
        dequeue() {
            if (0 === this._listReversed.length) {
                if (0 === this._list.length) return;
                if (1 === this._list.length) return this._list.pop();
                if (this._list.length < 16) return this._list.shift();
                let temp = this._listReversed;
                this._listReversed = this._list, this._listReversed.reverse(), this._list = temp;
            }
            return this._listReversed.pop();
        }
        delete(item) {
            let i = this._list.indexOf(item);
            if (i >= 0) this._list.splice(i, 1);
            else {
                let i = this._listReversed.indexOf(item);
                i >= 0 && this._listReversed.splice(i, 1);
            }
        }
        *[ArrayQueue_computedKey]() {
            yield* this._list;
            for(let i = this._listReversed.length - 1; i >= 0; i--)yield this._listReversed[i];
        }
    };
    class MultiCompiler {
        compilers;
        dependencies;
        hooks;
        _options;
        running;
        watching;
        constructor(compilers, options){
            let normalizedCompilers;
            normalizedCompilers = Array.isArray(compilers) ? compilers : Object.entries(compilers).map(([name, compiler])=>(compiler.name = name, compiler)), this.hooks = {
                done: new lite_tapable_namespaceObject.SyncHook([
                    "stats"
                ]),
                invalid: new lite_tapable_namespaceObject.MultiHook(normalizedCompilers.map((c)=>c.hooks.invalid)),
                run: new lite_tapable_namespaceObject.MultiHook(normalizedCompilers.map((c)=>c.hooks.run)),
                watchClose: new lite_tapable_namespaceObject.SyncHook([]),
                watchRun: new lite_tapable_namespaceObject.MultiHook(normalizedCompilers.map((c)=>c.hooks.watchRun)),
                beforeCompile: new lite_tapable_namespaceObject.MultiHook(normalizedCompilers.map((c)=>c.hooks.beforeCompile)),
                shutdown: new lite_tapable_namespaceObject.MultiHook(normalizedCompilers.map((c)=>c.hooks.shutdown)),
                infrastructureLog: new lite_tapable_namespaceObject.MultiHook(normalizedCompilers.map((c)=>c.hooks.infrastructureLog))
            }, this.compilers = normalizedCompilers, this._options = {
                parallelism: options?.parallelism || 1 / 0
            }, this.dependencies = new WeakMap(), this.running = !1;
            const compilerStats = this.compilers.map(()=>null);
            let doneCompilers = 0;
            for(let index = 0; index < this.compilers.length; index++){
                const compiler = this.compilers[index], compilerIndex = index;
                let compilerDone = !1;
                compiler.hooks.done.tap("MultiCompiler", (stats)=>{
                    !compilerDone && (compilerDone = !0, doneCompilers++), compilerStats[compilerIndex] = stats, doneCompilers === this.compilers.length && this.hooks.done.call(new MultiStats(compilerStats));
                }), compiler.hooks.invalid.tap("MultiCompiler", ()=>{
                    compilerDone && (compilerDone = !1, doneCompilers--);
                });
            }
        }
        set unsafeFastDrop(value) {
            for (let compiler of this.compilers)compiler.unsafeFastDrop = value;
        }
        get options() {
            return Object.assign(this.compilers.map((c)=>c.options), this._options);
        }
        get outputPath() {
            let commonPath = this.compilers[0].outputPath;
            for (let compiler of this.compilers)for(; 0 !== compiler.outputPath.indexOf(commonPath) && /[/\\]/.test(commonPath);)commonPath = commonPath.replace(/[/\\][^/\\]*$/, "");
            return commonPath || "/" !== this.compilers[0].outputPath[0] ? commonPath : "/";
        }
        get inputFileSystem() {
            throw Error("Cannot read inputFileSystem of a MultiCompiler");
        }
        get outputFileSystem() {
            throw Error("Cannot read outputFileSystem of a MultiCompiler");
        }
        get watchFileSystem() {
            throw Error("Cannot read watchFileSystem of a MultiCompiler");
        }
        get intermediateFileSystem() {
            throw Error("Cannot read outputFileSystem of a MultiCompiler");
        }
        set inputFileSystem(value) {
            for (let compiler of this.compilers)compiler.inputFileSystem = value;
        }
        set outputFileSystem(value) {
            for (let compiler of this.compilers)compiler.outputFileSystem = value;
        }
        set watchFileSystem(value) {
            for (let compiler of this.compilers)compiler.watchFileSystem = value;
        }
        set intermediateFileSystem(value) {
            for (let compiler of this.compilers)compiler.intermediateFileSystem = value;
        }
        getInfrastructureLogger(name) {
            return this.compilers[0].getInfrastructureLogger(name);
        }
        setDependencies(compiler, dependencies) {
            this.dependencies.set(compiler, dependencies);
        }
        validateDependencies(callback) {
            let edges = new Set(), missing = [], targetFound = (compiler)=>{
                for (let edge of edges)if (edge.target === compiler) return !0;
                return !1;
            };
            for (let source of this.compilers){
                let dependencies = this.dependencies.get(source);
                if (dependencies) for (let dep of dependencies){
                    let target = this.compilers.find((c)=>c.name === dep);
                    target ? edges.add({
                        source,
                        target
                    }) : missing.push(dep);
                }
            }
            let errors = missing.map((m)=>`Compiler dependency \`${m}\` not found.`), stack = this.compilers.filter((c)=>!targetFound(c));
            for(; stack.length > 0;){
                let current = stack.pop();
                for (let edge of edges)if (edge.source === current) {
                    edges.delete(edge);
                    let target = edge.target;
                    targetFound(target) || stack.push(target);
                }
            }
            if (edges.size > 0) {
                let lines = Array.from(edges).sort((e1, e2)=>e1.source.name.localeCompare(e2.source.name) || e1.target.name.localeCompare(e2.target.name)).map((edge)=>`${edge.source.name} -> ${edge.target.name}`);
                lines.unshift("Circular dependency found in compiler dependencies."), errors.unshift(lines.join("\n"));
            }
            return !(errors.length > 0) || (callback(Error(errors.join("\n"))), !1);
        }
        #runGraph(setup, run, callback) {
            let nodes = this.compilers.map((compiler)=>({
                    compiler,
                    setupResult: void 0,
                    result: void 0,
                    state: "blocked",
                    children: [],
                    parents: []
                })), compilerToNode = new Map();
            for (let node of nodes)compilerToNode.set(node.compiler.name, node);
            for (let node of nodes){
                let dependencies = this.dependencies.get(node.compiler);
                if (dependencies) for (let dep of dependencies){
                    let parent = compilerToNode.get(dep);
                    node.parents.push(parent), parent.children.push(node);
                }
            }
            let queue = new util_ArrayQueue();
            for (let node of nodes)0 === node.parents.length && (node.state = "queued", queue.enqueue(node));
            let errored = !1, running = 0, parallelism = this._options.parallelism, nodeDone = (node, err, stats)=>{
                if (!errored) {
                    if (err) return errored = !0, asyncLib_each(nodes, (node, callback)=>{
                        node.compiler.watching ? node.compiler.watching.close(callback) : callback();
                    }, ()=>callback(err));
                    if (node.result = stats, running--, "running" === node.state) for (let child of (node.state = "done", node.children))"blocked" === child.state && queue.enqueue(child);
                    else "running-outdated" === node.state && (node.state = "blocked", queue.enqueue(node));
                    processQueue();
                }
            }, nodeInvalidFromParent = (node)=>{
                for (let child of ("done" === node.state ? node.state = "blocked" : "running" === node.state && (node.state = "running-outdated"), node.children))nodeInvalidFromParent(child);
            }, nodeInvalid = (node)=>{
                for (let child of ("done" === node.state ? node.state = "pending" : "running" === node.state && (node.state = "running-outdated"), node.children))nodeInvalidFromParent(child);
            }, setupResults = [];
            nodes.forEach((node, i)=>{
                setupResults.push(node.setupResult = setup(node.compiler, i, nodeDone.bind(null, node), ()=>"starting" !== node.state && "running" !== node.state, ()=>{
                    var node1;
                    nodeInvalid(node1 = node), "pending" === node1.state && (node1.state = "blocked"), "blocked" === node1.state && (queue.enqueue(node1), processQueue());
                }, ()=>nodeInvalid(node)));
            });
            let processing = !0, processQueue = ()=>{
                processing || (processing = !0, process.nextTick(processQueueWorker));
            }, processQueueWorker = ()=>{
                for(; running < parallelism && queue.length > 0 && !errored;){
                    let node = queue.dequeue();
                    ("queued" === node.state || "blocked" === node.state && node.parents.every((p)=>"done" === p.state)) && (running++, node.state = "starting", run(node.compiler, node.setupResult, nodeDone.bind(null, node)), node.state = "running");
                }
                if (processing = !1, !errored && 0 === running && nodes.every((node)=>"done" === node.state)) {
                    let stats = [];
                    for (let node of nodes){
                        let result = node.result;
                        result && (node.result = void 0, stats.push(result));
                    }
                    stats.length > 0 && callback(null, new MultiStats(stats));
                }
            };
            return processQueueWorker(), setupResults;
        }
        watch(watchOptions, handler) {
            if (this.running) return handler(new ConcurrentCompilationError());
            if (this.running = !0, this.validateDependencies(handler)) {
                let watchings = this.#runGraph((compiler, idx, done, isBlocked, setChanged, setInvalid)=>{
                    let watching = compiler.watch(Array.isArray(watchOptions) ? watchOptions[idx] : watchOptions, done);
                    return watching && (watching.onInvalid = setInvalid, watching.onChange = setChanged, watching.isBlocked = isBlocked), watching;
                }, (compiler, watching, _done)=>{
                    compiler.watching === watching && (watching.running || watching.invalidate());
                }, handler);
                return this.watching = new src_MultiWatching(watchings, this), this.watching;
            }
            return this.watching = new src_MultiWatching([], this), this.watching;
        }
        run(callback, options) {
            if (this.running) return callback(new ConcurrentCompilationError());
            this.running = !0, this.validateDependencies(callback) && this.#runGraph(()=>{}, (compiler, _, callback)=>compiler.run(callback, options), (err, stats)=>{
                if (this.running = !1, void 0 !== callback) return callback(err, stats);
            });
        }
        purgeInputFileSystem() {
            for (let compiler of this.compilers)compiler.inputFileSystem?.purge?.();
        }
        close(callback) {
            asyncLib_each(this.compilers, (compiler, cb)=>{
                compiler.close(cb);
            }, callback);
        }
    }
    class MemoryCachePlugin {
        static PLUGIN_NAME = "MemoryCachePlugin";
        apply(compiler) {
            let cache = new Map();
            compiler.cache.hooks.store.tap({
                name: MemoryCachePlugin.PLUGIN_NAME,
                stage: Cache.STAGE_MEMORY
            }, (identifier, etag, data)=>{
                let dataEtag = "function" == typeof etag?.toString ? etag.toString() : etag;
                cache.set(identifier, {
                    etag: dataEtag,
                    data
                });
            }), compiler.cache.hooks.get.tap({
                name: MemoryCachePlugin.PLUGIN_NAME,
                stage: Cache.STAGE_MEMORY
            }, (identifier, etag, gotHandlers)=>{
                let cacheEntry = cache.get(identifier), dataEtag = "function" == typeof etag?.toString ? etag.toString() : etag;
                return null === cacheEntry ? null : void 0 !== cacheEntry ? cacheEntry.etag === dataEtag ? cacheEntry.data : null : void gotHandlers.push((result, callback)=>(void 0 === result ? cache.set(identifier, null) : cache.set(identifier, {
                        etag: dataEtag,
                        data: result
                    }), callback(null)));
            }), compiler.cache.hooks.shutdown.tap({
                name: MemoryCachePlugin.PLUGIN_NAME,
                stage: Cache.STAGE_MEMORY
            }, ()=>{
                cache.clear();
            });
        }
    }
    let lib_IgnoreWarningsPlugin = class {
        _ignorePattern;
        name = "IgnoreWarningsPlugin";
        constructor(ignorePattern){
            this._ignorePattern = ignorePattern;
        }
        apply(compiler) {
            compiler.hooks.compilation.tap(this.name, (compilation)=>{
                compilation.hooks.processWarnings.tap(this.name, (warnings)=>warnings.filter((warning)=>!this._ignorePattern.some((ignore)=>ignore(warning, compilation))));
            });
        }
    };
    var statsFactoryUtils_StatsErrorCode = ((StatsErrorCode = {}).ChunkMinificationError = "ChunkMinificationError", StatsErrorCode.ChunkMinificationWarning = "ChunkMinificationWarning", StatsErrorCode.ModuleParseError = "ModuleParseError", StatsErrorCode.ModuleParseWarning = "ModuleParseWarning", StatsErrorCode.ModuleBuildError = "ModuleBuildError", StatsErrorCode);
    let iterateConfig = (config, options, fn)=>{
        for (let hookFor of Object.keys(config)){
            let subConfig = config[hookFor];
            for (let option of Object.keys(subConfig)){
                if ("_" !== option) if (option.startsWith("!")) {
                    if (options[option.slice(1)]) continue;
                } else {
                    let value = options[option];
                    if (!1 === value || void 0 === value || Array.isArray(value) && 0 === value.length) continue;
                }
                fn(hookFor, subConfig[option]);
            }
        }
    }, getTotalItems = (children)=>{
        let count = 0;
        for (let child of children)child.children || child.filteredChildren ? (child.children && (count += getTotalItems(child.children)), child.filteredChildren && (count += child.filteredChildren)) : count++;
        return count;
    }, getTotalSize = (children)=>{
        let size = 0;
        for (let child of children)size += getItemSize(child);
        return size;
    }, getItemSize = (item)=>item.children ? item.filteredChildren ? 2 + getTotalSize(item.children) : 1 + getTotalSize(item.children) : 1, spaceLimited = (itemsAndGroups, max, filteredChildrenLineReserved = !1)=>{
        let children, filteredChildren;
        if (max < 1) return {
            children: void 0,
            filteredChildren: getTotalItems(itemsAndGroups)
        };
        let groups = [], groupSizes = [], items = [], groupsSize = 0;
        for (let itemOrGroup of itemsAndGroups)if (itemOrGroup.children || itemOrGroup.filteredChildren) {
            groups.push(itemOrGroup);
            let size = getItemSize(itemOrGroup);
            groupSizes.push(size), groupsSize += size;
        } else items.push(itemOrGroup);
        if (groupsSize + items.length <= max) children = groups.length > 0 ? groups.concat(items) : items;
        else if (0 === groups.length) {
            let limit = max - !filteredChildrenLineReserved;
            filteredChildren = items.length - limit, items.length = limit, children = items;
        } else {
            let limit = groups.length + (filteredChildrenLineReserved || 0 === items.length ? 0 : 1);
            if (limit < max) {
                let oversize;
                for(; (oversize = groupsSize + items.length + (filteredChildren && !filteredChildrenLineReserved ? 1 : 0) - max) > 0;){
                    let maxGroupSize = Math.max(...groupSizes);
                    if (maxGroupSize < items.length) {
                        filteredChildren = items.length, items.length = 0;
                        continue;
                    }
                    for(let i = 0; i < groups.length; i++)if (groupSizes[i] === maxGroupSize) {
                        let group = groups[i], headerSize = group.filteredChildren ? 2 : 1, limited = spaceLimited(group.children, maxGroupSize - Math.ceil(oversize / groups.length) - headerSize, 2 === headerSize);
                        groups[i] = {
                            ...group,
                            children: limited.children,
                            filteredChildren: limited.filteredChildren ? (group.filteredChildren || 0) + limited.filteredChildren : group.filteredChildren
                        };
                        let newSize = getItemSize(groups[i]);
                        groupsSize -= maxGroupSize - newSize, groupSizes[i] = newSize;
                        break;
                    }
                }
                children = groups.concat(items);
            } else limit === max ? (children = ((children)=>{
                let newChildren = [];
                for (let child of children)if (child.children) {
                    let filteredChildren = child.filteredChildren || 0;
                    filteredChildren += getTotalItems(child.children), newChildren.push({
                        ...child,
                        children: void 0,
                        filteredChildren
                    });
                } else newChildren.push(child);
                return newChildren;
            })(groups), filteredChildren = items.length) : filteredChildren = getTotalItems(itemsAndGroups);
        }
        return {
            children,
            filteredChildren
        };
    }, countWithChildren = (compilation, getItems)=>{
        let count = getItems(compilation, "").length;
        for (let child of compilation.children)count += countWithChildren(child, (c, type)=>getItems(c, `.children[].compilation${type}`));
        return count;
    }, sortByField = (field)=>{
        var field1;
        if (!field) return (_a, _b)=>0;
        let fieldKey = "!" === (field1 = field)[0] ? field1.slice(1) : field1, sortFn = compareSelect((m)=>m[fieldKey], compareIds);
        if ("!" === field[0]) {
            let oldSortFn = sortFn;
            sortFn = (a, b)=>oldSortFn(b, a);
        }
        return sortFn;
    }, assetGroup = (children)=>{
        let size = 0;
        for (let asset of children)size += asset.size;
        return {
            size
        };
    }, moduleGroup = (children)=>{
        let size = 0, sizes = {};
        for (let module1 of children)for (let key of (size += module1.size, Object.keys(module1.sizes)))sizes[key] = (sizes[key] || 0) + module1.sizes[key];
        return {
            size,
            sizes
        };
    }, mergeToObject = (items)=>{
        let obj = Object.create(null);
        for (let item of items)obj[item.name] = item;
        return obj;
    }, errorsSpaceLimit = (errors, max)=>{
        let filtered = 0;
        if (errors.length + 1 >= max) return {
            errors: errors.map((error)=>"string" != typeof error && error.details ? (filtered++, {
                    ...error,
                    details: ""
                }) : error),
            filtered
        };
        let fullLength = errors.length, result = errors, i = 0;
        for(; i < errors.length; i++){
            let error = errors[i];
            if ("string" != typeof error && error.details) {
                if ((fullLength += error.details.split("\n").length) > max) {
                    result = i > 0 ? errors.slice(0, i) : [];
                    let overLimit = fullLength - max + 1, error = errors[i++];
                    for(result.push({
                        ...error,
                        details: error.details.split("\n").slice(0, -overLimit).join("\n"),
                        filteredDetails: overLimit
                    }), filtered = errors.length - i; i < errors.length; i++){
                        let error = errors[i];
                        "string" != typeof error && error.details || result.push(error), result.push({
                            ...error,
                            details: ""
                        });
                    }
                    break;
                }
                if (fullLength === max) {
                    for(result = errors.slice(0, ++i), filtered = errors.length - i; i < errors.length; i++){
                        let error = errors[i];
                        "string" != typeof error && error.details || result.push(error), result.push({
                            ...error,
                            details: ""
                        });
                    }
                    break;
                }
            }
        }
        return {
            errors: result,
            filtered
        };
    }, GROUP_EXTENSION_REGEXP = /(\.[^.]+?)(?:\?|(?: \+ \d+ modules?)?$)/, GROUP_PATH_REGEXP = /(.+)[/\\][^/\\]+?(?:\?|(?: \+ \d+ modules?)?$)/, SHARED_ITEM_NAMES = {
        "compilation.children[]": "compilation",
        "compilation.modules[]": "module",
        "compilation.entrypoints[]": "chunkGroup",
        "compilation.namedChunkGroups[]": "chunkGroup",
        "compilation.errors[]": "error",
        "chunk.modules[]": "module",
        "chunk.origins[]": "chunkOrigin",
        "compilation.chunks[]": "chunk",
        "compilation.assets[]": "asset",
        "asset.related[]": "asset",
        "module.issuerPath[]": "moduleIssuer",
        "module.reasons[]": "moduleReason",
        "module.modules[]": "module",
        "module.children[]": "module"
    }, ITEM_NAMES = {
        ...SHARED_ITEM_NAMES,
        "compilation.warnings[]": "warning",
        "chunk.rootModules[]": "module",
        "moduleTrace[]": "moduleTraceItem"
    }, MERGER = {
        "compilation.entrypoints": mergeToObject,
        "compilation.namedChunkGroups": mergeToObject
    }, ASSETS_GROUPERS = {
        _: (groupConfigs, _context, options)=>{
            let groupByFlag = (name, exclude)=>{
                groupConfigs.push({
                    getKeys: (asset)=>asset[name] ? [
                            "1"
                        ] : void 0,
                    getOptions: ()=>({
                            groupChildren: !exclude,
                            force: exclude
                        }),
                    createGroup: (key, children, assets)=>exclude ? {
                            type: "assets by status",
                            [name]: !!key,
                            filteredChildren: assets.length,
                            ...assetGroup(children)
                        } : {
                            type: "assets by status",
                            [name]: !!key,
                            children,
                            ...assetGroup(children)
                        }
                });
            }, { groupAssetsByEmitStatus, groupAssetsByPath, groupAssetsByExtension } = options;
            groupAssetsByEmitStatus && groupByFlag("emitted"), (groupAssetsByEmitStatus || !options.cachedAssets) && groupByFlag("cached", !options.cachedAssets), (groupAssetsByPath || groupAssetsByExtension) && groupConfigs.push({
                getKeys: (asset)=>{
                    let extensionMatch = groupAssetsByExtension && GROUP_EXTENSION_REGEXP.exec(asset.name), extension = extensionMatch ? extensionMatch[1] : "", pathMatch = groupAssetsByPath && GROUP_PATH_REGEXP.exec(asset.name), path = pathMatch ? pathMatch[1].split(/[/\\]/) : [], keys = [];
                    if (groupAssetsByPath) for(keys.push("."), extension && keys.push(path.length ? `${path.join("/")}/*${extension}` : `*${extension}`); path.length > 0;)keys.push(`${path.join("/")}/`), path.pop();
                    else extension && keys.push(`*${extension}`);
                    return keys;
                },
                createGroup: (key, children)=>({
                        type: groupAssetsByPath ? "assets by path" : "assets by extension",
                        name: key,
                        children,
                        ...assetGroup(children)
                    })
            });
        },
        groupAssetsByInfo: (groupConfigs)=>{
            let groupByAssetInfoFlag = (name)=>{
                groupConfigs.push({
                    getKeys: (asset)=>asset.info?.[name] ? [
                            "1"
                        ] : void 0,
                    createGroup: (key, children)=>({
                            type: "assets by info",
                            info: {
                                [name]: !!key
                            },
                            children,
                            ...assetGroup(children)
                        })
                });
            };
            groupByAssetInfoFlag("immutable"), groupByAssetInfoFlag("development"), groupByAssetInfoFlag("hotModuleReplacement");
        },
        groupAssetsByChunk: (groupConfigs)=>{
            let groupByNames = (name)=>{
                groupConfigs.push({
                    getKeys: (asset)=>asset[name],
                    createGroup: (key, children)=>({
                            type: "assets by chunk",
                            [name]: [
                                key
                            ],
                            children,
                            ...assetGroup(children)
                        })
                });
            };
            groupByNames("chunkNames"), groupByNames("auxiliaryChunkNames"), groupByNames("chunkIdHints"), groupByNames("auxiliaryChunkIdHints");
        },
        excludeAssets: (groupConfigs, _context, { excludeAssets })=>{
            groupConfigs.push({
                getKeys: (asset)=>{
                    let ident = asset.name;
                    if (excludeAssets.some((fn)=>fn(ident, asset))) return [
                        "excluded"
                    ];
                },
                getOptions: ()=>({
                        groupChildren: !1,
                        force: !0
                    }),
                createGroup: (_key, children, assets)=>({
                        type: "hidden assets",
                        filteredChildren: assets.length,
                        ...assetGroup(children)
                    })
            });
        }
    }, MODULES_GROUPERS = (type)=>({
            _: (groupConfigs, _context, options)=>{
                let groupByFlag = (name, type, exclude)=>{
                    groupConfigs.push({
                        getKeys: (module1)=>module1[name] ? [
                                "1"
                            ] : void 0,
                        getOptions: ()=>({
                                groupChildren: !exclude,
                                force: exclude
                            }),
                        createGroup: (key, children, modules)=>({
                                type,
                                [name]: !!key,
                                ...exclude ? {
                                    filteredChildren: modules.length
                                } : {
                                    children
                                },
                                ...moduleGroup(children)
                            })
                    });
                }, { groupModulesByCacheStatus, groupModulesByAttributes, groupModulesByType, groupModulesByPath, groupModulesByLayer, groupModulesByExtension } = options;
                groupModulesByAttributes && (groupByFlag("errors", "modules with errors"), groupByFlag("warnings", "modules with warnings"), groupByFlag("assets", "modules with assets"), groupByFlag("optional", "optional modules")), groupModulesByCacheStatus && (groupByFlag("cacheable", "cacheable modules"), groupByFlag("built", "built modules"), groupByFlag("codeGenerated", "code generated modules")), (groupModulesByCacheStatus || !options.cachedModules) && groupByFlag("cached", "cached modules", !options.cachedModules), (groupModulesByAttributes || !options.orphanModules) && groupByFlag("orphan", "orphan modules", !options.orphanModules), (groupModulesByAttributes || !options.dependentModules) && groupByFlag("dependent", "dependent modules", !options.dependentModules), (groupModulesByType || !options.runtimeModules) && groupConfigs.push({
                    getKeys: (module1)=>{
                        let moduleType = module1.moduleType;
                        if (moduleType) {
                            if (groupModulesByType) return [
                                moduleType.split("/", 1)[0]
                            ];
                            if ("runtime" === moduleType) return [
                                "runtime"
                            ];
                        }
                    },
                    getOptions: (key)=>{
                        let exclude = "runtime" === key && !options.runtimeModules;
                        return {
                            groupChildren: !exclude,
                            force: exclude
                        };
                    },
                    createGroup: (key, children, modules)=>{
                        let exclude = "runtime" === key && !options.runtimeModules;
                        return {
                            type: `${key} modules`,
                            moduleType: key,
                            ...exclude ? {
                                filteredChildren: modules.length
                            } : {
                                children
                            },
                            ...moduleGroup(children)
                        };
                    }
                }), groupModulesByLayer && groupConfigs.push({
                    getKeys: (module1)=>[
                            module1.layer
                        ],
                    createGroup: (key, children, _modules)=>({
                            type: "modules by layer",
                            layer: key,
                            children,
                            ...moduleGroup(children)
                        })
                }), (groupModulesByPath || groupModulesByExtension) && groupConfigs.push({
                    getKeys: (module1)=>{
                        if (!module1.name) return;
                        let resource = parseResource(module1.name.split("!").pop()).path, dataUrl = /^data:[^,;]+/.exec(resource);
                        if (dataUrl) return [
                            dataUrl[0]
                        ];
                        let extensionMatch = groupModulesByExtension && GROUP_EXTENSION_REGEXP.exec(resource), extension = extensionMatch ? extensionMatch[1] : "", pathMatch = groupModulesByPath && GROUP_PATH_REGEXP.exec(resource), path = pathMatch ? pathMatch[1].split(/[/\\]/) : [], keys = [];
                        if (groupModulesByPath) for(extension && keys.push(path.length ? `${path.join("/")}/*${extension}` : `*${extension}`); path.length > 0;)keys.push(`${path.join("/")}/`), path.pop();
                        else extension && keys.push(`*${extension}`);
                        return keys;
                    },
                    createGroup: (key, children, _modules)=>{
                        let isDataUrl = key.startsWith("data:");
                        return {
                            type: isDataUrl ? "modules by mime type" : groupModulesByPath ? "modules by path" : "modules by extension",
                            name: isDataUrl ? key.slice(5) : key,
                            children,
                            ...moduleGroup(children)
                        };
                    }
                });
            },
            excludeModules: (groupConfigs, _context, { excludeModules })=>{
                groupConfigs.push({
                    getKeys: (module1)=>{
                        let name = module1.name;
                        if (name && excludeModules.some((fn)=>fn(name, module1, type))) return [
                            "1"
                        ];
                    },
                    getOptions: ()=>({
                            groupChildren: !1,
                            force: !0
                        }),
                    createGroup: (_key, children, _modules)=>({
                            type: "hidden modules",
                            filteredChildren: children.length,
                            ...moduleGroup(children)
                        })
                });
            }
        }), RESULT_GROUPERS = {
        "compilation.assets": ASSETS_GROUPERS,
        "asset.related": ASSETS_GROUPERS,
        "compilation.modules": MODULES_GROUPERS("module"),
        "chunk.modules": MODULES_GROUPERS("chunk"),
        "chunk.rootModules": MODULES_GROUPERS("root-of-chunk"),
        "module.modules": MODULES_GROUPERS("nested")
    }, ASSET_SORTERS = {
        assetsSort: (comparators, _context, { assetsSort })=>{
            comparators.push(sortByField(assetsSort));
        },
        _: (comparators)=>{
            comparators.push(compareSelect((a)=>a.name, compareIds));
        }
    }, RESULT_SORTERS = {
        "compilation.chunks": {
            chunksSort: (comparators, _context, { chunksSort })=>{
                comparators.push(sortByField(chunksSort));
            }
        },
        "compilation.modules": {
            modulesSort: (comparators, _context, { modulesSort })=>{
                comparators.push(sortByField(modulesSort));
            }
        },
        "chunk.modules": {
            chunkModulesSort: (comparators, _context, { chunkModulesSort })=>{
                comparators.push(sortByField(chunkModulesSort));
            }
        },
        "module.modules": {
            nestedModulesSort: (comparators, _context, { nestedModulesSort })=>{
                comparators.push(sortByField(nestedModulesSort));
            }
        },
        "compilation.assets": ASSET_SORTERS,
        "asset.related": ASSET_SORTERS
    }, MODULES_SORTER = {
        _: (comparators)=>{
            comparators.push(compareSelect((m)=>m.commonAttributes.depth, compareNumbers), compareSelect((m)=>m.commonAttributes.preOrderIndex, compareNumbers), compareSelect((m)=>m.commonAttributes.moduleDescriptor?.identifier, compareIds));
        }
    }, SORTERS = {
        "compilation.chunks": {
            _: (comparators)=>{
                comparators.push(compareSelect((c)=>c.id, compareIds));
            }
        },
        "compilation.modules": MODULES_SORTER,
        "chunk.rootModules": MODULES_SORTER,
        "chunk.modules": MODULES_SORTER,
        "module.modules": MODULES_SORTER,
        "module.reasons": {
            _: (comparators)=>{
                comparators.push(compareSelect((x)=>x.moduleIdentifier, compareIds)), comparators.push(compareSelect((x)=>x.resolvedModuleIdentifier, compareIds)), comparators.push(compareSelect((x)=>x.dependency, compareSelect((x)=>x.type, compareIds)));
            }
        },
        "chunk.origins": {
            _: (comparators)=>{
                comparators.push(compareSelect((origin)=>origin.moduleId, compareIds), compareSelect((origin)=>origin.loc, compareIds), compareSelect((origin)=>origin.request, compareIds));
            }
        }
    }, EXTRACT_ERROR = {
        _: (object, error)=>{
            object.message = error.message, error.code && (object.code = error.code), error.chunkName && (object.chunkName = error.chunkName), error.chunkEntry && (object.chunkEntry = error.chunkEntry), error.chunkInitial && (object.chunkInitial = error.chunkInitial), error.file && (object.file = error.file), error.moduleDescriptor && (object.moduleIdentifier = error.moduleDescriptor.identifier, object.moduleName = error.moduleDescriptor.name), error.loc && (object.loc = error.loc);
        },
        ids: (object, error)=>{
            error.chunkId && (object.chunkId = error.chunkId), error.moduleDescriptor && (object.moduleId = error.moduleDescriptor.id);
        },
        moduleTrace: (object, error, context, _, factory)=>{
            let { type } = context;
            object.moduleTrace = factory.create(`${type}.moduleTrace`, error.moduleTrace, context);
        },
        errorDetails: (object, error)=>{
            object.details = error.details;
        },
        errorStack: (object, error)=>{
            object.stack = error.stack;
        }
    }, SIMPLE_EXTRACTORS = {
        compilation: {
            _: (object, compilation, context, options)=>{
                let statsCompilation = context.getStatsCompilation(compilation);
                if (context.makePathsRelative || (context.makePathsRelative = makePathsRelative.bindContextCache(compilation.compiler.context, compilation.compiler.root)), !context.cachedGetErrors) {
                    let map = new WeakMap();
                    context.cachedGetErrors = (compilation)=>{
                        var errors;
                        return map.get(compilation) || (errors = statsCompilation.errors, map.set(compilation, errors), errors);
                    };
                }
                if (!context.cachedGetWarnings) {
                    let map = new WeakMap();
                    context.cachedGetWarnings = (compilation)=>{
                        var warnings;
                        return map.get(compilation) || (warnings = compilation.__internal_getInner().createStatsWarnings(compilation.getWarnings(), !!options.colors), map.set(compilation, warnings), warnings);
                    };
                }
                compilation.name && (object.name = compilation.name);
                let logging = options.logging, loggingDebug = options.loggingDebug, loggingTrace = options.loggingTrace;
                if (logging || loggingDebug && loggingDebug.length > 0) {
                    let acceptedTypes, collapsedGroups = !1;
                    "verbose" === logging || loggingDebug && loggingDebug.length > 0 ? (acceptedTypes = getLogTypesBitFlag([
                        LogType.error,
                        LogType.warn,
                        LogType.info,
                        LogType.log,
                        LogType.debug,
                        LogType.group,
                        LogType.groupEnd,
                        LogType.groupCollapsed,
                        LogType.profile,
                        LogType.profileEnd,
                        LogType.time,
                        LogType.status,
                        LogType.clear,
                        LogType.cache
                    ]), collapsedGroups = !0) : acceptedTypes = "log" === logging || !0 === logging ? getLogTypesBitFlag([
                        LogType.error,
                        LogType.warn,
                        LogType.info,
                        LogType.log,
                        LogType.group,
                        LogType.groupEnd,
                        LogType.groupCollapsed,
                        LogType.clear
                    ]) : "info" === logging ? getLogTypesBitFlag([
                        LogType.error,
                        LogType.warn,
                        LogType.info
                    ]) : "warn" === logging ? getLogTypesBitFlag([
                        LogType.error,
                        LogType.warn
                    ]) : "error" === logging ? getLogTypesBitFlag([
                        LogType.error
                    ]) : getLogTypesBitFlag([]), object.logging = {};
                    let compilationLogging = compilation.logging;
                    for (let { name, ...rest } of context.getInner(compilation).getLogging(acceptedTypes)){
                        let value = compilationLogging.get(name), entry = {
                            type: rest.type,
                            trace: rest.trace,
                            args: rest.args ?? []
                        };
                        value ? value.push(entry) : compilationLogging.set(name, [
                            entry
                        ]);
                    }
                    let depthInCollapsedGroup = 0;
                    for (let [origin, logEntries] of compilationLogging){
                        let debugMode = loggingDebug.some((fn)=>fn(origin));
                        if (!1 === logging && !debugMode) continue;
                        let groupStack = [], rootList = [], currentList = rootList, processedLogEntries = 0;
                        for (let entry of logEntries){
                            let type = entry.type, typeBitFlag = getLogTypeBitFlag(type);
                            if (!debugMode && (acceptedTypes & typeBitFlag) !== typeBitFlag) continue;
                            if (type === LogType.groupCollapsed && (debugMode || collapsedGroups) && (type = LogType.group), 0 === depthInCollapsedGroup && processedLogEntries++, type === LogType.groupEnd) {
                                groupStack.pop(), currentList = groupStack.length > 0 ? groupStack[groupStack.length - 1].children : rootList, depthInCollapsedGroup > 0 && depthInCollapsedGroup--;
                                continue;
                            }
                            let newEntry = {
                                type,
                                message: entry.args?.length ? external_node_util_namespaceObject.format(entry.args[0], ...entry.args.slice(1)) : "",
                                trace: loggingTrace ? entry.trace : void 0,
                                children: type === LogType.group || type === LogType.groupCollapsed ? [] : void 0
                            };
                            currentList.push(newEntry), newEntry.children && (groupStack.push(newEntry), currentList = newEntry.children, depthInCollapsedGroup > 0 ? depthInCollapsedGroup++ : type === LogType.groupCollapsed && (depthInCollapsedGroup = 1));
                        }
                        object.logging[origin] = {
                            entries: rootList,
                            filteredEntries: logEntries.length - processedLogEntries,
                            debug: debugMode
                        };
                    }
                }
            },
            hash: (object, compilation, context)=>{
                object.hash = context.getStatsCompilation(compilation).hash;
            },
            version: (object)=>{
                object.version = "5.75.0", object.rspackVersion = "1.6.8";
            },
            env: (object, _compilation, _context, { _env })=>{
                object.env = _env;
            },
            timings: (object, compilation)=>{
                object.time = compilation.endTime - compilation.startTime;
            },
            builtAt: (object, compilation)=>{
                object.builtAt = compilation.endTime;
            },
            publicPath: (object, compilation)=>{
                if ("function" == typeof compilation.outputOptions.publicPath) throw new DeadlockRiskError("publicPath as function can't be used with stats.publicPath=true, which may cause deadlock risk, consider setting stats.publicPath=false in rspack config");
                object.publicPath = compilation.getPath(compilation.outputOptions.publicPath || "");
            },
            outputPath: (object, compilation)=>{
                object.outputPath = compilation.outputOptions.path;
            },
            assets: (object, compilation, context, options, factory)=>{
                let { type, getStatsCompilation } = context, statsCompilation = getStatsCompilation(compilation), compilationAssets = statsCompilation.assets, assetsByChunkName = statsCompilation.assetsByChunkName, assetMap = new Map(), assets = new Set();
                for (let asset of compilationAssets){
                    let item = {
                        ...asset,
                        type: "asset",
                        related: []
                    };
                    assets.add(item), assetMap.set(asset.name, item);
                }
                for (let item of assetMap.values()){
                    let related = item.info.related;
                    if (related) for (let { name: type, value: relatedEntry } of related)for (let dep of Array.isArray(relatedEntry) ? relatedEntry : [
                        relatedEntry
                    ]){
                        let depItem = assetMap.get(dep);
                        depItem && (assets.delete(depItem), depItem.type = type, item.related = item.related || [], item.related.push(depItem));
                    }
                }
                object.assetsByChunkName = Object.fromEntries(assetsByChunkName.map(({ name, files })=>[
                        name,
                        files
                    ]));
                let limited = spaceLimited(factory.create(`${type}.assets`, [
                    ...assets
                ], {
                    ...context
                }), options.assetsSpace ?? 1 / 0);
                object.assets = limited.children, object.filteredAssets = limited.filteredChildren;
            },
            chunks: (object, compilation, context, options, factory)=>{
                let { type, getStatsCompilation } = context, chunks = getStatsCompilation(compilation).chunks;
                object.chunks = factory.create(`${type}.chunks`, chunks, context);
            },
            modules: (object, compilation, context, options, factory)=>{
                let { type, getStatsCompilation } = context, array = getStatsCompilation(compilation).modules, limited = spaceLimited(factory.create(`${type}.modules`, array, context), options.modulesSpace);
                object.modules = limited.children, object.filteredModules = limited.filteredChildren;
            },
            entrypoints: (object, compilation, context, { entrypoints, chunkGroups, chunkGroupAuxiliary, chunkGroupChildren }, factory)=>{
                let { type, getStatsCompilation } = context, array = getStatsCompilation(compilation).entrypoints.map((entrypoint)=>({
                        name: entrypoint.name,
                        chunkGroup: entrypoint
                    })), chunks = Array.from(compilation.chunks).reduce((res, chunk)=>(res[chunk.id] = chunk, res), {});
                "auto" === entrypoints && !chunkGroups && (array.length > 5 || !chunkGroupChildren && array.every(({ chunkGroup })=>{
                    if (1 !== chunkGroup.chunks.length) return !1;
                    let chunk = chunks[chunkGroup.chunks[0]];
                    return chunk && 1 === chunk.files.size && (!chunkGroupAuxiliary || 0 === chunk.auxiliaryFiles.size);
                })) || (object.entrypoints = factory.create(`${type}.entrypoints`, array, context));
            },
            chunkGroups: (object, compilation, context, _, factory)=>{
                let { type, getStatsCompilation } = context, namedChunkGroups = getStatsCompilation(compilation).namedChunkGroups.map((cg)=>({
                        name: cg.name,
                        chunkGroup: cg
                    }));
                object.namedChunkGroups = factory.create(`${type}.namedChunkGroups`, namedChunkGroups, context);
            },
            errors: (object, compilation, context, options, factory)=>{
                let { type, cachedGetErrors } = context, rawErrors = cachedGetErrors(compilation), factorizedErrors = factory.create(`${type}.errors`, cachedGetErrors(compilation), context), filtered = 0;
                if ("auto" === options.errorDetails && rawErrors.length >= 3 && (filtered = rawErrors.map((e)=>"string" != typeof e && e.details).filter(Boolean).length), !0 === options.errorDetails || !Number.isFinite(options.errorsSpace)) {
                    object.errors = factorizedErrors, filtered && (object.filteredErrorDetailsCount = filtered);
                    return;
                }
                let { errors, filtered: filteredBySpace } = errorsSpaceLimit(factorizedErrors, options.errorsSpace);
                object.filteredErrorDetailsCount = filtered + filteredBySpace, object.errors = errors;
            },
            errorsCount: (object, compilation, { cachedGetErrors })=>{
                object.errorsCount = countWithChildren(compilation, (c)=>cachedGetErrors(c));
            },
            warnings: (object, compilation, context, options, factory)=>{
                let { type, cachedGetWarnings } = context, rawWarnings = factory.create(`${type}.warnings`, cachedGetWarnings(compilation), context), filtered = 0;
                if ("auto" === options.errorDetails && (filtered = cachedGetWarnings(compilation).map((e)=>"string" != typeof e && e.details).filter(Boolean).length), !0 === options.errorDetails || !Number.isFinite(options.warningsSpace)) {
                    object.warnings = rawWarnings, filtered && (object.filteredWarningDetailsCount = filtered);
                    return;
                }
                let { errors: warnings, filtered: filteredBySpace } = errorsSpaceLimit(rawWarnings, options.warningsSpace);
                object.filteredWarningDetailsCount = filtered + filteredBySpace, object.warnings = warnings;
            },
            warningsCount: (object, compilation, context)=>{
                let { cachedGetWarnings } = context;
                object.warningsCount = countWithChildren(compilation, (c)=>cachedGetWarnings(c));
            },
            children: (object, compilation, context, _options, factory)=>{
                let { type } = context;
                object.children = factory.create(`${type}.children`, compilation.children, context);
            }
        },
        asset: {
            _: (object, asset, context, options, factory)=>{
                object.type = asset.type, object.name = asset.name, object.size = asset.size, object.emitted = asset.emitted, object.info = {
                    ...asset.info,
                    related: Object.fromEntries(asset.info.related.map((i)=>[
                            i.name,
                            i.value
                        ]))
                };
                let cached = !object.emitted;
                object.cached = cached, (!cached || options.cachedAssets) && Object.assign(object, factory.create(`${context.type}$visible`, asset, context));
            }
        },
        asset$visible: {
            _: (object, asset)=>{
                object.chunkNames = asset.chunkNames, object.chunkIdHints = asset.chunkIdHints.filter(Boolean), object.auxiliaryChunkNames = asset.auxiliaryChunkNames, object.auxiliaryChunkIdHints = asset.auxiliaryChunkIdHints.filter(Boolean);
            },
            relatedAssets: (object, asset, context, _options, factory)=>{
                let { type } = context;
                object.related = factory.create(`${type.slice(0, -8)}.related`, asset.related, context), object.filteredRelated = asset.related ? asset.related.length - object.related.length : void 0;
            },
            ids: (object, asset)=>{
                object.chunks = asset.chunks, object.auxiliaryChunks = asset.auxiliaryChunks;
            },
            performance: (object, asset)=>{
                object.isOverSizeLimit = asset.info.isOverSizeLimit;
            }
        },
        chunkGroup: {
            _: (object, { name, chunkGroup }, _context, { chunkGroupMaxAssets })=>{
                object.name = name, object.chunks = chunkGroup.chunks, object.assets = chunkGroup.assets, object.filteredAssets = chunkGroup.assets.length <= chunkGroupMaxAssets ? 0 : chunkGroup.assets.length, object.assetsSize = chunkGroup.assetsSize, object.auxiliaryAssets = chunkGroup.auxiliaryAssets, object.auxiliaryAssetsSize = chunkGroup.auxiliaryAssetsSize, object.children = chunkGroup.children, object.childAssets = chunkGroup.childAssets;
            },
            performance: (object, { chunkGroup })=>{
                object.isOverSizeLimit = chunkGroup.isOverSizeLimit;
            }
        },
        module: {
            _: (object, module1, context, options, factory)=>{
                let { type } = context, { commonAttributes } = module1;
                object.type = commonAttributes.type, object.moduleType = commonAttributes.moduleType, object.layer = commonAttributes.layer, object.size = commonAttributes.size;
                let sizes = commonAttributes.sizes.map(({ sourceType, size })=>[
                        sourceType,
                        size
                    ]);
                sizes.sort((a, b)=>-compareIds(a, b)), object.sizes = Object.fromEntries(sizes), object.built = commonAttributes.built, object.codeGenerated = commonAttributes.codeGenerated, object.buildTimeExecuted = commonAttributes.buildTimeExecuted, object.cached = commonAttributes.cached, (commonAttributes.built || commonAttributes.codeGenerated || options.cachedModules) && Object.assign(object, factory.create(`${type}$visible`, module1, context));
            }
        },
        module$visible: {
            _: (object, module1, context, _options, factory)=>{
                let { type } = context, { commonAttributes } = module1;
                commonAttributes.moduleDescriptor && (object.identifier = commonAttributes.moduleDescriptor.identifier, object.name = commonAttributes.moduleDescriptor.name), object.nameForCondition = commonAttributes.nameForCondition, object.index = commonAttributes.preOrderIndex, object.preOrderIndex = commonAttributes.preOrderIndex, object.index2 = commonAttributes.postOrderIndex, object.postOrderIndex = commonAttributes.postOrderIndex, object.cacheable = commonAttributes.cacheable, object.optional = commonAttributes.optional, object.orphan = commonAttributes.orphan, object.dependent = module1.dependent, object.issuer = module1.issuerDescriptor?.identifier, object.issuerName = module1.issuerDescriptor?.name, object.issuerPath = module1.issuerDescriptor && factory.create(`${type.slice(0, -8)}.issuerPath`, module1.issuerPath, context), object.failed = commonAttributes.failed, object.errors = commonAttributes.errors, object.warnings = commonAttributes.warnings;
                let profile = commonAttributes.profile;
                profile && (object.profile = factory.create(`${type}.profile`, profile, context));
            },
            ids: (object, module1)=>{
                let { commonAttributes } = module1;
                commonAttributes.moduleDescriptor && (object.id = commonAttributes.moduleDescriptor.id), object.issuerId = module1.issuerDescriptor?.id, object.chunks = commonAttributes.chunks;
            },
            moduleAssets: (object, module1)=>{
                object.assets = module1.commonAttributes.assets;
            },
            reasons: (object, module1, context, options, factory)=>{
                let { type } = context, limited = spaceLimited(factory.create(`${type.slice(0, -8)}.reasons`, module1.commonAttributes.reasons, context), options.reasonsSpace);
                object.reasons = limited.children, object.filteredReasons = limited.filteredChildren;
            },
            source: (object, module1)=>{
                let { commonAttributes } = module1;
                object.source = commonAttributes.source;
            },
            usedExports: (object, { usedExports })=>{
                "string" == typeof usedExports ? "null" === usedExports ? object.usedExports = null : object.usedExports = "true" === usedExports : Array.isArray(usedExports) ? object.usedExports = usedExports : object.usedExports = null;
            },
            providedExports: (object, { commonAttributes })=>{
                object.providedExports = Array.isArray(commonAttributes.providedExports) ? commonAttributes.providedExports : null;
            },
            optimizationBailout: (object, module1)=>{
                object.optimizationBailout = module1.commonAttributes.optimizationBailout || null;
            },
            depth: (object, module1)=>{
                object.depth = module1.commonAttributes.depth;
            },
            nestedModules: (object, module1, context, options, factory)=>{
                let { type } = context, innerModules = module1.modules;
                if (Array.isArray(innerModules) && innerModules.length > 0) {
                    let limited = spaceLimited(factory.create(`${type.slice(0, -8)}.modules`, innerModules, context), options.nestedModulesSpace);
                    object.modules = limited.children, object.filteredModules = limited.filteredChildren;
                }
            }
        },
        profile: {
            _: (object, profile)=>{
                let factory = profile.factory, building = profile.building;
                Object.assign(object, {
                    total: factory + building,
                    resolving: factory,
                    building
                });
            }
        },
        moduleIssuer: {
            _: (object, module1, _context, _options, _factory)=>{
                module1.moduleDescriptor && (object.identifier = module1.moduleDescriptor.identifier, object.name = module1.moduleDescriptor.name);
            },
            ids: (object, module1)=>{
                object.id = module1.moduleDescriptor.id;
            }
        },
        moduleReason: {
            _: (object, reason)=>{
                reason.moduleDescriptor && (object.moduleIdentifier = reason.moduleDescriptor.identifier, object.moduleName = reason.moduleDescriptor.name), object.type = reason.type, object.userRequest = reason.userRequest, reason.resolvedModuleDescriptor && (object.resolvedModuleIdentifier = reason.resolvedModuleDescriptor.identifier, object.resolvedModule = reason.resolvedModuleDescriptor.name), object.explanation = reason.explanation, object.active = reason.active, object.loc = reason.loc;
            },
            ids: (object, reason)=>{
                object.moduleId = reason.moduleDescriptor ? reason.moduleDescriptor.id : null, object.resolvedModuleId = reason.resolvedModuleDescriptor ? reason.resolvedModuleDescriptor.id : null;
            }
        },
        chunk: {
            _: (object, chunk)=>{
                object.type = chunk.type, object.rendered = chunk.rendered, object.initial = chunk.initial, object.entry = chunk.entry, object.reason = chunk.reason, object.size = chunk.size, object.sizes = Object.fromEntries(chunk.sizes.map(({ sourceType, size })=>[
                        sourceType,
                        size
                    ])), object.names = chunk.names, object.idHints = chunk.idHints, object.runtime = chunk.runtime, object.files = chunk.files, object.auxiliaryFiles = chunk.auxiliaryFiles, object.hash = chunk.hash, object.childrenByOrder = chunk.childrenByOrder;
            },
            ids: (object, chunk)=>{
                object.id = chunk.id;
            },
            chunkRelations: (object, chunk)=>{
                object.siblings = chunk.siblings, object.parents = chunk.parents, object.children = chunk.children;
            },
            chunkModules: (object, chunk, context, options, factory)=>{
                let { type } = context, limited = spaceLimited(factory.create(`${type}.modules`, chunk.modules, context), options.chunkModulesSpace);
                object.modules = limited.children, object.filteredModules = limited.filteredChildren;
            },
            chunkOrigins: (object, chunk, context, _options, factory)=>{
                let { type } = context;
                object.origins = factory.create(`${type}.origins`, chunk.origins, context);
            }
        },
        chunkOrigin: {
            _: (object, origin, _context)=>{
                let { moduleDescriptor, loc, request } = origin;
                Object.assign(object, {
                    module: moduleDescriptor ? moduleDescriptor.identifier : "",
                    moduleIdentifier: moduleDescriptor ? moduleDescriptor.identifier : "",
                    moduleName: moduleDescriptor ? moduleDescriptor.name : "",
                    loc,
                    request
                });
            },
            ids: (object, origin)=>{
                object.moduleId = origin.moduleDescriptor?.id;
            }
        },
        error: EXTRACT_ERROR,
        warning: EXTRACT_ERROR,
        moduleTraceItem: {
            _: (object, { origin, module: module1, dependencies }, context, _, factory)=>{
                let { type } = context;
                origin.moduleDescriptor && (object.originIdentifier = origin.moduleDescriptor.identifier, object.originName = origin.moduleDescriptor.name), module1.moduleDescriptor && (object.moduleIdentifier = module1.moduleDescriptor.identifier, object.moduleName = module1.moduleDescriptor.name), object.dependencies = factory.create(`${type}.dependencies`, dependencies, context);
            },
            ids: (object, { origin, module: module1 })=>{
                object.originId = origin.moduleDescriptor.id, object.moduleId = module1.moduleDescriptor.id;
            }
        },
        moduleTraceDependency: {
            _: (object, dependency)=>{
                object.loc = dependency.loc;
            }
        }
    }, FILTER = {
        "module.reasons": {
            "!orphanModules": (reason)=>{
                if (0 === reason.moduleChunks) return !1;
            }
        }
    };
    class DefaultStatsFactoryPlugin {
        apply(compiler) {
            compiler.hooks.compilation.tap("DefaultStatsFactoryPlugin", (compilation)=>{
                compilation.hooks.statsFactory.tap("DefaultStatsFactoryPlugin", (stats, options)=>{
                    for (let key of (iterateConfig(SIMPLE_EXTRACTORS, options, (hookFor, fn)=>{
                        stats.hooks.extract.for(hookFor).tap("DefaultStatsFactoryPlugin", (obj, data, ctx)=>fn(obj, data, ctx, options, stats));
                    }), iterateConfig(FILTER, options, (hookFor, fn)=>{
                        stats.hooks.filter.for(hookFor).tap("DefaultStatsFactoryPlugin", (item, ctx, idx, i)=>fn(item, ctx, options, idx, i));
                    }), iterateConfig(SORTERS, options, (hookFor, fn)=>{
                        stats.hooks.sort.for(hookFor).tap("DefaultStatsFactoryPlugin", (comparators, ctx)=>fn(comparators, ctx, options));
                    }), iterateConfig(RESULT_SORTERS, options, (hookFor, fn)=>{
                        stats.hooks.sortResults.for(hookFor).tap("DefaultStatsFactoryPlugin", (comparators, ctx)=>fn(comparators, ctx, options));
                    }), iterateConfig(RESULT_GROUPERS, options, (hookFor, fn)=>{
                        stats.hooks.groupResults.for(hookFor).tap("DefaultStatsFactoryPlugin", (groupConfigs, ctx)=>fn(groupConfigs, ctx, options));
                    }), Object.keys(ITEM_NAMES))){
                        let itemName = ITEM_NAMES[key];
                        stats.hooks.getItemName.for(key).tap("DefaultStatsFactoryPlugin", ()=>itemName);
                    }
                    for (let key of Object.keys(MERGER)){
                        let merger = MERGER[key];
                        stats.hooks.merge.for(key).tap("DefaultStatsFactoryPlugin", merger);
                    }
                });
            });
        }
    }
    let applyDefaults = (options, defaults)=>{
        for (let key of Object.keys(defaults))void 0 === options[key] && (options[key] = defaults[key]);
    }, NAMED_PRESETS = {
        verbose: {
            hash: !0,
            builtAt: !0,
            relatedAssets: !0,
            entrypoints: !0,
            chunkGroups: !0,
            ids: !0,
            modules: !1,
            chunks: !0,
            chunkRelations: !0,
            chunkModules: !0,
            dependentModules: !0,
            chunkOrigins: !0,
            depth: !0,
            env: !0,
            reasons: !0,
            usedExports: !0,
            providedExports: !0,
            optimizationBailout: !0,
            errorDetails: !0,
            errorStack: !0,
            publicPath: !0,
            logging: "verbose",
            orphanModules: !0,
            runtimeModules: !0,
            excludeModules: !1,
            errorsSpace: 1 / 0,
            warningsSpace: 1 / 0,
            modulesSpace: 1 / 0,
            chunkModulesSpace: 1 / 0,
            assetsSpace: 1 / 0,
            reasonsSpace: 1 / 0,
            children: !0
        },
        detailed: {
            hash: !0,
            builtAt: !0,
            relatedAssets: !0,
            entrypoints: !0,
            chunkGroups: !0,
            ids: !0,
            chunks: !0,
            chunkRelations: !0,
            chunkModules: !1,
            chunkOrigins: !0,
            depth: !0,
            usedExports: !0,
            providedExports: !0,
            optimizationBailout: !0,
            errorDetails: !0,
            publicPath: !0,
            logging: !0,
            runtimeModules: !0,
            excludeModules: !1,
            errorsSpace: 1000,
            warningsSpace: 1000,
            modulesSpace: 1000,
            assetsSpace: 1000,
            reasonsSpace: 1000
        },
        minimal: {
            all: !1,
            version: !0,
            timings: !0,
            modules: !0,
            errorsSpace: 0,
            warningsSpace: 0,
            modulesSpace: 0,
            assets: !0,
            assetsSpace: 0,
            errors: !0,
            errorsCount: !0,
            warnings: !0,
            warningsCount: !0,
            logging: "warn"
        },
        "errors-only": {
            all: !1,
            errors: !0,
            errorsCount: !0,
            errorsSpace: 1 / 0,
            moduleTrace: !0,
            logging: "error"
        },
        "errors-warnings": {
            all: !1,
            errors: !0,
            errorsCount: !0,
            errorsSpace: 1 / 0,
            warnings: !0,
            warningsCount: !0,
            warningsSpace: 1 / 0,
            logging: "warn"
        },
        summary: {
            all: !1,
            version: !0,
            errorsCount: !0,
            warningsCount: !0
        },
        none: {
            all: !1
        }
    }, NORMAL_ON = ({ all })=>!1 !== all, NORMAL_OFF = ({ all })=>!0 === all, ON_FOR_TO_STRING = ({ all }, { forToString })=>forToString ? !1 !== all : !0 === all, OFF_FOR_TO_STRING = ({ all }, { forToString })=>forToString ? !0 === all : !1 !== all, AUTO_FOR_TO_STRING = ({ all }, { forToString })=>!1 !== all && (!0 === all || !forToString || "auto"), DEFAULTS = {
        performance: NORMAL_ON,
        hash: OFF_FOR_TO_STRING,
        env: NORMAL_OFF,
        version: NORMAL_ON,
        timings: NORMAL_ON,
        builtAt: OFF_FOR_TO_STRING,
        assets: NORMAL_ON,
        entrypoints: AUTO_FOR_TO_STRING,
        chunkGroups: OFF_FOR_TO_STRING,
        chunkGroupAuxiliary: OFF_FOR_TO_STRING,
        chunkGroupChildren: OFF_FOR_TO_STRING,
        chunkGroupMaxAssets: (_, { forToString })=>forToString ? 5 : 1 / 0,
        chunks: OFF_FOR_TO_STRING,
        chunkRelations: OFF_FOR_TO_STRING,
        chunkModules: ({ all, modules })=>!1 !== all && (!0 === all || !modules),
        dependentModules: OFF_FOR_TO_STRING,
        chunkOrigins: OFF_FOR_TO_STRING,
        ids: OFF_FOR_TO_STRING,
        modules: ({ all, chunks, chunkModules }, { forToString })=>!1 !== all && (!0 === all || !forToString || !chunks || !chunkModules),
        nestedModules: OFF_FOR_TO_STRING,
        groupModulesByType: ON_FOR_TO_STRING,
        groupModulesByCacheStatus: ON_FOR_TO_STRING,
        groupModulesByLayer: ON_FOR_TO_STRING,
        groupModulesByAttributes: ON_FOR_TO_STRING,
        groupModulesByPath: ON_FOR_TO_STRING,
        groupModulesByExtension: ON_FOR_TO_STRING,
        modulesSpace: (_, { forToString })=>forToString ? 15 : 1 / 0,
        chunkModulesSpace: (_, { forToString })=>forToString ? 10 : 1 / 0,
        nestedModulesSpace: (_, { forToString })=>forToString ? 10 : 1 / 0,
        relatedAssets: OFF_FOR_TO_STRING,
        groupAssetsByEmitStatus: ON_FOR_TO_STRING,
        groupAssetsByInfo: ON_FOR_TO_STRING,
        groupAssetsByPath: ON_FOR_TO_STRING,
        groupAssetsByExtension: ON_FOR_TO_STRING,
        groupAssetsByChunk: ON_FOR_TO_STRING,
        assetsSpace: (_, { forToString })=>forToString ? 15 : 1 / 0,
        orphanModules: OFF_FOR_TO_STRING,
        runtimeModules: ({ all, runtime }, { forToString })=>void 0 !== runtime ? runtime : forToString ? !0 === all : !1 !== all,
        cachedModules: ({ all, cached }, { forToString })=>void 0 !== cached ? cached : forToString ? !0 === all : !1 !== all,
        moduleAssets: OFF_FOR_TO_STRING,
        depth: OFF_FOR_TO_STRING,
        cachedAssets: OFF_FOR_TO_STRING,
        reasons: OFF_FOR_TO_STRING,
        reasonsSpace: (_, { forToString })=>forToString ? 15 : 1 / 0,
        groupReasonsByOrigin: ON_FOR_TO_STRING,
        usedExports: OFF_FOR_TO_STRING,
        providedExports: OFF_FOR_TO_STRING,
        optimizationBailout: OFF_FOR_TO_STRING,
        children: OFF_FOR_TO_STRING,
        source: NORMAL_OFF,
        moduleTrace: NORMAL_ON,
        errors: NORMAL_ON,
        errorsCount: NORMAL_ON,
        errorDetails: AUTO_FOR_TO_STRING,
        errorStack: OFF_FOR_TO_STRING,
        warnings: NORMAL_ON,
        warningsCount: NORMAL_ON,
        publicPath: OFF_FOR_TO_STRING,
        logging: ({ all }, { forToString })=>!!forToString && !1 !== all && "info",
        loggingDebug: ()=>[],
        loggingTrace: OFF_FOR_TO_STRING,
        excludeModules: ()=>[],
        excludeAssets: ()=>[],
        modulesSort: ()=>"depth",
        chunkModulesSort: ()=>"name",
        nestedModulesSort: ()=>!1,
        chunksSort: ()=>!1,
        assetsSort: ()=>"!size",
        outputPath: OFF_FOR_TO_STRING,
        colors: ()=>!1
    }, normalizeFilter = (item)=>{
        if ("string" == typeof item) {
            let regExp = RegExp(`[\\\\/]${item.replace(/[-[\]{}()*+?.\\^$|]/g, "\\$&")}([\\\\/]|$|!|\\?)`);
            return (ident)=>regExp.test(ident);
        }
        if (item && "object" == typeof item && "test" in item && "function" == typeof item.test) {
            let test = item.test.bind(item);
            return (ident)=>test(ident);
        }
        return "function" == typeof item ? item : "boolean" == typeof item ? ()=>item : void 0;
    }, NORMALIZER = {
        excludeModules: (value)=>(Array.isArray(value) ? value : value ? [
                value
            ] : []).map(normalizeFilter),
        excludeAssets: (value)=>(Array.isArray(value) ? value : value ? [
                value
            ] : []).map(normalizeFilter),
        warningsFilter: (value)=>(Array.isArray(value) ? value : value ? [
                value
            ] : []).map((filter)=>{
                if ("string" == typeof filter) return (warning, warningString)=>warningString.includes(filter);
                if (filter instanceof RegExp) return (warning, warningString)=>filter.test(warningString);
                if ("function" == typeof filter) return filter;
                throw Error(`Can only filter warnings with Strings or RegExps. (Given: ${filter})`);
            }),
        logging: (value)=>!0 === value ? "log" : value,
        loggingDebug: (value)=>(Array.isArray(value) ? value : value ? [
                value
            ] : []).map(normalizeFilter)
    };
    class DefaultStatsPresetPlugin {
        apply(compiler) {
            compiler.hooks.compilation.tap("DefaultStatsPresetPlugin", (compilation)=>{
                for (let key of Object.keys(NAMED_PRESETS)){
                    let defaults = NAMED_PRESETS[key];
                    compilation.hooks.statsPreset.for(key).tap("DefaultStatsPresetPlugin", (options)=>{
                        applyDefaults(options, defaults);
                    });
                }
                compilation.hooks.statsNormalize.tap("DefaultStatsPresetPlugin", (options, context)=>{
                    for (let key of Object.keys(DEFAULTS))void 0 === options[key] && (options[key] = DEFAULTS[key](options, context, compilation));
                    for (let key of Object.keys(NORMALIZER))options[key] = NORMALIZER[key](options[key]);
                });
            });
        }
    }
    let DefaultStatsPrinterPlugin_plural = (n, singular, plural)=>1 === n ? singular : plural, printSizes = (sizes, { formatSize = (n)=>`${n}` })=>{
        let keys = Object.keys(sizes);
        return keys.length > 1 ? keys.map((key)=>`${formatSize(sizes[key])} (${key})`).join(" ") : 1 === keys.length ? formatSize(sizes[keys[0]]) : void 0;
    }, getResourceName = (resource)=>{
        let dataUrl = /^data:[^,]+,/.exec(resource);
        if (!dataUrl) return resource;
        let len = dataUrl[0].length + 16;
        return resource.length < len ? resource : `${resource.slice(0, Math.min(resource.length - 2, len))}..`;
    }, mapLines = (str, fn)=>str.split("\n").map(fn).join("\n"), twoDigit = (n)=>n >= 10 ? `${n}` : `0${n}`, moreCount = (list, count)=>list && list.length > 0 ? `+ ${count}` : `${count}`, SIMPLE_PRINTERS = {
        "compilation.summary!": (_, { type, bold, green, red, yellow, formatDateTime, formatTime, compilation: { name, hash, rspackVersion, time, builtAt, errorsCount, warningsCount } })=>{
            let statusMessage, root = "compilation.summary!" === type, warningsMessage = warningsCount && warningsCount > 0 ? yellow(`${warningsCount} ${DefaultStatsPrinterPlugin_plural(warningsCount, "warning", "warnings")}`) : "", errorsMessage = errorsCount && errorsCount > 0 ? red(`${errorsCount} ${DefaultStatsPrinterPlugin_plural(errorsCount, "error", "errors")}`) : "", timeMessage = root && time ? ` in ${formatTime(time)}` : "", hashMessage = hash ? ` (${hash})` : "", builtAtMessage = root && builtAt ? `${formatDateTime(builtAt)}: ` : "", versionMessage = root && rspackVersion ? `Rspack ${rspackVersion}` : "", nameMessage = root && name ? bold(name) : name ? `Child ${bold(name)}` : root ? "" : "Child", subjectMessage = nameMessage && versionMessage ? `${nameMessage} (${versionMessage})` : versionMessage || nameMessage || "Rspack";
            if (statusMessage = errorsMessage && warningsMessage ? `compiled with ${errorsMessage} and ${warningsMessage}` : errorsMessage ? `compiled with ${errorsMessage}` : warningsMessage ? `compiled with ${warningsMessage}` : 0 === errorsCount && 0 === warningsCount ? `compiled ${green("successfully")}` : "compiled", builtAtMessage || versionMessage || errorsMessage || warningsMessage || 0 === errorsCount && 0 === warningsCount || timeMessage || hashMessage) return `${builtAtMessage}${subjectMessage} ${statusMessage}${timeMessage}${hashMessage}`;
        },
        "compilation.filteredWarningDetailsCount": (count)=>count ? `${count} ${DefaultStatsPrinterPlugin_plural(count, "warning has", "warnings have")} detailed information that is not shown.\nUse 'stats.errorDetails: true' resp. '--stats-error-details' to show it.` : void 0,
        "compilation.filteredErrorDetailsCount": (count, { yellow })=>count ? yellow(`${count} ${DefaultStatsPrinterPlugin_plural(count, "error has", "errors have")} detailed information that is not shown.\nUse 'stats.errorDetails: true' resp. '--stats-error-details' to show it.`) : void 0,
        "compilation.env": (env, { bold })=>env ? `Environment (--env): ${bold(JSON.stringify(env, null, 2))}` : void 0,
        "compilation.publicPath": (publicPath, { bold })=>`PublicPath: ${bold(publicPath || "(none)")}`,
        "compilation.entrypoints": (entrypoints, context, printer)=>Array.isArray(entrypoints) ? void 0 : printer.print(context.type, Object.values(entrypoints), {
                ...context,
                chunkGroupKind: "Entrypoint"
            }),
        "compilation.namedChunkGroups": (namedChunkGroups, context, printer)=>{
            if (!Array.isArray(namedChunkGroups)) {
                let { compilation: { entrypoints } } = context, chunkGroups = Object.values(namedChunkGroups);
                return entrypoints && (chunkGroups = chunkGroups.filter((group)=>!Object.prototype.hasOwnProperty.call(entrypoints, group.name))), printer.print(context.type, chunkGroups, {
                    ...context,
                    chunkGroupKind: "Chunk Group"
                });
            }
        },
        "compilation.assetsByChunkName": ()=>"",
        "compilation.filteredModules": (filteredModules, { compilation: { modules } })=>filteredModules > 0 ? `${moreCount(modules, filteredModules)} ${DefaultStatsPrinterPlugin_plural(filteredModules, "module", "modules")}` : void 0,
        "compilation.filteredAssets": (filteredAssets, { compilation: { assets } })=>filteredAssets > 0 ? `${moreCount(assets, filteredAssets)} ${DefaultStatsPrinterPlugin_plural(filteredAssets, "asset", "assets")}` : void 0,
        "compilation.logging": (logging, context, printer)=>Array.isArray(logging) ? void 0 : printer.print(context.type, Object.entries(logging).map(([name, value])=>({
                    ...value,
                    name
                })), context),
        "compilation.warningsInChildren!": (_, { yellow, compilation })=>{
            if (!compilation.children && compilation.warningsCount && compilation.warningsCount > 0 && compilation.warnings) {
                let childWarnings = compilation.warningsCount - compilation.warnings.length;
                if (childWarnings > 0) return yellow(`${childWarnings} ${DefaultStatsPrinterPlugin_plural(childWarnings, "WARNING", "WARNINGS")} in child compilations${compilation.children ? "" : " (Use 'stats.children: true' resp. '--stats-children' for more details)"}`);
            }
        },
        "compilation.errorsInChildren!": (_, { red, compilation })=>{
            if (!compilation.children && compilation.errorsCount && compilation.errorsCount > 0 && compilation.errors) {
                let childErrors = compilation.errorsCount - compilation.errors.length;
                if (childErrors > 0) return red(`${childErrors} ${DefaultStatsPrinterPlugin_plural(childErrors, "ERROR", "ERRORS")} in child compilations${compilation.children ? "" : " (Use 'stats.children: true' resp. '--stats-children' for more details)"}`);
            }
        },
        "asset.type": (type)=>type,
        "asset.name": (name, { formatFilename, asset: { isOverSizeLimit } })=>formatFilename(name, isOverSizeLimit),
        "asset.size": (size, { asset: { isOverSizeLimit }, yellow, formatSize })=>isOverSizeLimit ? yellow(formatSize(size)) : formatSize(size),
        "asset.emitted": (emitted, { green, formatFlag })=>emitted ? green(formatFlag("emitted")) : void 0,
        "asset.comparedForEmit": (comparedForEmit, { yellow, formatFlag })=>comparedForEmit ? yellow(formatFlag("compared for emit")) : void 0,
        "asset.cached": (cached, { green, formatFlag })=>cached ? green(formatFlag("cached")) : void 0,
        "asset.isOverSizeLimit": (isOverSizeLimit, { yellow, formatFlag })=>isOverSizeLimit ? yellow?.(formatFlag("big")) : void 0,
        "asset.info.immutable": (immutable, { green, formatFlag })=>immutable ? green(formatFlag("immutable")) : void 0,
        "asset.info.javascriptModule": (javascriptModule, { formatFlag })=>javascriptModule ? formatFlag("javascript module") : void 0,
        "asset.info.sourceFilename": (sourceFilename, { formatFlag })=>sourceFilename ? formatFlag(!0 === sourceFilename ? "from source file" : `from: ${sourceFilename}`) : void 0,
        "asset.info.copied": (copied, { green, formatFlag })=>copied ? green(formatFlag("copied")) : void 0,
        "asset.info.development": (development, { green, formatFlag })=>development ? green(formatFlag("dev")) : void 0,
        "asset.info.hotModuleReplacement": (hotModuleReplacement, { green, formatFlag })=>hotModuleReplacement ? green(formatFlag("hmr")) : void 0,
        "asset.separator!": ()=>"\n",
        "asset.filteredRelated": (filteredRelated, { asset: { related } })=>filteredRelated > 0 ? `${moreCount(related, filteredRelated)} related ${DefaultStatsPrinterPlugin_plural(filteredRelated, "asset", "assets")}` : void 0,
        "asset.filteredChildren": (filteredChildren, { asset: { children } })=>filteredChildren > 0 ? `${moreCount(children, filteredChildren)} ${DefaultStatsPrinterPlugin_plural(filteredChildren, "asset", "assets")}` : void 0,
        assetChunk: (id, { formatChunkId })=>formatChunkId(id),
        assetChunkName: (name)=>name,
        assetChunkIdHint: (name)=>name,
        "module.type": (type)=>"module" !== type ? type : void 0,
        "module.id": (id, { formatModuleId })=>{
            let id1;
            return "number" == typeof (id1 = id) || id1 ? formatModuleId(id) : void 0;
        },
        "module.name": (name, { bold })=>{
            let [prefix, resource] = ((name)=>{
                let matchResourceMatch = /^([^!]+)!=!/.exec(name), n = matchResourceMatch ? matchResourceMatch[0] + getResourceName(name.slice(matchResourceMatch[0].length)) : name, [, prefix, resource] = /^(.*!)?([^!]*)$/.exec(n) || [];
                return [
                    prefix,
                    getResourceName(resource)
                ];
            })(name);
            return `${prefix || ""}${bold(resource || "")}`;
        },
        "module.identifier": (_identifier)=>void 0,
        "module.layer": (layer, { formatLayer })=>layer ? formatLayer(layer) : void 0,
        "module.sizes": printSizes,
        "module.chunks[]": (id, { formatChunkId })=>formatChunkId(id),
        "module.depth": (depth, { formatFlag })=>null !== depth ? formatFlag(`depth ${depth}`) : void 0,
        "module.cacheable": (cacheable, { formatFlag, red })=>!1 === cacheable ? red(formatFlag("not cacheable")) : void 0,
        "module.orphan": (orphan, { formatFlag, yellow })=>orphan ? yellow(formatFlag("orphan")) : void 0,
        "module.runtime": (runtime, { formatFlag, yellow })=>runtime ? yellow(formatFlag("runtime")) : void 0,
        "module.optional": (optional, { formatFlag, yellow })=>optional ? yellow(formatFlag("optional")) : void 0,
        "module.dependent": (dependent, { formatFlag, cyan })=>dependent ? cyan(formatFlag("dependent")) : void 0,
        "module.built": (built, { formatFlag, yellow })=>built ? yellow(formatFlag("built")) : void 0,
        "module.codeGenerated": (codeGenerated, { formatFlag, yellow })=>codeGenerated ? yellow(formatFlag("code generated")) : void 0,
        "module.buildTimeExecuted": (buildTimeExecuted, { formatFlag, green })=>buildTimeExecuted ? green(formatFlag("build time executed")) : void 0,
        "module.cached": (cached, { formatFlag, green })=>cached ? green(formatFlag("cached")) : void 0,
        "module.assets": (assets, { formatFlag, magenta })=>assets?.length ? magenta(formatFlag(`${assets.length} ${DefaultStatsPrinterPlugin_plural(assets.length, "asset", "assets")}`)) : void 0,
        "module.warnings": (warnings, { formatFlag, yellow })=>!0 === warnings ? yellow(formatFlag("warnings")) : warnings ? yellow(formatFlag(`${warnings} ${DefaultStatsPrinterPlugin_plural(warnings, "warning", "warnings")}`)) : void 0,
        "module.errors": (errors, { formatFlag, red })=>!0 === errors ? red(formatFlag("errors")) : errors ? red(formatFlag(`${errors} ${DefaultStatsPrinterPlugin_plural(errors, "error", "errors")}`)) : void 0,
        "module.providedExports": (providedExports, { formatFlag, cyan })=>{
            if (Array.isArray(providedExports)) return 0 === providedExports.length ? cyan(formatFlag("no exports")) : cyan(formatFlag(`exports: ${providedExports.join(", ")}`));
        },
        "module.usedExports": (usedExports, { formatFlag, cyan, module: module1 })=>{
            if (!0 !== usedExports) {
                if (null === usedExports) return cyan(formatFlag("used exports unknown"));
                if (!1 === usedExports) return cyan(formatFlag("module unused"));
                if (Array.isArray(usedExports)) {
                    if (0 === usedExports.length) return cyan(formatFlag("no exports used"));
                    let providedExportsCount = Array.isArray(module1.providedExports) ? module1.providedExports.length : null;
                    return null !== providedExportsCount && providedExportsCount === usedExports.length ? cyan(formatFlag("all exports used")) : cyan(formatFlag(`only some exports used: ${usedExports.join(", ")}`));
                }
            }
        },
        "module.optimizationBailout[]": (optimizationBailout, { yellow })=>yellow(optimizationBailout),
        "module.issuerPath": (_issuerPath, { module: module1 })=>module1.profile ? void 0 : "",
        "module.profile": (_profile)=>void 0,
        "module.filteredModules": (filteredModules, { module: { modules } })=>filteredModules > 0 ? `${moreCount(modules, filteredModules)} nested ${DefaultStatsPrinterPlugin_plural(filteredModules, "module", "modules")}` : void 0,
        "module.filteredReasons": (filteredReasons, { module: { reasons } })=>filteredReasons > 0 ? `${moreCount(reasons, filteredReasons)} ${DefaultStatsPrinterPlugin_plural(filteredReasons, "reason", "reasons")}` : void 0,
        "module.filteredChildren": (filteredChildren, { module: { children } })=>filteredChildren > 0 ? `${moreCount(children, filteredChildren)} ${DefaultStatsPrinterPlugin_plural(filteredChildren, "module", "modules")}` : void 0,
        "module.separator!": ()=>"\n",
        "moduleIssuer.id": (id, { formatModuleId })=>formatModuleId(id),
        "moduleIssuer.profile.total": (value, { formatTime })=>formatTime(value),
        "moduleReason.type": (type)=>type,
        "moduleReason.userRequest": (userRequest, { cyan })=>cyan(getResourceName(userRequest)),
        "moduleReason.moduleId": (moduleId, { formatModuleId })=>{
            let id;
            return "number" == typeof (id = moduleId) || id ? formatModuleId(moduleId) : void 0;
        },
        "moduleReason.module": (module1, { magenta })=>magenta(module1),
        "moduleReason.loc": (loc)=>loc,
        "moduleReason.explanation": (explanation, { cyan })=>cyan(explanation),
        "moduleReason.active": (active, { formatFlag })=>active ? void 0 : formatFlag("inactive"),
        "moduleReason.resolvedModule": (module1, { magenta })=>magenta(module1),
        "moduleReason.filteredChildren": (filteredChildren, { moduleReason: { children } })=>filteredChildren > 0 ? `${moreCount(children, filteredChildren)} ${DefaultStatsPrinterPlugin_plural(filteredChildren, "reason", "reasons")}` : void 0,
        "module.profile.total": (value, { formatTime })=>formatTime(value),
        "module.profile.resolving": (value, { formatTime })=>`resolving: ${formatTime(value)}`,
        "module.profile.restoring": (value, { formatTime })=>`restoring: ${formatTime(value)}`,
        "module.profile.integration": (value, { formatTime })=>`integration: ${formatTime(value)}`,
        "module.profile.building": (value, { formatTime })=>`building: ${formatTime(value)}`,
        "module.profile.storing": (value, { formatTime })=>`storing: ${formatTime(value)}`,
        "module.profile.additionalResolving": (value, { formatTime })=>value ? `additional resolving: ${formatTime(value)}` : void 0,
        "module.profile.additionalIntegration": (value, { formatTime })=>value ? `additional integration: ${formatTime(value)}` : void 0,
        "chunkGroup.kind!": (_, { chunkGroupKind })=>chunkGroupKind,
        "chunkGroup.separator!": ()=>"\n",
        "chunkGroup.name": (name, { bold })=>bold(name),
        "chunkGroup.isOverSizeLimit": (isOverSizeLimit, { formatFlag, yellow })=>isOverSizeLimit ? yellow(formatFlag("big")) : void 0,
        "chunkGroup.assetsSize": (size, { formatSize })=>size ? formatSize(size) : void 0,
        "chunkGroup.auxiliaryAssetsSize": (size, { formatSize })=>size ? `(${formatSize(size)})` : void 0,
        "chunkGroup.filteredAssets": (n, { chunkGroup: { assets } })=>n > 0 ? `${moreCount(assets, n)} ${DefaultStatsPrinterPlugin_plural(n, "asset", "assets")}` : void 0,
        "chunkGroup.filteredAuxiliaryAssets": (n, { chunkGroup: { auxiliaryAssets } })=>n > 0 ? `${moreCount(auxiliaryAssets, n)} auxiliary ${DefaultStatsPrinterPlugin_plural(n, "asset", "assets")}` : void 0,
        "chunkGroup.is!": ()=>"=",
        "chunkGroupAsset.name": (asset, { green })=>green(asset),
        "chunkGroupAsset.size": (size, { formatSize, chunkGroup })=>chunkGroup.assets && chunkGroup.assets.length > 1 || chunkGroup.auxiliaryAssets && chunkGroup.auxiliaryAssets.length > 0 ? formatSize(size) : void 0,
        "chunkGroup.children": (children, context, printer)=>Array.isArray(children) ? void 0 : printer.print(context.type, Object.keys(children).map((key)=>({
                    type: key,
                    children: children[key]
                })), context),
        "chunkGroupChildGroup.type": (type)=>`${type}:`,
        "chunkGroupChild.assets[]": (file, { formatFilename })=>formatFilename(file),
        "chunkGroupChild.chunks[]": (id, { formatChunkId })=>formatChunkId(id),
        "chunkGroupChild.name": (name)=>name ? `(name: ${name})` : void 0,
        "chunk.id": (id, { formatChunkId })=>formatChunkId(id),
        "chunk.files[]": (file, { formatFilename })=>formatFilename(file),
        "chunk.names[]": (name)=>name,
        "chunk.idHints[]": (name)=>name,
        "chunk.runtime[]": (name)=>name,
        "chunk.sizes": (sizes, context)=>printSizes(sizes, context),
        "chunk.parents[]": (parents, context)=>context.formatChunkId(parents, "parent"),
        "chunk.siblings[]": (siblings, context)=>context.formatChunkId(siblings, "sibling"),
        "chunk.children[]": (children, context)=>context.formatChunkId(children, "child"),
        "chunk.childrenByOrder": (childrenByOrder, context, printer)=>{
            if (Array.isArray(childrenByOrder)) return;
            let items = Object.keys(childrenByOrder).map((key)=>({
                    type: key,
                    children: childrenByOrder[key]
                }));
            return items.sort((a, b)=>compareIds(a.type, b.type)), Array.isArray(childrenByOrder) ? void 0 : printer.print(context.type, items, context);
        },
        "chunk.childrenByOrder[].type": (type)=>`${type}:`,
        "chunk.childrenByOrder[].children[]": (id, { formatChunkId })=>{
            let id1;
            return "number" == typeof (id1 = id) || id1 ? formatChunkId(id) : void 0;
        },
        "chunk.entry": (entry, { formatFlag, yellow })=>entry ? yellow(formatFlag("entry")) : void 0,
        "chunk.initial": (initial, { formatFlag, yellow })=>initial ? yellow(formatFlag("initial")) : void 0,
        "chunk.rendered": (rendered, { formatFlag, green })=>rendered ? green(formatFlag("rendered")) : void 0,
        "chunk.recorded": (recorded, { formatFlag, green })=>recorded ? green(formatFlag("recorded")) : void 0,
        "chunk.reason": (reason, { yellow })=>reason ? yellow(reason) : void 0,
        "chunk.filteredModules": (filteredModules, { chunk: { modules } })=>filteredModules > 0 ? `${moreCount(modules, filteredModules)} chunk ${DefaultStatsPrinterPlugin_plural(filteredModules, "module", "modules")}` : void 0,
        "chunk.separator!": ()=>"\n",
        "chunkOrigin.request": (request)=>request,
        "chunkOrigin.moduleId": (moduleId, { formatModuleId })=>{
            let id;
            return "number" == typeof (id = moduleId) || id ? formatModuleId(moduleId) : void 0;
        },
        "chunkOrigin.moduleName": (moduleName, { bold })=>bold(moduleName),
        "chunkOrigin.loc": (loc)=>loc,
        "error.file": (file, { bold })=>bold(file),
        "error.moduleName": (moduleName, { bold })=>moduleName.includes("!") ? `${bold(moduleName.replace(/^(\s|\S)*!/, ""))} (${moduleName})` : bold(moduleName),
        "error.loc": (loc, { green })=>green(loc),
        "error.message": (message, { bold, formatError })=>message.includes("\u001b[") ? message : bold(formatError(message)),
        "error.details": (details, { formatError })=>formatError(details),
        "error.stack": (stack)=>stack,
        "error.moduleTrace": (_moduleTrace)=>void 0,
        "error.separator!": ()=>"\n",
        "loggingEntry(error).loggingEntry.message": (message, { red })=>mapLines(message, (x)=>`<e> ${red(x)}`),
        "loggingEntry(warn).loggingEntry.message": (message, { yellow })=>mapLines(message, (x)=>`<w> ${yellow(x)}`),
        "loggingEntry(info).loggingEntry.message": (message, { green })=>mapLines(message, (x)=>`<i> ${green(x)}`),
        "loggingEntry(log).loggingEntry.message": (message, { bold })=>mapLines(message, (x)=>`    ${bold(x)}`),
        "loggingEntry(debug).loggingEntry.message": (message)=>mapLines(message, (x)=>`    ${x}`),
        "loggingEntry(trace).loggingEntry.message": (message)=>mapLines(message, (x)=>`    ${x}`),
        "loggingEntry(status).loggingEntry.message": (message, { magenta })=>mapLines(message, (x)=>`<s> ${magenta(x)}`),
        "loggingEntry(profile).loggingEntry.message": (message, { magenta })=>mapLines(message, (x)=>`<p> ${magenta(x)}`),
        "loggingEntry(profileEnd).loggingEntry.message": (message, { magenta })=>mapLines(message, (x)=>`</p> ${magenta(x)}`),
        "loggingEntry(time).loggingEntry.message": (message, { magenta })=>mapLines(message, (x)=>`<t> ${magenta(x)}`),
        "loggingEntry(cache).loggingEntry.message": (message, { magenta })=>mapLines(message, (x)=>`<c> ${magenta(x)}`),
        "loggingEntry(group).loggingEntry.message": (message, { cyan })=>mapLines(message, (x)=>`<-> ${cyan(x)}`),
        "loggingEntry(groupCollapsed).loggingEntry.message": (message, { cyan })=>mapLines(message, (x)=>`<+> ${cyan(x)}`),
        "loggingEntry(clear).loggingEntry": ()=>"    -------",
        "loggingEntry(groupCollapsed).loggingEntry.children": ()=>"",
        "loggingEntry.trace[]": (trace)=>trace ? mapLines(trace, (x)=>`| ${x}`) : void 0,
        "moduleTraceItem.originName": (originName)=>originName,
        loggingGroup: (loggingGroup)=>0 === loggingGroup.entries.length ? "" : void 0,
        "loggingGroup.debug": (flag, { red })=>flag ? red("DEBUG") : void 0,
        "loggingGroup.name": (name, { bold })=>bold(`LOG from ${name}`),
        "loggingGroup.separator!": ()=>"\n",
        "loggingGroup.filteredEntries": (filteredEntries)=>filteredEntries > 0 ? `+ ${filteredEntries} hidden lines` : void 0,
        "moduleTraceDependency.loc": (loc)=>loc
    }, DefaultStatsPrinterPlugin_ITEM_NAMES = {
        ...SHARED_ITEM_NAMES,
        "compilation.warnings[]": "error",
        "compilation.logging[]": "loggingGroup",
        "asset.children[]": "asset",
        "asset.chunks[]": "assetChunk",
        "asset.auxiliaryChunks[]": "assetChunk",
        "asset.chunkNames[]": "assetChunkName",
        "asset.chunkIdHints[]": "assetChunkIdHint",
        "asset.auxiliaryChunkNames[]": "assetChunkName",
        "asset.auxiliaryChunkIdHints[]": "assetChunkIdHint",
        "chunkGroup.assets[]": "chunkGroupAsset",
        "chunkGroup.auxiliaryAssets[]": "chunkGroupAsset",
        "chunkGroupChild.assets[]": "chunkGroupAsset",
        "chunkGroupChild.auxiliaryAssets[]": "chunkGroupAsset",
        "chunkGroup.children[]": "chunkGroupChildGroup",
        "chunkGroupChildGroup.children[]": "chunkGroupChild",
        "moduleReason.children[]": "moduleReason",
        "loggingGroup.entries[]": (logEntry)=>`loggingEntry(${logEntry.type}).loggingEntry`,
        "loggingEntry.children[]": (logEntry)=>`loggingEntry(${logEntry.type}).loggingEntry`,
        "error.moduleTrace[]": "moduleTraceItem",
        "moduleTraceItem.dependencies[]": "moduleTraceDependency"
    }, ERROR_PREFERRED_ORDER = [
        "compilerPath",
        "chunkId",
        "chunkEntry",
        "chunkInitial",
        "file",
        "separator!",
        "moduleName",
        "loc",
        "separator!",
        "message",
        "separator!",
        "details",
        "separator!",
        "stack",
        "separator!",
        "missing",
        "separator!",
        "moduleTrace"
    ], PREFERRED_ORDERS = {
        compilation: [
            "name",
            "hash",
            "rspackVersion",
            "time",
            "builtAt",
            "env",
            "publicPath",
            "assets",
            "filteredAssets",
            "entrypoints",
            "namedChunkGroups",
            "chunks",
            "modules",
            "filteredModules",
            "children",
            "logging",
            "warnings",
            "warningsInChildren!",
            "filteredWarningDetailsCount",
            "errors",
            "errorsInChildren!",
            "filteredErrorDetailsCount",
            "summary!",
            "needAdditionalPass"
        ],
        asset: [
            "type",
            "name",
            "size",
            "chunks",
            "auxiliaryChunks",
            "emitted",
            "comparedForEmit",
            "cached",
            "info",
            "isOverSizeLimit",
            "chunkNames",
            "auxiliaryChunkNames",
            "chunkIdHints",
            "auxiliaryChunkIdHints",
            "related",
            "filteredRelated",
            "children",
            "filteredChildren"
        ],
        "asset.info": [
            "immutable",
            "sourceFilename",
            "copied",
            "javascriptModule",
            "development",
            "hotModuleReplacement"
        ],
        chunkGroup: [
            "kind!",
            "name",
            "isOverSizeLimit",
            "assetsSize",
            "auxiliaryAssetsSize",
            "is!",
            "assets",
            "filteredAssets",
            "auxiliaryAssets",
            "filteredAuxiliaryAssets",
            "separator!",
            "children"
        ],
        chunkGroupAsset: [
            "name",
            "size"
        ],
        chunkGroupChildGroup: [
            "type",
            "children"
        ],
        chunkGroupChild: [
            "assets",
            "chunks",
            "name"
        ],
        module: [
            "type",
            "name",
            "identifier",
            "id",
            "layer",
            "sizes",
            "chunks",
            "depth",
            "cacheable",
            "orphan",
            "runtime",
            "optional",
            "dependent",
            "built",
            "codeGenerated",
            "cached",
            "assets",
            "failed",
            "warnings",
            "errors",
            "children",
            "filteredChildren",
            "providedExports",
            "usedExports",
            "optimizationBailout",
            "reasons",
            "filteredReasons",
            "issuerPath",
            "profile",
            "modules",
            "filteredModules"
        ],
        moduleReason: [
            "active",
            "type",
            "userRequest",
            "moduleId",
            "module",
            "resolvedModule",
            "loc",
            "explanation",
            "children",
            "filteredChildren"
        ],
        "module.profile": [
            "total",
            "separator!",
            "resolving",
            "restoring",
            "integration",
            "building",
            "storing",
            "additionalResolving",
            "additionalIntegration"
        ],
        chunk: [
            "id",
            "runtime",
            "files",
            "names",
            "idHints",
            "sizes",
            "parents",
            "siblings",
            "children",
            "childrenByOrder",
            "entry",
            "initial",
            "rendered",
            "recorded",
            "reason",
            "separator!",
            "origins",
            "separator!",
            "modules",
            "separator!",
            "filteredModules"
        ],
        chunkOrigin: [
            "request",
            "moduleId",
            "moduleName",
            "loc"
        ],
        error: ERROR_PREFERRED_ORDER,
        warning: ERROR_PREFERRED_ORDER,
        "chunk.childrenByOrder[]": [
            "type",
            "children"
        ],
        loggingGroup: [
            "debug",
            "name",
            "separator!",
            "entries",
            "separator!",
            "filteredEntries"
        ],
        loggingEntry: [
            "message",
            "trace",
            "children"
        ]
    }, itemsJoinOneLine = (items)=>items.filter(Boolean).join(" "), itemsJoinOneLineBrackets = (items)=>items.length > 0 ? `(${items.filter(Boolean).join(" ")})` : void 0, itemsJoinMoreSpacing = (items)=>items.filter(Boolean).join("\n\n"), itemsJoinComma = (items)=>items.filter(Boolean).join(", "), itemsJoinCommaBrackets = (items)=>items.length > 0 ? `(${items.filter(Boolean).join(", ")})` : void 0, itemsJoinCommaBracketsWithName = (name)=>(items)=>items.length > 0 ? `(${name}: ${items.filter(Boolean).join(", ")})` : void 0, SIMPLE_ITEMS_JOINER = {
        "chunk.parents": itemsJoinOneLine,
        "chunk.siblings": itemsJoinOneLine,
        "chunk.children": itemsJoinOneLine,
        "chunk.names": itemsJoinCommaBrackets,
        "chunk.idHints": itemsJoinCommaBracketsWithName("id hint"),
        "chunk.runtime": itemsJoinCommaBracketsWithName("runtime"),
        "chunk.files": itemsJoinComma,
        "chunk.childrenByOrder": itemsJoinOneLine,
        "chunk.childrenByOrder[].children": itemsJoinOneLine,
        "chunkGroup.assets": itemsJoinOneLine,
        "chunkGroup.auxiliaryAssets": itemsJoinOneLineBrackets,
        "chunkGroupChildGroup.children": itemsJoinComma,
        "chunkGroupChild.assets": itemsJoinOneLine,
        "chunkGroupChild.auxiliaryAssets": itemsJoinOneLineBrackets,
        "asset.chunks": itemsJoinComma,
        "asset.auxiliaryChunks": itemsJoinCommaBrackets,
        "asset.chunkNames": itemsJoinCommaBracketsWithName("name"),
        "asset.auxiliaryChunkNames": itemsJoinCommaBracketsWithName("auxiliary name"),
        "asset.chunkIdHints": itemsJoinCommaBracketsWithName("id hint"),
        "asset.auxiliaryChunkIdHints": itemsJoinCommaBracketsWithName("auxiliary id hint"),
        "module.chunks": itemsJoinOneLine,
        "module.issuerPath": (items)=>items.filter(Boolean).map((item)=>`${item} ->`).join(" "),
        "compilation.errors": itemsJoinMoreSpacing,
        "compilation.warnings": itemsJoinMoreSpacing,
        "compilation.logging": itemsJoinMoreSpacing,
        "compilation.children": (items)=>DefaultStatsPrinterPlugin_indent(itemsJoinMoreSpacing(items), "  "),
        "moduleTraceItem.dependencies": itemsJoinOneLine,
        "loggingEntry.children": (items)=>DefaultStatsPrinterPlugin_indent(items.filter(Boolean).join("\n"), "  ", !1)
    }, joinOneLine = (items)=>items.map((item)=>item.content).filter(Boolean).join(" "), DefaultStatsPrinterPlugin_indent = (str, prefix, noPrefixInFirstLine)=>{
        let rem = str.replace(/\n([^\n])/g, `\n${prefix}$1`);
        return noPrefixInFirstLine ? rem : ("\n" === str[0] ? "" : prefix) + rem;
    }, joinExplicitNewLine = (items, indenter)=>{
        let firstInLine = !0, first = !0;
        return items.map((item)=>{
            if (!item || !item.content) return;
            let content = DefaultStatsPrinterPlugin_indent(item.content, first ? "" : indenter, !firstInLine);
            if (firstInLine && (content = content.replace(/^\n+/, "")), !content) return;
            first = !1;
            let noJoiner = firstInLine || content.startsWith("\n");
            return firstInLine = content.endsWith("\n"), noJoiner ? content : ` ${content}`;
        }).filter(Boolean).join("").trim();
    }, joinError = (error)=>(items, { red, yellow })=>`${error ? red("ERROR") : yellow("WARNING")} in ${joinExplicitNewLine(items, "")}`, SIMPLE_ELEMENT_JOINERS = {
        compilation: (items)=>{
            let result = [], lastNeedMore = !1;
            for (let item of items){
                if (!item.content) continue;
                let needMoreSpace = [
                    "warnings",
                    "filteredWarningDetailsCount",
                    "errors",
                    "filteredErrorDetailsCount",
                    "logging"
                ].includes(item.element);
                0 !== result.length && result.push(needMoreSpace || lastNeedMore ? "\n\n" : "\n"), result.push(item.content), lastNeedMore = needMoreSpace;
            }
            return lastNeedMore && result.push("\n"), result.join("");
        },
        asset: (items)=>joinExplicitNewLine(items.map((item)=>("related" === item.element || "children" === item.element) && item.content ? {
                    ...item,
                    content: `\n${item.content}\n`
                } : item), "  "),
        "asset.info": joinOneLine,
        module: (items, { module: module1 })=>{
            let hasName = !1;
            return joinExplicitNewLine(items.map((item)=>{
                switch(item.element){
                    case "id":
                        if (module1 && module1.id === module1.name) {
                            if (hasName) return !1;
                            item.content && (hasName = !0);
                        }
                        break;
                    case "name":
                        if (hasName) return !1;
                        item.content && (hasName = !0);
                        break;
                    case "providedExports":
                    case "usedExports":
                    case "optimizationBailout":
                    case "reasons":
                    case "issuerPath":
                    case "profile":
                    case "children":
                    case "modules":
                        if (item.content) return {
                            ...item,
                            content: `\n${item.content}\n`
                        };
                }
                return item;
            }), "  ");
        },
        chunk: (items)=>{
            let hasEntry = !1;
            return `chunk ${joinExplicitNewLine(items.filter((item)=>{
                switch(item.element){
                    case "entry":
                        item.content && (hasEntry = !0);
                        break;
                    case "initial":
                        if (hasEntry) return !1;
                }
                return !0;
            }), "  ")}`;
        },
        "chunk.childrenByOrder[]": (items)=>`(${joinOneLine(items)})`,
        chunkGroup: (items)=>joinExplicitNewLine(items, "  "),
        chunkGroupAsset: joinOneLine,
        chunkGroupChildGroup: joinOneLine,
        chunkGroupChild: joinOneLine,
        moduleReason: (items, { moduleReason })=>{
            let hasName = !1;
            return joinExplicitNewLine(items.map((item)=>{
                switch(item.element){
                    case "moduleId":
                        moduleReason && moduleReason.moduleId === moduleReason.module && item.content && (hasName = !0);
                        break;
                    case "module":
                        if (hasName) return !1;
                        break;
                    case "resolvedModule":
                        if (moduleReason && moduleReason.module === moduleReason.resolvedModule) return !1;
                        break;
                    case "children":
                        if (item.content) return {
                            ...item,
                            content: `\n${item.content}\n`
                        };
                }
                return item;
            }), "  ");
        },
        "module.profile": (items)=>{
            let res = [], mode = 0;
            for (let item of items){
                if ("separator!" === item.element) switch(mode){
                    case 0:
                    case 1:
                        mode += 2;
                        break;
                    case 4:
                        res.push(")"), mode = 3;
                }
                if (item.content) {
                    switch(mode){
                        case 0:
                            mode = 1;
                            break;
                        case 1:
                            res.push(" ");
                            break;
                        case 2:
                            res.push("("), mode = 4;
                            break;
                        case 3:
                            res.push(" ("), mode = 4;
                            break;
                        case 4:
                            res.push(", ");
                    }
                    res.push(item.content);
                }
            }
            return 4 === mode && res.push(")"), res.join("");
        },
        moduleIssuer: joinOneLine,
        chunkOrigin: (items)=>`> ${joinOneLine(items)}`,
        "errors[].error": joinError(!0),
        "warnings[].error": joinError(!1),
        loggingGroup: (items)=>joinExplicitNewLine(items, "").trimEnd(),
        moduleTraceItem: (items)=>` @ ${joinOneLine(items)}`,
        moduleTraceDependency: joinOneLine
    }, AVAILABLE_COLORS = {
        bold: "\u001b[1m",
        yellow: "\u001b[1m\u001b[33m",
        red: "\u001b[1m\u001b[31m",
        green: "\u001b[1m\u001b[32m",
        cyan: "\u001b[1m\u001b[36m",
        magenta: "\u001b[1m\u001b[35m"
    }, AVAILABLE_FORMATS = {
        formatChunkId: (id, { yellow }, direction)=>{
            switch(direction){
                case "parent":
                    return `<{${yellow(id)}}>`;
                case "sibling":
                    return `={${yellow(id)}}=`;
                case "child":
                    return `>{${yellow(id)}}<`;
                default:
                    return `{${yellow(id)}}`;
            }
        },
        formatModuleId: (id)=>`[${id}]`,
        formatFilename: (filename, { green, yellow }, oversize)=>(oversize ? yellow : green)(filename),
        formatFlag: (flag)=>`[${flag}]`,
        formatLayer: (layer)=>`(in ${layer})`,
        formatSize: (size)=>{
            if ("number" != typeof size || Number.isNaN(size)) return "unknown size";
            if (size <= 0) return "0 bytes";
            let index = Math.floor(Math.log(size) / Math.log(1024));
            return `${+(size / 1024 ** index).toPrecision(3)} ${[
                "bytes",
                "KiB",
                "MiB",
                "GiB"
            ][index]}`;
        },
        formatDateTime: (dateTime, { bold })=>{
            let d = new Date(dateTime), date = `${d.getFullYear()}-${twoDigit(d.getMonth() + 1)}-${twoDigit(d.getDate())}`, time = `${twoDigit(d.getHours())}:${twoDigit(d.getMinutes())}:${twoDigit(d.getSeconds())}`;
            return `${date} ${bold(time)}`;
        },
        formatTime: (time, { timeReference, bold, green, yellow, red }, boldQuantity)=>{
            let unit = " ms";
            if (timeReference && time !== timeReference) {
                let times = [
                    timeReference / 2,
                    timeReference / 4,
                    timeReference / 8,
                    timeReference / 16
                ];
                return time < times[3] ? `${time}${unit}` : time < times[2] ? bold(`${time}${unit}`) : time < times[1] ? green(`${time}${unit}`) : time < times[0] ? yellow(`${time}${unit}`) : red(`${time}${unit}`);
            }
            let timeStr = time.toString();
            return time > 1000 && (timeStr = (time / 1000).toFixed(2), unit = " s"), `${boldQuantity ? bold(timeStr) : timeStr}${unit}`;
        },
        formatError: (msg, { green, yellow, red })=>{
            let message = msg;
            if (message.includes("\u001b[")) return message;
            for (let { regExp, format } of [
                {
                    regExp: /(Did you mean .+)/g,
                    format: green
                },
                {
                    regExp: /(\(module has no exports\))/g,
                    format: red
                },
                {
                    regExp: /\(possible exports: (.+)\)/g,
                    format: green
                },
                {
                    regExp: /(?:^|\n)(.* doesn't exist)/g,
                    format: red
                },
                {
                    regExp: /(Emitted value instead of an instance of Error)/g,
                    format: yellow
                },
                {
                    regExp: /(Used? .+ instead)/gi,
                    format: yellow
                },
                {
                    regExp: /\b(deprecated|must|required)\b/g,
                    format: yellow
                },
                {
                    regExp: /\b(BREAKING CHANGE)\b/gi,
                    format: red
                },
                {
                    regExp: /\b(error|failed|unexpected|invalid|not found|not supported|not available|not possible|not implemented|doesn't support|conflict|conflicting|not existing|duplicate)\b/gi,
                    format: red
                }
            ])message = message.replace(regExp, (match, content)=>match.replace(content, format(content)));
            return message;
        }
    }, RESULT_MODIFIER = {
        "module.modules": (result)=>DefaultStatsPrinterPlugin_indent(result, "| ")
    }, createOrder = (array, preferredOrder)=>{
        let originalArray = array.slice(), set = new Set(array), usedSet = new Set();
        for (let element of (array.length = 0, preferredOrder))(element.endsWith("!") || set.has(element)) && (array.push(element), usedSet.add(element));
        for (let element of originalArray)usedSet.has(element) || array.push(element);
        return array;
    };
    class DefaultStatsPrinterPlugin {
        apply(compiler) {
            compiler.hooks.compilation.tap("DefaultStatsPrinterPlugin", (compilation)=>{
                compilation.hooks.statsPrinter.tap("DefaultStatsPrinterPlugin", (stats, options)=>{
                    for (let key of (stats.hooks.print.for("compilation").tap("DefaultStatsPrinterPlugin", (compilation, context)=>{
                        for (let color of Object.keys(AVAILABLE_COLORS)){
                            let start;
                            options.colors && (start = "object" == typeof options.colors && "string" == typeof options.colors[color] ? options.colors[color] : AVAILABLE_COLORS[color]), start ? context[color] = (str)=>`${start}${"string" == typeof str ? str.replace(/((\u001b\[39m|\u001b\[22m|\u001b\[0m)+)/g, `$1${start}`) : str}\u001b[39m\u001b[22m` : context[color] = (str)=>str;
                        }
                        for (let format of Object.keys(AVAILABLE_FORMATS))context[format] = (content, ...args)=>AVAILABLE_FORMATS[format](content, context, ...args);
                        context.timeReference = compilation.time;
                    }), Object.keys(SIMPLE_PRINTERS)))stats.hooks.print.for(key).tap("DefaultStatsPrinterPlugin", (obj, ctx)=>SIMPLE_PRINTERS[key](obj, ctx, stats));
                    for (let key of Object.keys(PREFERRED_ORDERS)){
                        let preferredOrder = PREFERRED_ORDERS[key];
                        stats.hooks.sortElements.for(key).tap("DefaultStatsPrinterPlugin", (elements)=>{
                            createOrder(elements, preferredOrder);
                        });
                    }
                    for (let key of Object.keys(DefaultStatsPrinterPlugin_ITEM_NAMES)){
                        let itemName = DefaultStatsPrinterPlugin_ITEM_NAMES[key];
                        stats.hooks.getItemName.for(key).tap("DefaultStatsPrinterPlugin", "string" == typeof itemName ? ()=>itemName : itemName);
                    }
                    for (let key of Object.keys(SIMPLE_ITEMS_JOINER)){
                        let joiner = SIMPLE_ITEMS_JOINER[key];
                        stats.hooks.printItems.for(key).tap("DefaultStatsPrinterPlugin", joiner);
                    }
                    for (let key of Object.keys(SIMPLE_ELEMENT_JOINERS)){
                        let joiner = SIMPLE_ELEMENT_JOINERS[key];
                        stats.hooks.printElements.for(key).tap("DefaultStatsPrinterPlugin", joiner);
                    }
                    for (let key of Object.keys(RESULT_MODIFIER)){
                        let modifier = RESULT_MODIFIER[key];
                        stats.hooks.result.for(key).tap("DefaultStatsPrinterPlugin", modifier);
                    }
                });
            });
        }
    }
    class RspackOptionsApply {
        process(options, compiler) {
            if (!options.output.path) throw Error("options.output.path should have a value after `applyRspackOptionsDefaults`");
            if (compiler.outputPath = options.output.path, compiler.name = options.name, compiler.outputFileSystem = external_node_fs_default(), options.externals) {
                if (!options.externalsType) throw Error("options.externalsType should have a value after `applyRspackOptionsDefaults`");
                new ExternalsPlugin(options.externalsType, options.externals, !1).apply(compiler);
            }
            if (options.externalsPresets.node && new NodeTargetPlugin().apply(compiler), options.externalsPresets.electronMain && new ElectronTargetPlugin("main").apply(compiler), options.externalsPresets.electronPreload && new ElectronTargetPlugin("preload").apply(compiler), options.externalsPresets.electronRenderer && new ElectronTargetPlugin("renderer").apply(compiler), !options.externalsPresets.electron || options.externalsPresets.electronMain || options.externalsPresets.electronPreload || options.externalsPresets.electronRenderer || new ElectronTargetPlugin().apply(compiler), options.externalsPresets.nwjs && new ExternalsPlugin("node-commonjs", "nw.gui", !1).apply(compiler), (options.externalsPresets.web || options.externalsPresets.webAsync || options.externalsPresets.node && options.experiments.css) && new HttpExternalsRspackPlugin(!!options.experiments.css, !!options.externalsPresets.webAsync).apply(compiler), new ChunkPrefetchPreloadPlugin().apply(compiler), options.output.pathinfo && new ModuleInfoHeaderPlugin("verbose" === options.output.pathinfo).apply(compiler), "string" == typeof options.output.chunkFormat) switch(options.output.chunkFormat){
                case "array-push":
                    new ArrayPushCallbackChunkFormatPlugin().apply(compiler);
                    break;
                case "commonjs":
                    new CommonJsChunkFormatPlugin().apply(compiler);
                    break;
                case "module":
                    new ModuleChunkFormatPlugin().apply(compiler);
                    break;
                default:
                    throw Error(`Unsupported chunk format '${options.output.chunkFormat}'.`);
            }
            if (options.output.enabledChunkLoadingTypes && options.output.enabledChunkLoadingTypes.length > 0) for (let type of options.output.enabledChunkLoadingTypes)new EnableChunkLoadingPlugin(type).apply(compiler);
            if (options.output.enabledWasmLoadingTypes && options.output.enabledWasmLoadingTypes.length > 0) for (let type of options.output.enabledWasmLoadingTypes)new EnableWasmLoadingPlugin(type).apply(compiler);
            let runtimeChunk = options.optimization.runtimeChunk;
            if (runtimeChunk && new RuntimeChunkPlugin(runtimeChunk).apply(compiler), options.optimization.emitOnErrors || new NoEmitOnErrorsPlugin().apply(compiler), options.devtool) if (options.devtool.includes("source-map")) {
                let hidden = options.devtool.includes("hidden"), inline = options.devtool.includes("inline"), evalWrapped = options.devtool.includes("eval"), cheap = options.devtool.includes("cheap"), moduleMaps = options.devtool.includes("module"), noSources = options.devtool.includes("nosources"), debugIds = options.devtool.includes("debugids");
                new (evalWrapped ? EvalSourceMapDevToolPlugin : SourceMapDevToolPlugin)({
                    filename: inline ? null : options.output.sourceMapFilename,
                    moduleFilenameTemplate: options.output.devtoolModuleFilenameTemplate,
                    fallbackModuleFilenameTemplate: options.output.devtoolFallbackModuleFilenameTemplate,
                    append: !hidden && void 0,
                    module: !!moduleMaps || !cheap,
                    columns: !cheap,
                    noSources: noSources,
                    namespace: options.output.devtoolNamespace,
                    debugIds: debugIds
                }).apply(compiler);
            } else options.devtool.includes("eval") && new EvalDevToolModulePlugin({
                moduleFilenameTemplate: options.output.devtoolModuleFilenameTemplate,
                namespace: options.output.devtoolNamespace
            }).apply(compiler);
            if (new JavascriptModulesPlugin().apply(compiler), new URLPlugin().apply(compiler), new JsonModulesPlugin().apply(compiler), new AssetModulesPlugin().apply(compiler), options.experiments.asyncWebAssembly && new AsyncWebAssemblyModulesPlugin().apply(compiler), options.experiments.css && new CssModulesPlugin().apply(compiler), new lib_EntryOptionPlugin().apply(compiler), assertNotNill(options.context), compiler.hooks.entryOption.call(options.context, options.entry), new RuntimePlugin().apply(compiler), options.experiments.rspackFuture.bundlerInfo && new BundlerInfoRspackPlugin(options.experiments.rspackFuture.bundlerInfo).apply(compiler), new InferAsyncModulesPlugin().apply(compiler), new APIPlugin().apply(compiler), new DataUriPlugin().apply(compiler), new FileUriPlugin().apply(compiler), options.experiments.buildHttp && new HttpUriPlugin(options.experiments.buildHttp).apply(compiler), new EnsureChunkConditionsPlugin().apply(compiler), options.optimization.mergeDuplicateChunks && new MergeDuplicateChunksPlugin().apply(compiler), options.optimization.sideEffects && new SideEffectsFlagPlugin().apply(compiler), options.optimization.providedExports && new FlagDependencyExportsPlugin().apply(compiler), options.optimization.usedExports && new FlagDependencyUsagePlugin("global" === options.optimization.usedExports).apply(compiler), options.optimization.concatenateModules && new ModuleConcatenationPlugin().apply(compiler), (options.experiments.inlineConst || options.experiments.inlineEnum) && new InlineExportsPlugin().apply(compiler), options.optimization.mangleExports && new MangleExportsPlugin("size" !== options.optimization.mangleExports).apply(compiler), options.output.enabledLibraryTypes && options.output.enabledLibraryTypes.length > 0) for (let type of options.output.enabledLibraryTypes)new EnableLibraryPlugin(type).apply(compiler);
            options.optimization.splitChunks && new SplitChunksPlugin(options.optimization.splitChunks).apply(compiler), options.optimization.removeEmptyChunks && new RemoveEmptyChunksPlugin().apply(compiler), options.optimization.realContentHash && new RealContentHashPlugin().apply(compiler);
            let moduleIds = options.optimization.moduleIds;
            if (moduleIds) switch(moduleIds){
                case "named":
                    new NamedModuleIdsPlugin().apply(compiler);
                    break;
                case "natural":
                    new NaturalModuleIdsPlugin().apply(compiler);
                    break;
                case "deterministic":
                    new DeterministicModuleIdsPlugin().apply(compiler);
                    break;
                default:
                    throw Error(`moduleIds: ${moduleIds} is not implemented`);
            }
            let chunkIds = options.optimization.chunkIds;
            if (chunkIds) switch(chunkIds){
                case "natural":
                    new NaturalChunkIdsPlugin().apply(compiler);
                    break;
                case "named":
                    new NamedChunkIdsPlugin().apply(compiler);
                    break;
                case "deterministic":
                    new DeterministicChunkIdsPlugin().apply(compiler);
                    break;
                case "size":
                    new OccurrenceChunkIdsPlugin({
                        prioritiseInitial: !0
                    }).apply(compiler);
                    break;
                case "total-size":
                    new OccurrenceChunkIdsPlugin({
                        prioritiseInitial: !1
                    }).apply(compiler);
                    break;
                default:
                    throw Error(`chunkIds: ${chunkIds} is not implemented`);
            }
            options.optimization.nodeEnv && new DefinePlugin({
                "process.env.NODE_ENV": JSON.stringify(options.optimization.nodeEnv)
            }).apply(compiler);
            let { minimize, minimizer } = options.optimization;
            if (minimize && minimizer) for (let item of minimizer)"function" == typeof item ? item.call(compiler, compiler) : "..." !== item && item && item.apply(compiler);
            if (options.performance && new SizeLimitsPlugin(options.performance).apply(compiler), options.cache && new MemoryCachePlugin().apply(compiler), new WorkerPlugin(options.output.workerChunkLoading, options.output.workerWasmLoading, options.output.module, options.output.workerPublicPath).apply(compiler), new DefaultStatsFactoryPlugin().apply(compiler), new DefaultStatsPresetPlugin().apply(compiler), new DefaultStatsPrinterPlugin().apply(compiler), options.ignoreWarnings && options.ignoreWarnings.length > 0 && new lib_IgnoreWarningsPlugin(options.ignoreWarnings).apply(compiler), compiler.hooks.afterPlugins.call(compiler), !compiler.inputFileSystem) throw Error("No input filesystem provided");
            compiler.hooks.afterResolvers.call(compiler);
        }
    }
    Object.defineProperty(binding_default().ConcatenatedModule.prototype, "identifier", {
        enumerable: !0,
        configurable: !0,
        value () {
            return this[binding_default().MODULE_IDENTIFIER_SYMBOL];
        }
    }), Object.defineProperty(binding_default().ConcatenatedModule.prototype, "originalSource", {
        enumerable: !0,
        configurable: !0,
        value () {
            let originalSource = this._originalSource();
            return originalSource ? SourceAdapter.fromBinding(originalSource) : null;
        }
    }), Object.defineProperty(binding_default().ConcatenatedModule.prototype, "emitFile", {
        enumerable: !0,
        configurable: !0,
        value (filename, source, assetInfo) {
            return this._emitFile(filename, SourceAdapter.toBinding(source), assetInfo);
        }
    }), Object.defineProperty(binding_default().ContextModule.prototype, "identifier", {
        enumerable: !0,
        configurable: !0,
        value () {
            return this[binding_default().MODULE_IDENTIFIER_SYMBOL];
        }
    }), Object.defineProperty(binding_default().ContextModule.prototype, "originalSource", {
        enumerable: !0,
        configurable: !0,
        value () {
            let originalSource = this._originalSource();
            return originalSource ? SourceAdapter.fromBinding(originalSource) : null;
        }
    }), Object.defineProperty(binding_default().ContextModule.prototype, "emitFile", {
        enumerable: !0,
        configurable: !0,
        value (filename, source, assetInfo) {
            return this._emitFile(filename, SourceAdapter.toBinding(source), assetInfo);
        }
    }), Object.defineProperty(binding_default().ExternalModule.prototype, "identifier", {
        enumerable: !0,
        configurable: !0,
        value () {
            return this[binding_default().MODULE_IDENTIFIER_SYMBOL];
        }
    }), Object.defineProperty(binding_default().ExternalModule.prototype, "originalSource", {
        enumerable: !0,
        configurable: !0,
        value () {
            let originalSource = this._originalSource();
            return originalSource ? SourceAdapter.fromBinding(originalSource) : null;
        }
    }), Object.defineProperty(binding_default().ExternalModule.prototype, "emitFile", {
        enumerable: !0,
        configurable: !0,
        value (filename, source, assetInfo) {
            return this._emitFile(filename, SourceAdapter.toBinding(source), assetInfo);
        }
    });
    let asRegExp = (test)=>"string" == typeof test ? RegExp(`^${test.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}`) : test, matchPart = (str, test)=>!test || (Array.isArray(test) ? test.map(asRegExp).some((regExp)=>regExp.test(str)) : asRegExp(test).test(str)), matchObject = (obj, str)=>!(obj.test && !matchPart(str, obj.test) || obj.include && !matchPart(str, obj.include) || obj.exclude && matchPart(str, obj.exclude)), FlagAllModulesAsUsedPlugin = base_create(binding_.BuiltinPluginName.FlagAllModulesAsUsedPlugin, (explanation)=>({
            explanation
        }));
    class DllPlugin {
        options;
        constructor(options){
            this.options = {
                ...options,
                entryOnly: !1 !== options.entryOnly
            };
        }
        apply(compiler) {
            compiler.hooks.entryOption.tap(DllPlugin.name, (context, entry)=>{
                if ("function" == typeof entry) throw Error("DllPlugin doesn't support dynamic entry (function) yet");
                for (let name of Object.keys(entry)){
                    let options = {
                        name
                    };
                    new DllEntryPlugin(context, entry[name].import || [], options).apply(compiler);
                }
                return !0;
            }), new LibManifestPlugin(this.options).apply(compiler), this.options.entryOnly || new FlagAllModulesAsUsedPlugin("DllPlugin").apply(compiler);
        }
    }
    class DllReferencePlugin {
        options;
        errors;
        constructor(options){
            this.options = options, this.errors = new WeakMap();
        }
        apply(compiler) {
            compiler.hooks.beforeCompile.tapPromise(DllReferencePlugin.name, async (params)=>{
                let manifest = await new Promise((resolve, reject)=>{
                    if ("manifest" in this.options) {
                        let manifest = this.options.manifest;
                        "string" == typeof manifest ? compiler.inputFileSystem?.readFile(manifest, "utf8", (err, result)=>{
                            if (err) return reject(err);
                            if (!result) return reject(new DllManifestError(manifest, `Can't read anything from ${manifest}`));
                            try {
                                let manifest = JSON.parse(result);
                                resolve(manifest);
                            } catch (parseError) {
                                let manifestPath = makePathsRelative(compiler.context, manifest, compiler.root);
                                this.errors.set(params, new DllManifestError(manifestPath, parseError.message));
                            }
                        }) : resolve(manifest);
                    } else resolve(void 0);
                });
                this.errors.has(params) || new DllReferenceAgencyPlugin({
                    ...this.options,
                    type: this.options.type || "require",
                    extensions: this.options.extensions || [
                        "",
                        ".js",
                        ".json",
                        ".wasm"
                    ],
                    manifest
                }).apply(compiler);
            }), compiler.hooks.compilation.tap(DllReferencePlugin.name, (compilation, params)=>{
                if ("manifest" in this.options && "string" == typeof this.options.manifest) {
                    let error = this.errors.get(params);
                    error && compilation.errors.push(error), compilation.fileDependencies.add(this.options.manifest);
                }
            });
        }
    }
    class DllManifestError extends lib_WebpackError {
        constructor(filename, message){
            super(), this.name = "DllManifestError", this.message = `Dll manifest ${filename}\n${message}`;
        }
    }
    class EnvironmentPlugin {
        keys;
        defaultValues;
        constructor(...keys){
            1 === keys.length && Array.isArray(keys[0]) ? (this.keys = keys[0], this.defaultValues = {}) : 1 === keys.length && keys[0] && "object" == typeof keys[0] ? (this.keys = Object.keys(keys[0]), this.defaultValues = keys[0]) : (this.keys = keys, this.defaultValues = {});
        }
        apply(compiler) {
            let definitions = {};
            for (let key of this.keys){
                let value = void 0 !== process.env[key] ? process.env[key] : this.defaultValues[key];
                void 0 === value && compiler.hooks.thisCompilation.tap("EnvironmentPlugin", (compilation)=>{
                    let error = new lib_WebpackError(`EnvironmentPlugin - ${key} environment variable is undefined.\n\nYou can pass an object with default values to suppress this warning.\nSee https://rspack.rs/plugins/webpack/environment-plugin for example.`);
                    error.name = "EnvVariableNotDefinedError", compilation.errors.push(error);
                }), definitions[`process.env.${key}`] = void 0 === value ? "undefined" : JSON.stringify(value);
            }
            new DefinePlugin(definitions).apply(compiler);
        }
    }
    class LoaderOptionsPlugin {
        options;
        constructor(options = {}){
            options.test || (options.test = {
                test: ()=>!0
            }), this.options = options;
        }
        apply(compiler) {
            let options = this.options;
            compiler.hooks.compilation.tap("LoaderOptionsPlugin", (compilation)=>{
                binding_.NormalModule.getCompilationHooks(compilation).loader.tap("LoaderOptionsPlugin", (context)=>{
                    let resource = context.resourcePath;
                    if (resource && matchObject(options, resource)) for (let key of Object.keys(options))"include" !== key && "exclude" !== key && "test" !== key && (context[key] = options[key]);
                });
            });
        }
    }
    class LoaderTargetPlugin {
        target;
        constructor(target){
            this.target = target;
        }
        apply(compiler) {
            compiler.hooks.compilation.tap("LoaderTargetPlugin", (compilation)=>{
                binding_.NormalModule.getCompilationHooks(compilation).loader.tap("LoaderTargetPlugin", (loaderContext)=>{
                    loaderContext.target = this.target;
                });
            });
        }
    }
    var CachedInputFileSystem = __webpack_require__("../../node_modules/.pnpm/enhanced-resolve@5.18.3/node_modules/enhanced-resolve/lib/CachedInputFileSystem.js"), CachedInputFileSystem_default = __webpack_require__.n(CachedInputFileSystem);
    let filterToFunction = (item)=>{
        if ("string" == typeof item) {
            let regExp = RegExp(`[\\\\/]${item.replace(/[-[\]{}()*+?.\\^$|]/g, "\\$&")}([\\\\/]|$|!|\\?)`);
            return (ident)=>regExp.test(ident);
        }
        return item && "object" == typeof item && "function" == typeof item.test ? (ident)=>item.test(ident) : "function" == typeof item ? item : "boolean" == typeof item ? ()=>item : void 0;
    }, LogLevel = {
        none: 6,
        false: 6,
        error: 5,
        warn: 4,
        info: 3,
        log: 2,
        true: 2,
        verbose: 1
    };
    class NodeWatchFileSystem {
        inputFileSystem;
        watcherOptions;
        watcher;
        constructor(inputFileSystem){
            this.inputFileSystem = inputFileSystem, this.watcherOptions = {
                aggregateTimeout: 0
            };
        }
        watch(files, directories, missing, startTime, options, callback, callbackUndelayed) {
            if (!files || "function" != typeof files[Symbol.iterator]) throw Error("Invalid arguments: 'files'");
            if (!directories || "function" != typeof directories[Symbol.iterator]) throw Error("Invalid arguments: 'directories'");
            if (!missing || "function" != typeof missing[Symbol.iterator]) throw Error("Invalid arguments: 'missing'");
            if ("function" != typeof callback) throw Error("Invalid arguments: 'callback'");
            if ("number" != typeof startTime && startTime) throw Error("Invalid arguments: 'startTime'");
            if ("object" != typeof options) throw Error("Invalid arguments: 'options'");
            if ("function" != typeof callbackUndelayed && callbackUndelayed) throw Error("Invalid arguments: 'callbackUndelayed'");
            let oldWatcher = this.watcher, Watchpack = __webpack_require__("watchpack");
            this.watcher = new Watchpack(options), callbackUndelayed && this.watcher?.once("change", callbackUndelayed);
            let fetchTimeInfo = ()=>{
                let fileTimeInfoEntries = new Map(), contextTimeInfoEntries = new Map();
                return this.watcher?.collectTimeInfoEntries(fileTimeInfoEntries, contextTimeInfoEntries), {
                    fileTimeInfoEntries,
                    contextTimeInfoEntries
                };
            };
            return this.watcher?.once("aggregated", (changes, removals)=>{
                if (this.watcher?.pause(), this.inputFileSystem?.purge) {
                    let fs = this.inputFileSystem;
                    for (let item of changes)fs.purge?.(item);
                    for (let item of removals)fs.purge?.(item);
                }
                let { fileTimeInfoEntries, contextTimeInfoEntries } = fetchTimeInfo();
                callback(null, fileTimeInfoEntries, contextTimeInfoEntries, changes, removals);
            }), this.watcher?.watch({
                files,
                directories,
                missing,
                startTime
            }), oldWatcher && oldWatcher.close(), {
                close: ()=>{
                    this.watcher && (this.watcher.close(), this.watcher = null);
                },
                pause: ()=>{
                    this.watcher && this.watcher.pause();
                },
                getAggregatedRemovals: external_node_util_default().deprecate(()=>{
                    let items = this.watcher?.aggregatedRemovals;
                    if (items && this.inputFileSystem?.purge) {
                        let fs = this.inputFileSystem;
                        for (let item of items)fs.purge?.(item);
                    }
                    return items ?? new Set();
                }, "Watcher.getAggregatedRemovals is deprecated in favor of Watcher.getInfo since that's more performant.", "DEP_WEBPACK_WATCHER_GET_AGGREGATED_REMOVALS"),
                getAggregatedChanges: external_node_util_default().deprecate(()=>{
                    let items = this.watcher?.aggregatedChanges;
                    if (items && this.inputFileSystem?.purge) {
                        let fs = this.inputFileSystem;
                        for (let item of items)fs.purge?.(item);
                    }
                    return items ?? new Set();
                }, "Watcher.getAggregatedChanges is deprecated in favor of Watcher.getInfo since that's more performant.", "DEP_WEBPACK_WATCHER_GET_AGGREGATED_CHANGES"),
                getFileTimeInfoEntries: external_node_util_default().deprecate(()=>fetchTimeInfo().fileTimeInfoEntries, "Watcher.getFileTimeInfoEntries is deprecated in favor of Watcher.getInfo since that's more performant.", "DEP_WEBPACK_WATCHER_FILE_TIME_INFO_ENTRIES"),
                getContextTimeInfoEntries: external_node_util_default().deprecate(()=>fetchTimeInfo().contextTimeInfoEntries, "Watcher.getContextTimeInfoEntries is deprecated in favor of Watcher.getInfo since that's more performant.", "DEP_WEBPACK_WATCHER_CONTEXT_TIME_INFO_ENTRIES"),
                getInfo: ()=>{
                    let removals = this.watcher?.aggregatedRemovals ?? new Set(), changes = this.watcher?.aggregatedChanges ?? new Set();
                    if (this.inputFileSystem?.purge) {
                        let fs = this.inputFileSystem;
                        if (removals) for (let item of removals)fs.purge?.(item);
                        if (changes) for (let item of changes)fs.purge?.(item);
                    }
                    let { fileTimeInfoEntries, contextTimeInfoEntries } = fetchTimeInfo();
                    return {
                        changes,
                        removals,
                        fileTimeInfoEntries,
                        contextTimeInfoEntries
                    };
                }
            };
        }
    }
    let arraySum = (array)=>{
        let sum = 0;
        for (let item of array)sum += item;
        return sum;
    }, truncateArgs = (args, maxLength)=>{
        let lengths = args.map((a)=>`${a}`.length), availableLength = maxLength - lengths.length + 1;
        if (availableLength > 0 && 1 === args.length) return availableLength >= args[0].length ? args : availableLength > 3 ? [
            `...${args[0].slice(-availableLength + 3)}`
        ] : [
            args[0].slice(-availableLength)
        ];
        if (availableLength < arraySum(lengths.map((i)=>Math.min(i, 6)))) return args.length > 1 ? truncateArgs(args.slice(0, args.length - 1), maxLength) : [];
        let currentLength = arraySum(lengths);
        if (currentLength <= availableLength) return args;
        for(; currentLength > availableLength;){
            let maxLength = Math.max(...lengths), shorterItems = lengths.filter((l)=>l !== maxLength), maxReduce = maxLength - (shorterItems.length > 0 ? Math.max(...shorterItems) : 0), maxItems = lengths.length - shorterItems.length, overrun = currentLength - availableLength;
            for(let i = 0; i < lengths.length; i++)if (lengths[i] === maxLength) {
                let reduce = Math.min(Math.floor(overrun / maxItems), maxReduce);
                lengths[i] -= reduce, currentLength -= reduce, overrun -= reduce, maxItems--;
            }
        }
        return args.map((a, i)=>{
            let str = `${a}`, length = lengths[i];
            return str.length === length ? str : length > 5 ? `...${str.slice(-length + 3)}` : length > 0 ? str.slice(-length) : "";
        });
    };
    class NodeEnvironmentPlugin {
        options;
        constructor(options){
            this.options = options;
        }
        apply(compiler) {
            let { infrastructureLogging } = this.options;
            compiler.infrastructureLogger = (({ level = "info", debug = !1, console: console1 })=>{
                let debugFilters = "boolean" == typeof debug ? [
                    ()=>debug
                ] : [].concat(debug).map(filterToFunction), loglevel = LogLevel[`${level}`] || 0;
                return (name, type, args)=>{
                    let labeledArgs = ()=>Array.isArray(args) ? args.length > 0 && "string" == typeof args[0] ? [
                            `[${name}] ${args[0]}`,
                            ...args.slice(1)
                        ] : [
                            `[${name}]`,
                            ...args
                        ] : [], debug = debugFilters.some((f)=>f(name));
                    switch(type){
                        case LogType.debug:
                            if (!debug) return;
                            "function" == typeof console1.debug ? console1.debug(...labeledArgs()) : console1.log(...labeledArgs());
                            break;
                        case LogType.log:
                            if (!debug && loglevel > LogLevel.log) return;
                            console1.log(...labeledArgs());
                            break;
                        case LogType.info:
                            if (!debug && loglevel > LogLevel.info) return;
                            console1.info(...labeledArgs());
                            break;
                        case LogType.warn:
                            if (!debug && loglevel > LogLevel.warn) return;
                            console1.warn(...labeledArgs());
                            break;
                        case LogType.error:
                            if (!debug && loglevel > LogLevel.error) return;
                            console1.error(...labeledArgs());
                            break;
                        case LogType.trace:
                            if (!debug) return;
                            console1.trace();
                            break;
                        case LogType.groupCollapsed:
                            if (!debug && loglevel > LogLevel.log) return;
                            if (!debug && loglevel > LogLevel.verbose) {
                                "function" == typeof console1.groupCollapsed ? console1.groupCollapsed(...labeledArgs()) : console1.log(...labeledArgs());
                                break;
                            }
                        case LogType.group:
                            if (!debug && loglevel > LogLevel.log) return;
                            "function" == typeof console1.group ? console1.group(...labeledArgs()) : console1.log(...labeledArgs());
                            break;
                        case LogType.groupEnd:
                            if (!debug && loglevel > LogLevel.log) return;
                            "function" == typeof console1.groupEnd && console1.groupEnd();
                            break;
                        case LogType.time:
                            {
                                if (!debug && loglevel > LogLevel.log) return;
                                let ms = 1000 * args[1] + args[2] / 1000000, msg = `[${name}] ${args[0]}: ${ms} ms`;
                                "function" == typeof console1.logTime ? console1.logTime(msg) : console1.log(msg);
                                break;
                            }
                        case LogType.profile:
                            "function" == typeof console1.profile && console1.profile(...labeledArgs());
                            break;
                        case LogType.profileEnd:
                            "function" == typeof console1.profileEnd && console1.profileEnd(...labeledArgs());
                            break;
                        case LogType.clear:
                            if (!debug && loglevel > LogLevel.log) return;
                            "function" == typeof console1.clear && console1.clear();
                            break;
                        case LogType.status:
                            if (!debug && loglevel > LogLevel.info) return;
                            "function" == typeof console1.status ? 0 === args.length ? console1.status() : console1.status(...labeledArgs()) : 0 !== args.length && console1.info(...labeledArgs());
                            break;
                        default:
                            throw Error(`Unexpected LogType ${type}`);
                    }
                };
            })({
                level: infrastructureLogging.level || "info",
                debug: infrastructureLogging.debug || !1,
                console: infrastructureLogging.console || function({ colors, appendOnly, stream }) {
                    let currentStatusMessage, hasStatusMessage = !1, currentIndent = "", currentCollapsed = 0, clearStatusMessage = ()=>{
                        hasStatusMessage && (stream.write("\x1b[2K\r"), hasStatusMessage = !1);
                    }, writeStatusMessage = ()=>{
                        if (!currentStatusMessage) return;
                        let l = stream.columns, str = (l ? truncateArgs(currentStatusMessage, l - 1) : currentStatusMessage).join(" "), coloredStr = `\u001b[1m${str}\u001b[39m\u001b[22m`;
                        stream.write(`\x1b[2K\r${coloredStr}`), hasStatusMessage = !0;
                    }, writeColored = (prefix, colorPrefix, colorSuffix)=>(...args)=>{
                            if (currentCollapsed > 0) return;
                            clearStatusMessage();
                            let str = ((str, prefix, colorPrefix, colorSuffix)=>{
                                if ("" === str) return str;
                                let prefixWithIndent = currentIndent + prefix;
                                return colors ? prefixWithIndent + colorPrefix + str.replace(/\n/g, `${colorSuffix}\n${prefix}${colorPrefix}`) + colorSuffix : prefixWithIndent + str.replace(/\n/g, `\n${prefix}`);
                            })(external_node_util_namespaceObject.format(...args), prefix, colorPrefix, colorSuffix);
                            stream.write(`${str}\n`), writeStatusMessage();
                        }, writeGroupMessage = writeColored("<-> ", "\u001b[1m\u001b[36m", "\u001b[39m\u001b[22m"), writeGroupCollapsedMessage = writeColored("<+> ", "\u001b[1m\u001b[36m", "\u001b[39m\u001b[22m");
                    return {
                        log: writeColored("    ", "\u001b[1m", "\u001b[22m"),
                        debug: writeColored("    ", "", ""),
                        trace: writeColored("    ", "", ""),
                        info: writeColored("<i> ", "\u001b[1m\u001b[32m", "\u001b[39m\u001b[22m"),
                        warn: writeColored("<w> ", "\u001b[1m\u001b[33m", "\u001b[39m\u001b[22m"),
                        error: writeColored("<e> ", "\u001b[1m\u001b[31m", "\u001b[39m\u001b[22m"),
                        logTime: writeColored("<t> ", "\u001b[1m\u001b[35m", "\u001b[39m\u001b[22m"),
                        group: (...args)=>{
                            writeGroupMessage(...args), currentCollapsed > 0 ? currentCollapsed++ : currentIndent += "  ";
                        },
                        groupCollapsed: (...args)=>{
                            writeGroupCollapsedMessage(...args), currentCollapsed++;
                        },
                        groupEnd: ()=>{
                            currentCollapsed > 0 ? currentCollapsed-- : currentIndent.length >= 2 && (currentIndent = currentIndent.slice(0, currentIndent.length - 2));
                        },
                        profile: console.profile && ((name)=>console.profile(name)),
                        profileEnd: console.profileEnd && ((name)=>console.profileEnd(name)),
                        clear: !appendOnly && console.clear && (()=>{
                            clearStatusMessage(), console.clear(), writeStatusMessage();
                        }),
                        status: appendOnly ? writeColored("<s> ", "", "") : (name, ...argsWithEmpty)=>{
                            let args = argsWithEmpty.filter(Boolean);
                            void 0 === name && 0 === args.length ? (clearStatusMessage(), currentStatusMessage = void 0) : (currentStatusMessage = "string" == typeof name && name.startsWith("[webpack.Progress] ") ? [
                                name.slice(19),
                                ...args
                            ] : "[webpack.Progress]" === name ? [
                                ...args
                            ] : [
                                name,
                                ...args
                            ], writeStatusMessage());
                        }
                    };
                }({
                    colors: infrastructureLogging.colors,
                    appendOnly: infrastructureLogging.appendOnly,
                    stream: infrastructureLogging.stream
                })
            });
            let inputFileSystem = new (CachedInputFileSystem_default())(external_node_fs_default(), 60000);
            compiler.inputFileSystem = inputFileSystem, compiler.outputFileSystem = external_node_fs_default(), compiler.intermediateFileSystem = null, compiler.options.experiments.nativeWatcher ? compiler.watchFileSystem = new NativeWatchFileSystem(inputFileSystem) : compiler.watchFileSystem = new NodeWatchFileSystem(inputFileSystem), compiler.hooks.beforeRun.tap("NodeEnvironmentPlugin", (compiler)=>{
                compiler.inputFileSystem === inputFileSystem && (compiler.fsStartTime = Date.now(), inputFileSystem.purge?.());
            });
        }
    }
    let VERSION_PATTERN_REGEXP = /^([\d^=v<>~]|[*xX]$)/;
    function isRequiredVersion(str) {
        return VERSION_PATTERN_REGEXP.test(str);
    }
    let MANIFEST_FILE_NAME = "mf-manifest.json", STATS_FILE_NAME = "mf-stats.json", JSON_EXT = ".json";
    function isPlainObject(value) {
        return !!value && "object" == typeof value && !Array.isArray(value);
    }
    class ModuleFederationManifestPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.ModuleFederationManifestPlugin;
        opts;
        constructor(opts){
            super(), this.opts = opts;
        }
        raw(compiler) {
            var isDev;
            let pkg, buildVersion, { fileName, filePath, disableAssetsAnalyze, remoteAliasMap, exposes, shared } = this.opts, { statsFileName, manifestFileName } = function(manifestOptions) {
                var name;
                if (!manifestOptions) return {
                    statsFileName: STATS_FILE_NAME,
                    manifestFileName: MANIFEST_FILE_NAME
                };
                let filePath = "boolean" == typeof manifestOptions ? "" : manifestOptions.filePath || "", fileName = "boolean" == typeof manifestOptions ? "" : manifestOptions.fileName || "", manifestFileName = fileName ? (name = fileName).endsWith(JSON_EXT) ? name : `${name}${JSON_EXT}` : MANIFEST_FILE_NAME, statsFileName = fileName ? manifestFileName.replace(JSON_EXT, `-stats${JSON_EXT}`) : STATS_FILE_NAME;
                return {
                    statsFileName: (0, external_node_path_namespaceObject.join)(filePath, statsFileName),
                    manifestFileName: (0, external_node_path_namespaceObject.join)(filePath, manifestFileName)
                };
            }(this.opts), rawOptions = {
                name: this.opts.name,
                globalName: this.opts.globalName,
                fileName,
                filePath,
                manifestFileName,
                statsFileName,
                disableAssetsAnalyze,
                remoteAliasMap,
                exposes,
                shared,
                buildInfo: (isDev = "development" === compiler.options.mode, pkg = function(root) {
                    let base = root ? (0, external_node_path_namespaceObject.resolve)(root) : process.cwd(), pkgPath = (0, external_node_path_namespaceObject.join)(base, "package.json");
                    try {
                        let content = (0, external_node_fs_namespaceObject.readFileSync)(pkgPath, "utf-8"), parsed = function(input, guard) {
                            try {
                                let parsed = JSON.parse(input);
                                if (guard(parsed)) return parsed;
                            } catch  {}
                        }(content, isPlainObject);
                        if (parsed) {
                            let filtered = {};
                            for (let [key, value] of Object.entries(parsed))"string" == typeof value && (filtered[key] = value);
                            if (Object.keys(filtered).length > 0) return filtered;
                        }
                    } catch  {}
                    return {};
                }(compiler.context || process.cwd()), buildVersion = isDev ? "local" : pkg?.version, {
                    buildVersion: process.env.MF_BUILD_VERSION || buildVersion || "UNKNOWN",
                    buildName: process.env.MF_BUILD_NAME || pkg?.name || "UNKNOWN"
                })
            };
            return createBuiltinPlugin(this.name, rawOptions);
        }
    }
    let ModuleFederationRuntimePlugin = base_create(binding_.BuiltinPluginName.ModuleFederationRuntimePlugin, (options = {})=>options), parseOptions = (options, normalizeSimple, normalizeOptions)=>{
        let items = [];
        var options1 = options, normalizeSimple1 = normalizeSimple, normalizeOptions1 = normalizeOptions, fn = (key, value)=>{
            items.push([
                key,
                value
            ]);
        };
        let object = (obj)=>{
            for (let [key, value] of Object.entries(obj))"string" == typeof value || Array.isArray(value) ? fn(key, normalizeSimple1(value, key)) : fn(key, normalizeOptions1(value, key));
        };
        if (options1) if (Array.isArray(options1)) {
            var items1 = options1;
            for (let item of items1)if ("string" == typeof item) fn(item, normalizeSimple1(item, item));
            else if (item && "object" == typeof item) object(item);
            else throw Error("Unexpected options format");
        } else if ("object" == typeof options1) object(options1);
        else throw Error("Unexpected options format");
        return items;
    };
    function getRemoteInfos(options) {
        if (!options.remotes) return {};
        let remoteType = options.remoteType || (options.library ? options.library.type : "script"), remotes = parseOptions(options.remotes, (item)=>({
                external: Array.isArray(item) ? item : [
                    item
                ],
                shareScope: options.shareScope || "default"
            }), (item)=>({
                external: Array.isArray(item.external) ? item.external : [
                    item.external
                ],
                shareScope: item.shareScope || options.shareScope || "default"
            })), remoteInfos = {};
        for (let [key, config] of remotes)for (let external of config.external){
            let [externalType, externalRequest] = function(external) {
                let result = function(external) {
                    if (/^[a-z0-9-]+ /.test(external)) {
                        let idx = external.indexOf(" ");
                        return [
                            external.slice(0, idx),
                            external.slice(idx + 1)
                        ];
                    }
                    return null;
                }(external);
                return null === result ? [
                    remoteType,
                    external
                ] : result;
            }(external);
            if (remoteInfos[key] ??= [], "script" === externalType) {
                let [url, global] = function(urlAndGlobal) {
                    let index = urlAndGlobal.indexOf("@");
                    return index <= 0 || index === urlAndGlobal.length - 1 ? null : [
                        urlAndGlobal.substring(index + 1),
                        urlAndGlobal.substring(0, index)
                    ];
                }(externalRequest);
                remoteInfos[key].push({
                    alias: key,
                    name: global,
                    entry: url,
                    externalType,
                    shareScope: config.shareScope
                });
            } else remoteInfos[key].push({
                alias: key,
                name: void 0,
                entry: void 0,
                externalType,
                shareScope: config.shareScope
            });
        }
        return remoteInfos;
    }
    let compilerSet = new WeakSet();
    class ShareRuntimePlugin extends RspackBuiltinPlugin {
        enhanced;
        name = binding_.BuiltinPluginName.ShareRuntimePlugin;
        constructor(enhanced = !1){
            super(), this.enhanced = enhanced;
        }
        raw(compiler) {
            var compiler1, compiler2;
            if (compiler1 = compiler, !compilerSet.has(compiler1)) return compiler2 = compiler, compilerSet.add(compiler2), createBuiltinPlugin(this.name, this.enhanced);
        }
    }
    class ConsumeSharedPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.ConsumeSharedPlugin;
        _options;
        constructor(options){
            super(), this._options = {
                consumes: parseOptions(options.consumes, (item, key)=>{
                    if (Array.isArray(item)) throw Error("Unexpected array in options");
                    return item !== key && isRequiredVersion(item) ? {
                        import: key,
                        shareScope: options.shareScope || "default",
                        shareKey: key,
                        requiredVersion: item,
                        strictVersion: !0,
                        packageName: void 0,
                        singleton: !1,
                        eager: !1
                    } : {
                        import: key,
                        shareScope: options.shareScope || "default",
                        shareKey: key,
                        requiredVersion: void 0,
                        packageName: void 0,
                        strictVersion: !1,
                        singleton: !1,
                        eager: !1
                    };
                }, (item, key)=>({
                        import: !1 === item.import ? void 0 : item.import || key,
                        shareScope: item.shareScope || options.shareScope || "default",
                        shareKey: item.shareKey || key,
                        requiredVersion: item.requiredVersion,
                        strictVersion: "boolean" == typeof item.strictVersion ? item.strictVersion : !1 !== item.import && !item.singleton,
                        packageName: item.packageName,
                        singleton: !!item.singleton,
                        eager: !!item.eager
                    })),
                enhanced: options.enhanced ?? !1
            };
        }
        raw(compiler) {
            new ShareRuntimePlugin(this._options.enhanced).apply(compiler);
            let rawOptions = {
                consumes: this._options.consumes.map(([key, v])=>({
                        key,
                        ...v
                    })),
                enhanced: this._options.enhanced
            };
            return createBuiltinPlugin(this.name, rawOptions);
        }
    }
    class ProvideSharedPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.ProvideSharedPlugin;
        _provides;
        _enhanced;
        constructor(options){
            super(), this._provides = parseOptions(options.provides, (item)=>{
                if (Array.isArray(item)) throw Error("Unexpected array of provides");
                return {
                    shareKey: item,
                    version: void 0,
                    shareScope: options.shareScope || "default",
                    eager: !1
                };
            }, (item)=>{
                let raw = {
                    shareKey: item.shareKey,
                    version: item.version,
                    shareScope: item.shareScope || options.shareScope || "default",
                    eager: !!item.eager
                };
                return options.enhanced ? {
                    ...raw,
                    singleton: item.singleton,
                    requiredVersion: item.requiredVersion,
                    strictVersion: item.strictVersion
                } : raw;
            }), this._enhanced = options.enhanced;
        }
        raw(compiler) {
            new ShareRuntimePlugin(this._enhanced ?? !1).apply(compiler);
            let rawOptions = this._provides.map(([key, v])=>({
                    key,
                    ...v
                }));
            return createBuiltinPlugin(this.name, rawOptions);
        }
    }
    class SharePlugin {
        _shareScope;
        _consumes;
        _provides;
        _enhanced;
        constructor(options){
            const sharedOptions = parseOptions(options.shared, (item, key)=>{
                if ("string" != typeof item) throw Error("Unexpected array in shared");
                return item !== key && isRequiredVersion(item) ? {
                    import: key,
                    requiredVersion: item
                } : {
                    import: item
                };
            }, (item)=>item), consumes = sharedOptions.map(([key, options])=>({
                    [key]: {
                        import: options.import,
                        shareKey: options.shareKey || key,
                        shareScope: options.shareScope,
                        requiredVersion: options.requiredVersion,
                        strictVersion: options.strictVersion,
                        singleton: options.singleton,
                        packageName: options.packageName,
                        eager: options.eager
                    }
                })), provides = sharedOptions.filter(([, options])=>!1 !== options.import).map(([key, options])=>({
                    [options.import || key]: {
                        shareKey: options.shareKey || key,
                        shareScope: options.shareScope,
                        version: options.version,
                        eager: options.eager,
                        singleton: options.singleton,
                        requiredVersion: options.requiredVersion,
                        strictVersion: options.strictVersion
                    }
                }));
            this._shareScope = options.shareScope, this._consumes = consumes, this._provides = provides, this._enhanced = options.enhanced ?? !1;
        }
        apply(compiler) {
            new ConsumeSharedPlugin({
                shareScope: this._shareScope,
                consumes: this._consumes,
                enhanced: this._enhanced
            }).apply(compiler), new ProvideSharedPlugin({
                shareScope: this._shareScope,
                provides: this._provides,
                enhanced: this._enhanced
            }).apply(compiler);
        }
    }
    class ContainerPlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.ContainerPlugin;
        _options;
        constructor(options){
            super(), this._options = {
                name: options.name,
                shareScope: options.shareScope || "default",
                library: options.library || {
                    type: "var",
                    name: options.name
                },
                runtime: options.runtime,
                filename: options.filename,
                exposes: parseOptions(options.exposes, (item)=>({
                        import: Array.isArray(item) ? item : [
                            item
                        ],
                        name: void 0
                    }), (item)=>({
                        import: Array.isArray(item.import) ? item.import : [
                            item.import
                        ],
                        name: item.name || void 0
                    })),
                enhanced: options.enhanced ?? !1
            };
        }
        raw(compiler) {
            let { name, shareScope, library, runtime, filename, exposes, enhanced } = this._options;
            compiler.options.output.enabledLibraryTypes.includes(library.type) || compiler.options.output.enabledLibraryTypes.push(library.type), new ShareRuntimePlugin(this._options.enhanced).apply(compiler);
            let rawOptions = {
                name,
                shareScope,
                library,
                runtime,
                filename,
                exposes: exposes.map(([key, r])=>({
                        key,
                        ...r
                    })),
                enhanced
            };
            return createBuiltinPlugin(this.name, rawOptions);
        }
    }
    class ContainerReferencePlugin extends RspackBuiltinPlugin {
        name = binding_.BuiltinPluginName.ContainerReferencePlugin;
        _options;
        constructor(options){
            super(), this._options = {
                remoteType: options.remoteType,
                remotes: parseOptions(options.remotes, (item)=>({
                        external: Array.isArray(item) ? item : [
                            item
                        ],
                        shareScope: options.shareScope || "default"
                    }), (item)=>({
                        external: Array.isArray(item.external) ? item.external : [
                            item.external
                        ],
                        shareScope: item.shareScope || options.shareScope || "default"
                    })),
                enhanced: options.enhanced ?? !1
            };
        }
        raw(compiler) {
            let { remoteType, remotes } = this._options, remoteExternals = {};
            for (let [key, config] of remotes){
                let i = 0;
                for (let external of config.external)!external.startsWith("internal ") && (remoteExternals[`webpack/container/reference/${key}${i ? `/fallback-${i}` : ""}`] = external, i++);
            }
            new ExternalsPlugin(remoteType, remoteExternals, !0).apply(compiler), new ShareRuntimePlugin(this._options.enhanced).apply(compiler);
            let rawOptions = {
                remoteType: this._options.remoteType,
                remotes: this._options.remotes.map(([key, r])=>({
                        key,
                        ...r
                    })),
                enhanced: this._options.enhanced
            };
            return createBuiltinPlugin(this.name, rawOptions);
        }
    }
    async function minify(source, options) {
        let _options = JSON.stringify(options || {});
        return binding_default().minify(source, _options);
    }
    async function transform(source, options) {
        let _options = JSON.stringify(options || {});
        return binding_default().transform(source, _options);
    }
    let exports_rspackVersion = "1.6.8", exports_version = "5.75.0", exports_WebpackError = Error, sources = __webpack_require__("webpack-sources"), exports_config = {
        getNormalizedRspackOptions: getNormalizedRspackOptions,
        applyRspackOptionsDefaults: applyRspackOptionsDefaults,
        getNormalizedWebpackOptions: getNormalizedRspackOptions,
        applyWebpackOptionsDefaults: applyRspackOptionsDefaults
    }, util = {
        createHash: createHash_createHash,
        cleverMerge: cachedCleverMerge
    }, web = {
        FetchCompileAsyncWasmPlugin: FetchCompileAsyncWasmPlugin
    }, exports_node = {
        NodeTargetPlugin: NodeTargetPlugin,
        NodeTemplatePlugin: class {
            _options;
            constructor(_options = {}){
                this._options = _options;
            }
            apply(compiler) {
                let chunkLoading = this._options.asyncChunkLoading ? "async-node" : "require";
                compiler.options.output.chunkLoading = chunkLoading, new CommonJsChunkFormatPlugin().apply(compiler), new EnableChunkLoadingPlugin(chunkLoading).apply(compiler);
            }
        },
        NodeEnvironmentPlugin: NodeEnvironmentPlugin
    }, electron = {
        ElectronTargetPlugin: ElectronTargetPlugin
    }, exports_library = {
        EnableLibraryPlugin: EnableLibraryPlugin
    }, exports_wasm = {
        EnableWasmLoadingPlugin: EnableWasmLoadingPlugin
    }, javascript = {
        EnableChunkLoadingPlugin: EnableChunkLoadingPlugin,
        JavascriptModulesPlugin: JavascriptModulesPlugin
    }, webworker = {
        WebWorkerTemplatePlugin: WebWorkerTemplatePlugin
    }, optimize = {
        LimitChunkCountPlugin: LimitChunkCountPlugin,
        RuntimeChunkPlugin: RuntimeChunkPlugin,
        SplitChunksPlugin: SplitChunksPlugin
    }, container = {
        ContainerPlugin: ContainerPlugin,
        ContainerReferencePlugin: ContainerReferencePlugin,
        ModuleFederationPlugin: class {
            _options;
            constructor(_options){
                this._options = _options;
            }
            apply(compiler) {
                var options;
                let runtimeToolsPath, bundlerRuntimePath, runtimePath, { webpack } = compiler, paths = (runtimeToolsPath = (options = this._options).implementation ?? require.resolve("@module-federation/runtime-tools"), bundlerRuntimePath = require.resolve("@module-federation/webpack-bundler-runtime", {
                    paths: [
                        runtimeToolsPath
                    ]
                }), runtimePath = require.resolve("@module-federation/runtime", {
                    paths: [
                        runtimeToolsPath
                    ]
                }), {
                    runtimeTools: runtimeToolsPath,
                    bundlerRuntime: bundlerRuntimePath,
                    runtime: runtimePath
                });
                if (compiler.options.resolve.alias = {
                    "@module-federation/runtime-tools": paths.runtimeTools,
                    "@module-federation/runtime": paths.runtime,
                    ...compiler.options.resolve.alias
                }, new ModuleFederationRuntimePlugin({
                    entryRuntime: function(paths, options, compiler) {
                        let runtimePlugins = options.runtimePlugins ?? [], remoteInfos = getRemoteInfos(options), runtimePluginImports = [], runtimePluginVars = [];
                        for(let i = 0; i < runtimePlugins.length; i++){
                            let runtimePluginVar = `__module_federation_runtime_plugin_${i}__`, pluginSpec = runtimePlugins[i], pluginPath = Array.isArray(pluginSpec) ? pluginSpec[0] : pluginSpec, pluginParams = Array.isArray(pluginSpec) ? pluginSpec[1] : void 0;
                            runtimePluginImports.push(`import ${runtimePluginVar} from ${JSON.stringify(pluginPath)}`);
                            let paramsCode = void 0 === pluginParams ? "undefined" : JSON.stringify(pluginParams);
                            runtimePluginVars.push(`${runtimePluginVar}(${paramsCode})`);
                        }
                        let content = [
                            `import __module_federation_bundler_runtime__ from ${JSON.stringify(paths.bundlerRuntime)}`,
                            ...runtimePluginImports,
                            `const __module_federation_runtime_plugins__ = [${runtimePluginVars.join(", ")}]`,
                            `const __module_federation_remote_infos__ = ${JSON.stringify(remoteInfos)}`,
                            `const __module_federation_container_name__ = ${JSON.stringify(options.name ?? compiler.options.output.uniqueName)}`,
                            `const __module_federation_share_strategy__ = ${JSON.stringify(options.shareStrategy ?? "version-first")}`,
                            compiler.webpack.Template.getFunctionContent(__webpack_require__("./moduleFederationDefaultRuntime.js"))
                        ].join(";");
                        return `@module-federation/runtime/rspack.js!=!data:text/javascript,${content}`;
                    }(paths, this._options, compiler)
                }).apply(compiler), new webpack.container.ModuleFederationPluginV1({
                    ...this._options,
                    enhanced: !0
                }).apply(compiler), this._options.manifest) {
                    let manifestOptions = !0 === this._options.manifest ? {} : {
                        ...this._options.manifest
                    }, containerName = manifestOptions.name ?? this._options.name, globalName = manifestOptions.globalName ?? function(library) {
                        if (!library) return;
                        let libName = library.name;
                        if (libName) {
                            if ("string" == typeof libName) return libName;
                            if (Array.isArray(libName)) return libName[0];
                            if ("object" == typeof libName) return libName.root?.[0] ?? libName.amd ?? libName.commonjs ?? void 0;
                        }
                    }(this._options.library) ?? containerName, remoteAliasMap = Object.entries(getRemoteInfos(this._options)).reduce((sum, cur)=>{
                        if (cur[1].length > 1) return sum;
                        let { entry, alias, name } = cur[1][0];
                        return entry && name && (sum[alias] = {
                            name,
                            entry
                        }), sum;
                    }, {}), manifestExposes = function(exposes) {
                        if (!exposes) return;
                        let result = parseOptions(exposes, (value, key)=>({
                                import: Array.isArray(value) ? value : [
                                    value
                                ],
                                name: void 0
                            }), (value)=>({
                                import: Array.isArray(value.import) ? value.import : [
                                    value.import
                                ],
                                name: value.name ?? void 0
                            })).map(([exposeKey, info])=>{
                            let exposeName = info.name ?? exposeKey.replace(/^\.\//, "");
                            return {
                                path: exposeKey,
                                name: exposeName
                            };
                        });
                        return result.length > 0 ? result : void 0;
                    }(this._options.exposes);
                    void 0 === manifestOptions.exposes && manifestExposes && (manifestOptions.exposes = manifestExposes);
                    let manifestShared = function(shared) {
                        if (!shared) return;
                        let result = parseOptions(shared, (item, key)=>{
                            if ("string" != typeof item) throw Error("Unexpected array in shared");
                            return item !== key && isRequiredVersion(item) ? {
                                import: key,
                                requiredVersion: item
                            } : {
                                import: item
                            };
                        }, (item)=>item).map(([key, config])=>{
                            let name = config.shareKey || key, version = "string" == typeof config.version ? config.version : void 0;
                            return {
                                name,
                                version,
                                requiredVersion: "string" == typeof config.requiredVersion ? config.requiredVersion : void 0,
                                singleton: config.singleton
                            };
                        });
                        return result.length > 0 ? result : void 0;
                    }(this._options.shared);
                    void 0 === manifestOptions.shared && manifestShared && (manifestOptions.shared = manifestShared), new ModuleFederationManifestPlugin({
                        ...manifestOptions,
                        name: containerName,
                        globalName,
                        remoteAliasMap
                    }).apply(compiler);
                }
            }
        },
        ModuleFederationPluginV1: class {
            _options;
            constructor(_options){
                this._options = _options;
            }
            apply(compiler) {
                let { _options: options } = this, enhanced = options.enhanced ?? !1, library = options.library || {
                    type: "var",
                    name: options.name
                }, remoteType = options.remoteType || (options.library ? options.library.type : "script");
                library && !compiler.options.output.enabledLibraryTypes.includes(library.type) && compiler.options.output.enabledLibraryTypes.push(library.type), compiler.hooks.afterPlugins.tap("ModuleFederationPlugin", ()=>{
                    new ShareRuntimePlugin(this._options.enhanced).apply(compiler), options.exposes && (Array.isArray(options.exposes) ? options.exposes.length > 0 : Object.keys(options.exposes).length > 0) && new ContainerPlugin({
                        name: options.name,
                        library,
                        filename: options.filename,
                        runtime: options.runtime,
                        shareScope: options.shareScope,
                        exposes: options.exposes,
                        enhanced
                    }).apply(compiler), options.remotes && (Array.isArray(options.remotes) ? options.remotes.length > 0 : Object.keys(options.remotes).length > 0) && new ContainerReferencePlugin({
                        remoteType,
                        shareScope: options.shareScope,
                        remotes: options.remotes,
                        enhanced
                    }).apply(compiler), options.shared && new SharePlugin({
                        shared: options.shared,
                        shareScope: options.shareScope,
                        enhanced
                    }).apply(compiler);
                });
            }
        }
    }, sharing = {
        ProvideSharedPlugin: ProvideSharedPlugin,
        ConsumeSharedPlugin: ConsumeSharedPlugin,
        SharePlugin: SharePlugin
    }, exports_experiments = {
        globalTrace: {
            async register (filter, layer, output) {
                await JavaScriptTracer.initJavaScriptTrace(layer, output), (0, binding_.registerGlobalTrace)(filter, layer, output), JavaScriptTracer.initCpuProfiler();
            },
            async cleanup () {
                await JavaScriptTracer.cleanupJavaScriptTrace(), await (0, binding_.syncTraceEvent)(JavaScriptTracer.events), (0, binding_.cleanupGlobalTrace)();
            }
        },
        RemoveDuplicateModulesPlugin: RemoveDuplicateModulesPlugin,
        EsmLibraryPlugin: EsmLibraryPlugin,
        RsdoctorPlugin: RsdoctorPluginImpl,
        RstestPlugin: RstestPlugin,
        RslibPlugin: RslibPlugin,
        SubresourceIntegrityPlugin: SubresourceIntegrityPlugin,
        lazyCompilationMiddleware: (compiler)=>{
            if (compiler instanceof MultiCompiler) {
                let middlewareByCompiler = new Map(), i = 0, isReportDeprecatedWarned = !1, isReportRepeatWarned = !1;
                for (let c of compiler.compilers){
                    if (c.options.experiments.lazyCompilation && (c.name ? console.warn(`The 'experiments.lazyCompilation' option in compiler named '${c.name}' is deprecated, please use the Configuration top level 'lazyCompilation' instead.`) : isReportDeprecatedWarned || (console.warn(DEPRECATED_LAZY_COMPILATION_OPTIONS_WARN), isReportDeprecatedWarned = !0)), c.options.lazyCompilation && c.options.experiments.lazyCompilation && (c.name ? console.warn(`The top-level 'lazyCompilation' option in compiler named '${c.name}' will override the 'experiments.lazyCompilation' option.`) : isReportRepeatWarned || (console.warn(REPEAT_LAZY_COMPILATION_OPTIONS_WARN), isReportRepeatWarned = !0)), !c.options.lazyCompilation && !c.options.experiments.lazyCompilation) continue;
                    let options = {
                        ...c.options.experiments.lazyCompilation,
                        ...c.options.lazyCompilation
                    }, prefix = options.prefix || LAZY_COMPILATION_PREFIX;
                    options.prefix = `${prefix}__${i++}`;
                    let activeModules = new Set();
                    middlewareByCompiler.set(options.prefix, lazyCompilationMiddlewareInternal(compiler, activeModules, options.prefix)), applyPlugin(c, options, activeModules);
                }
                let keys = [
                    ...middlewareByCompiler.keys()
                ];
                return (req, res, next)=>{
                    let key = keys.find((key)=>req.url?.startsWith(key));
                    if (!key) return next?.();
                    let middleware = middlewareByCompiler.get(key);
                    return middleware?.(req, res, next);
                };
            }
            if (compiler.options.experiments.lazyCompilation && (console.warn(DEPRECATED_LAZY_COMPILATION_OPTIONS_WARN), compiler.options.lazyCompilation && console.warn(REPEAT_LAZY_COMPILATION_OPTIONS_WARN)), !compiler.options.lazyCompilation && !compiler.options.experiments.lazyCompilation) return noop;
            let activeModules = new Set(), options = {
                ...compiler.options.experiments.lazyCompilation,
                ...compiler.options.lazyCompilation
            };
            return applyPlugin(compiler, options, activeModules), lazyCompilationMiddlewareInternal(compiler, activeModules, options.prefix || LAZY_COMPILATION_PREFIX);
        },
        swc: {
            minify: minify,
            transform: transform,
            minifySync: function(source, options) {
                let _options = JSON.stringify(options || {});
                return binding_default().minifySync(source, _options);
            },
            transformSync: function(source, options) {
                let _options = JSON.stringify(options || {});
                return binding_default().transformSync(source, _options);
            }
        },
        resolver: {
            ResolverFactory: binding_.ResolverFactory,
            EnforceExtension: binding_.EnforceExtension,
            async: binding_.async,
            sync: binding_.sync
        },
        CssChunkingPlugin: CssChunkingPlugin,
        createNativePlugin: function(name, resolve, affectedHooks) {
            if (INTERNAL_PLUGIN_NAMES.includes(name)) throw Error(`Cannot register native plugin with name '${name}', it conflicts with internal plugin names.`);
            return base_create(name, resolve, affectedHooks);
        },
        VirtualModulesPlugin: VirtualModulesPlugin
    }, ERROR_PREFIX = "Invalid Rspack configuration:";
    function validateRspackConfig(config) {
        (({ context })=>{
            if (context && !(0, external_node_path_namespaceObject.isAbsolute)(context)) throw Error(`${ERROR_PREFIX} "context" must be an absolute path, get "${context}".`);
        })(config), (({ output })=>{
            if (output?.path && !(0, external_node_path_namespaceObject.isAbsolute)(output.path)) throw Error(`${ERROR_PREFIX} "output.path" must be an absolute path, get "${output.path}".`);
        })(config), (({ optimization })=>{
            if (optimization?.splitChunks) {
                let { minChunks } = optimization.splitChunks;
                if (void 0 !== minChunks && minChunks < 1) throw Error(`${ERROR_PREFIX} "optimization.splitChunks.minChunks" must be greater than or equal to 1, get \`${minChunks}\`.`);
            }
        })(config), (({ output, externals, externalsType })=>{
            let library = output?.library;
            if (!("object" == typeof library && "type" in library ? "umd" === library.type : output?.libraryTarget === "umd") || void 0 !== externalsType && "umd" !== externalsType) return;
            let checkExternalItem = (externalItem)=>{
                if ("object" == typeof externalItem && null !== externalItem) for (let value of Object.values(externalItem))checkExternalItemValue(value);
            }, checkExternalItemValue = (value)=>{
                if (value && "object" == typeof value && [
                    "root",
                    "commonjs",
                    "commonjs2",
                    "amd"
                ].some((key)=>void 0 === value[key])) throw Error(`${ERROR_PREFIX} External object must have "root", "commonjs", "commonjs2", "amd" properties when "libraryType" or "externalsType" is "umd", get: ${JSON.stringify(value, null, 2)}.`);
            };
            Array.isArray(externals) ? externals.forEach((external)=>checkExternalItem(external)) : checkExternalItem(externals);
        })(config);
    }
    function createCompiler(userOptions) {
        var options;
        let options1 = getNormalizedRspackOptions(userOptions);
        if (F(options = options1, "context", ()=>process.cwd()), applyInfrastructureLoggingDefaults(options.infrastructureLogging), isNil(options1.context)) throw Error("options.context is required");
        let compiler = new Compiler(options1.context, options1);
        if (new NodeEnvironmentPlugin({
            infrastructureLogging: options1.infrastructureLogging
        }).apply(compiler), Array.isArray(options1.plugins)) for (let plugin of options1.plugins)"function" == typeof plugin ? plugin.call(compiler, compiler) : plugin && plugin.apply(compiler);
        return applyRspackOptionsDefaults(compiler.options), compiler.hooks.environment.call(), compiler.hooks.afterEnvironment.call(), new RspackOptionsApply().process(compiler.options, compiler), compiler.hooks.initialize.call(), compiler;
    }
    function isMultiRspackOptions(o) {
        return Array.isArray(o);
    }
    let src_fn = Object.assign(function(options, callback) {
        try {
            if (isMultiRspackOptions(options)) for (let option of options)validateRspackConfig(option);
            else validateRspackConfig(options);
        } catch (err) {
            if (err instanceof Error && callback) return callback(err), null;
            throw err;
        }
        let create = ()=>{
            if (isMultiRspackOptions(options)) {
                let compiler = function(options) {
                    let compilers = options.map(createCompiler), compiler = new MultiCompiler(compilers, options);
                    for (let childCompiler of compilers)childCompiler.options.dependencies && compiler.setDependencies(childCompiler, childCompiler.options.dependencies);
                    return compiler;
                }(options), watch = options.some((options)=>options.watch);
                return {
                    compiler,
                    watch,
                    watchOptions: options.map((options)=>options.watchOptions || {})
                };
            }
            let compiler = createCompiler(options), watch = options.watch;
            return {
                compiler,
                watch,
                watchOptions: options.watchOptions || {}
            };
        };
        if (callback) try {
            let { compiler, watch, watchOptions } = create();
            return watch ? compiler.watch(watchOptions, callback) : compiler.run((err, stats)=>{
                compiler.close(()=>{
                    callback(err, stats);
                });
            }), compiler;
        } catch (err) {
            return process.nextTick(()=>callback(err)), null;
        }
        {
            let { compiler, watch } = create();
            return watch && external_node_util_default().deprecate(()=>{}, "A 'callback' argument needs to be provided to the 'rspack(options, callback)' function when the 'watch' option is set. There is no way to handle the 'watch' option without a callback.")(), compiler;
        }
    }, exports_namespaceObject);
    src_fn.rspack = src_fn, src_fn.webpack = src_fn;
    let src_rspack_0 = src_fn, src_0 = src_rspack_0;
})(), exports.AsyncDependenciesBlock = __webpack_exports__.AsyncDependenciesBlock, exports.BannerPlugin = __webpack_exports__.BannerPlugin, exports.CircularDependencyRspackPlugin = __webpack_exports__.CircularDependencyRspackPlugin, exports.Compilation = __webpack_exports__.Compilation, exports.Compiler = __webpack_exports__.Compiler, exports.ConcatenatedModule = __webpack_exports__.ConcatenatedModule, exports.ContextModule = __webpack_exports__.ContextModule, exports.ContextReplacementPlugin = __webpack_exports__.ContextReplacementPlugin, exports.CopyRspackPlugin = __webpack_exports__.CopyRspackPlugin, exports.CssExtractRspackPlugin = __webpack_exports__.CssExtractRspackPlugin, exports.DefinePlugin = __webpack_exports__.DefinePlugin, exports.Dependency = __webpack_exports__.Dependency, exports.DllPlugin = __webpack_exports__.DllPlugin, exports.DllReferencePlugin = __webpack_exports__.DllReferencePlugin, exports.DynamicEntryPlugin = __webpack_exports__.DynamicEntryPlugin, exports.EntryDependency = __webpack_exports__.EntryDependency, exports.EntryOptionPlugin = __webpack_exports__.EntryOptionPlugin, exports.EntryPlugin = __webpack_exports__.EntryPlugin, exports.EnvironmentPlugin = __webpack_exports__.EnvironmentPlugin, exports.EvalDevToolModulePlugin = __webpack_exports__.EvalDevToolModulePlugin, exports.EvalSourceMapDevToolPlugin = __webpack_exports__.EvalSourceMapDevToolPlugin, exports.ExternalModule = __webpack_exports__.ExternalModule, exports.ExternalsPlugin = __webpack_exports__.ExternalsPlugin, exports.HotModuleReplacementPlugin = __webpack_exports__.HotModuleReplacementPlugin, exports.HtmlRspackPlugin = __webpack_exports__.HtmlRspackPlugin, exports.IgnorePlugin = __webpack_exports__.IgnorePlugin, exports.LightningCssMinimizerRspackPlugin = __webpack_exports__.LightningCssMinimizerRspackPlugin, exports.LoaderOptionsPlugin = __webpack_exports__.LoaderOptionsPlugin, exports.LoaderTargetPlugin = __webpack_exports__.LoaderTargetPlugin, exports.Module = __webpack_exports__.Module, exports.ModuleFilenameHelpers = __webpack_exports__.ModuleFilenameHelpers, exports.MultiCompiler = __webpack_exports__.MultiCompiler, exports.MultiStats = __webpack_exports__.MultiStats, exports.NoEmitOnErrorsPlugin = __webpack_exports__.NoEmitOnErrorsPlugin, exports.NormalModule = __webpack_exports__.NormalModule, exports.NormalModuleReplacementPlugin = __webpack_exports__.NormalModuleReplacementPlugin, exports.ProgressPlugin = __webpack_exports__.ProgressPlugin, exports.ProvidePlugin = __webpack_exports__.ProvidePlugin, exports.RspackOptionsApply = __webpack_exports__.RspackOptionsApply, exports.RuntimeGlobals = __webpack_exports__.RuntimeGlobals, exports.RuntimeModule = __webpack_exports__.RuntimeModule, exports.RuntimePlugin = __webpack_exports__.RuntimePlugin, exports.SourceMapDevToolPlugin = __webpack_exports__.SourceMapDevToolPlugin, exports.Stats = __webpack_exports__.Stats, exports.StatsErrorCode = __webpack_exports__.StatsErrorCode, exports.SwcJsMinimizerRspackPlugin = __webpack_exports__.SwcJsMinimizerRspackPlugin, exports.Template = __webpack_exports__.Template, exports.ValidationError = __webpack_exports__.ValidationError, exports.WarnCaseSensitiveModulesPlugin = __webpack_exports__.WarnCaseSensitiveModulesPlugin, exports.WebpackError = __webpack_exports__.WebpackError, exports.WebpackOptionsApply = __webpack_exports__.WebpackOptionsApply, exports.config = __webpack_exports__.config, exports.container = __webpack_exports__.container, exports.default = __webpack_exports__.default, exports.electron = __webpack_exports__.electron, exports.experiments = __webpack_exports__.experiments, exports.javascript = __webpack_exports__.javascript, exports.library = __webpack_exports__.library, exports.node = __webpack_exports__.node, exports.optimize = __webpack_exports__.optimize, exports.rspack = __webpack_exports__.rspack, exports.rspackVersion = __webpack_exports__.rspackVersion, exports.sharing = __webpack_exports__.sharing, exports.sources = __webpack_exports__.sources, exports.util = __webpack_exports__.util, exports.version = __webpack_exports__.version, exports.wasm = __webpack_exports__.wasm, exports.web = __webpack_exports__.web, exports.webworker = __webpack_exports__.webworker, __webpack_exports__)-1 === [
    "AsyncDependenciesBlock",
    "BannerPlugin",
    "CircularDependencyRspackPlugin",
    "Compilation",
    "Compiler",
    "ConcatenatedModule",
    "ContextModule",
    "ContextReplacementPlugin",
    "CopyRspackPlugin",
    "CssExtractRspackPlugin",
    "DefinePlugin",
    "Dependency",
    "DllPlugin",
    "DllReferencePlugin",
    "DynamicEntryPlugin",
    "EntryDependency",
    "EntryOptionPlugin",
    "EntryPlugin",
    "EnvironmentPlugin",
    "EvalDevToolModulePlugin",
    "EvalSourceMapDevToolPlugin",
    "ExternalModule",
    "ExternalsPlugin",
    "HotModuleReplacementPlugin",
    "HtmlRspackPlugin",
    "IgnorePlugin",
    "LightningCssMinimizerRspackPlugin",
    "LoaderOptionsPlugin",
    "LoaderTargetPlugin",
    "Module",
    "ModuleFilenameHelpers",
    "MultiCompiler",
    "MultiStats",
    "NoEmitOnErrorsPlugin",
    "NormalModule",
    "NormalModuleReplacementPlugin",
    "ProgressPlugin",
    "ProvidePlugin",
    "RspackOptionsApply",
    "RuntimeGlobals",
    "RuntimeModule",
    "RuntimePlugin",
    "SourceMapDevToolPlugin",
    "Stats",
    "StatsErrorCode",
    "SwcJsMinimizerRspackPlugin",
    "Template",
    "ValidationError",
    "WarnCaseSensitiveModulesPlugin",
    "WebpackError",
    "WebpackOptionsApply",
    "config",
    "container",
    "default",
    "electron",
    "experiments",
    "javascript",
    "library",
    "node",
    "optimize",
    "rspack",
    "rspackVersion",
    "sharing",
    "sources",
    "util",
    "version",
    "wasm",
    "web",
    "webworker"
].indexOf(__rspack_i) && (exports[__rspack_i] = __webpack_exports__[__rspack_i]);
Object.defineProperty(exports, '__esModule', {
    value: !0
});

module.exports = __webpack_exports__.default;