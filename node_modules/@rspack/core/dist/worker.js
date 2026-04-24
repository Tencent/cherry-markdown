"use strict";
var __webpack_modules__ = {
    "./src/swc.ts" (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__), __webpack_require__.d(__webpack_exports__, {
            minify: ()=>minify,
            minifySync: ()=>minifySync,
            transform: ()=>transform,
            transformSync: ()=>transformSync
        });
        var _rspack_binding__rspack_import_0 = __webpack_require__("@rspack/binding"), _rspack_binding__rspack_import_0_default = __webpack_require__.n(_rspack_binding__rspack_import_0);
        async function minify(source, options) {
            let _options = JSON.stringify(options || {});
            return _rspack_binding__rspack_import_0_default().minify(source, _options);
        }
        function minifySync(source, options) {
            let _options = JSON.stringify(options || {});
            return _rspack_binding__rspack_import_0_default().minifySync(source, _options);
        }
        async function transform(source, options) {
            let _options = JSON.stringify(options || {});
            return _rspack_binding__rspack_import_0_default().transform(source, _options);
        }
        function transformSync(source, options) {
            let _options = JSON.stringify(options || {});
            return _rspack_binding__rspack_import_0_default().transformSync(source, _options);
        }
    },
    "./src/util/cleverMerge.ts" (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.d(__webpack_exports__, {
            ks: ()=>cleverMerge
        });
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
        }, serializeObject = (info, dynamicInfo)=>{
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
                ], serializeObject(firstObject.static, {
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
            return serializeObject(resultInfo, secondDynamicInfo);
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
        };
    },
    "./src/util/createHash.ts" (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        let createMd4, createXxhash64;
        __webpack_require__.d(__webpack_exports__, {
            n: ()=>createHash_createHash
        });
        var external_node_util_ = __webpack_require__("node:util");
        class WebpackError extends Error {
            loc;
            file;
            chunk;
            module;
            details;
            hideStack;
        }
        Object.defineProperty(WebpackError.prototype, external_node_util_.inspect.custom, {
            value: function() {
                return this.stack + (this.details ? `\n${this.details}` : "");
            },
            enumerable: !1,
            configurable: !0
        });
        let lib_WebpackError = WebpackError, CURRENT_METHOD_REGEXP = /at ([a-zA-Z0-9_.]*)/;
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
                            let md4 = new WebAssembly.Module(Buffer.from("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", "base64"));
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
        };
    },
    "@rspack/binding" (module) {
        module.exports = require("@rspack/binding");
    },
    "node:crypto" (module) {
        module.exports = require("node:crypto");
    },
    "node:fs" (module) {
        module.exports = require("node:fs");
    },
    "node:os" (module) {
        module.exports = require("node:os");
    },
    "node:url" (module) {
        module.exports = require("node:url");
    },
    "node:util" (module) {
        module.exports = require("node:util");
    }
}, __webpack_module_cache__ = {};
function __webpack_require__(moduleId) {
    var cachedModule = __webpack_module_cache__[moduleId];
    if (void 0 !== cachedModule) return cachedModule.exports;
    var module = __webpack_module_cache__[moduleId] = {
        exports: {}
    };
    return __webpack_modules__[moduleId](module, module.exports, __webpack_require__), module.exports;
}
__webpack_require__.n = (module)=>{
    var getter = module && module.__esModule ? ()=>module.default : ()=>module;
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
    let url;
    __webpack_require__.r(__webpack_exports__), __webpack_require__.d(__webpack_exports__, {
        default: ()=>loader_runner_worker
    });
    let external_node_querystring_namespaceObject = require("node:querystring");
    var external_node_querystring_default = __webpack_require__.n(external_node_querystring_namespaceObject), external_node_util_ = __webpack_require__("node:util");
    let external_node_worker_threads_namespaceObject = require("node:worker_threads");
    var binding_ = __webpack_require__("@rspack/binding"), createHash = __webpack_require__("./src/util/createHash.ts");
    let external_node_path_namespaceObject = require("node:path");
    var external_node_path_default = __webpack_require__.n(external_node_path_namespaceObject);
    let WINDOWS_ABS_PATH_REGEXP = /^[a-zA-Z]:[\\/]/, SEGMENTS_SPLIT_REGEXP = /([|!])/, WINDOWS_PATH_SEPARATOR_REGEXP = /\\/g, relativePathToRequest = (relativePath)=>"" === relativePath ? "./." : ".." === relativePath ? "../." : relativePath.startsWith("../") ? relativePath : `./${relativePath}`, absoluteToRequest = (context, maybeAbsolutePath)=>{
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
    };
    makeCacheableWithContext((context, identifier)=>identifier.split(SEGMENTS_SPLIT_REGEXP).map((str)=>absoluteToRequest(context, str)).join(""));
    let contextify = makeCacheableWithContext((context, request)=>request.split("!").map((r)=>absoluteToRequest(context, r)).join("!")), absolutify = makeCacheableWithContext((context, request)=>request.split("!").map((r)=>{
            var context1, relativePath;
            return context1 = context, (relativePath = r).startsWith("./") || relativePath.startsWith("../") ? external_node_path_default().join(context1, relativePath) : relativePath;
        }).join("!")), PATH_QUERY_FRAGMENT_REGEXP = /^((?:\u200b.|[^?#\u200b])*)(\?(?:\u200b.|[^#\u200b])*)?(#.*)?$/, PATH_QUERY_REGEXP = /^((?:\u200b.|[^?\u200b])*)(\?.*)?$/;
    makeCacheable((str)=>{
        let match = PATH_QUERY_FRAGMENT_REGEXP.exec(str);
        return {
            resource: str,
            path: match[1].replace(/\u200b(.)/g, "$1"),
            query: match[2] ? match[2].replace(/\u200b(.)/g, "$1") : "",
            fragment: match[3] || ""
        };
    }), makeCacheable((str)=>{
        let match = PATH_QUERY_REGEXP.exec(str);
        return {
            resource: str,
            path: match[1].replace(/\u200b(.)/g, "$1"),
            query: match[2] ? match[2].replace(/\u200b(.)/g, "$1") : ""
        };
    });
    let memoize = (fn)=>{
        let result, cache = !1, callback = fn;
        return ()=>(cache || (result = callback(), cache = !0, callback = void 0), result);
    }, LoaderLoadingError = class extends Error {
        constructor(message){
            super(message), this.name = "LoaderRunnerError", Error.captureStackTrace(this, this.constructor);
        }
    };
    function loadLoader(loader, compiler, callback) {
        if ("module" === loader.type) try {
            void 0 === url && (url = __webpack_require__("node:url")), import(url.pathToFileURL(loader.path).toString()).then((module)=>{
                handleResult(loader, module, callback);
            }, callback);
            return;
        } catch (e) {
            callback(e);
        }
        else {
            let module;
            try {
                module = require(loader.path);
            } catch (e) {
                if (e instanceof Error && "EMFILE" === e.code) return void setImmediate(loadLoader.bind(null, loader, compiler, callback));
                return callback(e);
            }
            return handleResult(loader, module, callback);
        }
    }
    function handleResult(loader, module, callback) {
        return "function" != typeof module && "object" != typeof module ? callback(new LoaderLoadingError(`Module '${loader.path}' is not a loader (export function or es6 module)`)) : (loader.normal = "function" == typeof module ? module : module.default, loader.pitch = module.pitch, loader.raw = module.raw, loader.pitch || (loader.noPitch = !0), "function" != typeof loader.normal && "function" != typeof loader.pitch) ? callback(new LoaderLoadingError(`Module '${loader.path}' is not a loader (must have normal or pitch function)`)) : void callback();
    }
    function isWorkerResponseMessage(message) {
        return "response" === message.type;
    }
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
    let decoder = new TextDecoder();
    (0, external_node_util_.promisify)(loadLoader);
    let utils_runSyncOrAsync = (0, external_node_util_.promisify)(function(fn, context, args, callback) {
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
    }), loadLoaderAsync = (0, external_node_util_.promisify)(loadLoader);
    async function loaderImpl({ args, loaderContext, loaderState }, sendRequest, waitForPendingRequest) {
        let resourcePath = loaderContext.resourcePath, contextDirectory = resourcePath ? function(path) {
            if ("/" === path) return "/";
            let i = path.lastIndexOf("/"), j = path.lastIndexOf("\\"), i2 = path.indexOf("/"), j2 = path.indexOf("\\"), idx = i > j ? i : j, idx2 = i > j ? i2 : j2;
            return idx < 0 ? path : idx === idx2 ? path.slice(0, idx + 1) : path.slice(0, idx);
        }(resourcePath) : null, pendingDependencyRequest = [];
        loaderContext.parallel = !0, loaderContext.dependency = loaderContext.addDependency = function(file) {
            pendingDependencyRequest.push(sendRequest("AddDependency", file));
        }, loaderContext.addContextDependency = function(context) {
            pendingDependencyRequest.push(sendRequest("AddContextDependency", context));
        }, loaderContext.addBuildDependency = function(file) {
            pendingDependencyRequest.push(sendRequest("AddBuildDependency", file));
        }, loaderContext.getDependencies = function() {
            return waitForPendingRequest(pendingDependencyRequest), sendRequest("GetDependencies").wait();
        }, loaderContext.getContextDependencies = function() {
            return waitForPendingRequest(pendingDependencyRequest), sendRequest("GetContextDependencies").wait();
        }, loaderContext.getMissingDependencies = function() {
            return waitForPendingRequest(pendingDependencyRequest), sendRequest("GetMissingDependencies").wait();
        }, loaderContext.clearDependencies = function() {
            pendingDependencyRequest.push(sendRequest("ClearDependencies"));
        }, loaderContext.resolve = function(context, request, callback) {
            sendRequest("Resolve", context, request).then((result)=>{
                callback(null, result);
            }, (err)=>{
                callback(err);
            });
        }, loaderContext.getResolve = function(options) {
            return (context, request, callback)=>{
                if (!callback) return new Promise((resolve, reject)=>{
                    sendRequest("GetResolve", options, context, request).then((result)=>{
                        resolve(result);
                    }, (err)=>{
                        reject(err);
                    });
                });
                sendRequest("GetResolve", options, context, request).then((result)=>{
                    callback(null, result);
                }, (err)=>{
                    callback(err);
                });
            };
        }, loaderContext.getLogger = function(name) {
            return {
                error (...args) {
                    sendRequest("GetLogger", "error", name, args);
                },
                warn (...args) {
                    sendRequest("GetLogger", "warn", name, args);
                },
                info (...args) {
                    sendRequest("GetLogger", "info", name, args);
                },
                log (...args) {
                    sendRequest("GetLogger", "log", name, args);
                },
                debug (...args) {
                    sendRequest("GetLogger", "debug", name, args);
                },
                assert (assertion, ...args) {
                    assertion || sendRequest("GetLogger", "error", name, args);
                },
                trace () {
                    sendRequest("GetLogger", "trace", name, [
                        "Trace"
                    ]);
                },
                clear () {
                    sendRequest("GetLogger", "clear", name);
                },
                status (...args) {
                    sendRequest("GetLogger", "status", name, args);
                },
                group (...args) {
                    sendRequest("GetLogger", "group", name, args);
                },
                groupCollapsed (...args) {
                    sendRequest("GetLogger", "groupCollapsed", name, args);
                },
                groupEnd (...args) {
                    sendRequest("GetLogger", "groupEnd", name, args);
                },
                profile (label) {
                    sendRequest("GetLogger", "profile", name, [
                        label
                    ]);
                },
                profileEnd (label) {
                    sendRequest("GetLogger", "profileEnd", name, [
                        label
                    ]);
                },
                time (label) {
                    sendRequest("GetLogger", "time", name, [
                        label
                    ]);
                },
                timeEnd (label) {
                    sendRequest("GetLogger", "timeEnd", name, [
                        label
                    ]);
                },
                timeLog (label, ...args) {
                    sendRequest("GetLogger", "timeLog", name, [
                        label,
                        ...args
                    ]);
                },
                timeAggregate (label) {
                    sendRequest("GetLogger", "timeAggregate", name, [
                        label
                    ]);
                },
                timeAggregateEnd (label) {
                    sendRequest("GetLogger", "timeAggregateEnd", name, [
                        label
                    ]);
                }
            };
        }, loaderContext.emitError = function(err) {
            sendRequest("EmitError", serializeError(err));
        }, loaderContext.emitWarning = function(warning) {
            sendRequest("EmitWarning", serializeError(warning));
        }, loaderContext.emitFile = function(name, content, sourceMap, assetInfo) {
            sendRequest("EmitFile", name, content, sourceMap, assetInfo);
        }, loaderContext.experiments = {
            emitDiagnostic (diagnostic) {
                sendRequest("EmitDiagnostic", diagnostic);
            }
        };
        let getAbsolutify = memoize(()=>absolutify.bindCache({})), getAbsolutifyInContext = memoize(()=>absolutify.bindContextCache(contextDirectory, {})), getContextify = memoize(()=>contextify.bindCache({})), getContextifyInContext = memoize(()=>contextify.bindContextCache(contextDirectory, {}));
        loaderContext.utils = {
            absolutify: (context, request)=>context === contextDirectory ? getAbsolutifyInContext()(request) : getAbsolutify()(context, request),
            contextify: (context, request)=>context === contextDirectory ? getContextifyInContext()(request) : getContextify()(context, request),
            createHash: (type)=>(0, createHash.n)(type || loaderContext._compilation.outputOptions.hashFunction)
        }, loaderContext._compiler = {
            ...loaderContext._compiler,
            rspack: {
                experiments: {
                    swc: __webpack_require__("./src/swc.ts")
                }
            },
            webpack: {
                util: {
                    createHash: __webpack_require__("./src/util/createHash.ts").n,
                    cleverMerge: __webpack_require__("./src/util/cleverMerge.ts").ks
                }
            }
        }, loaderContext._compilation = {
            ...loaderContext._compilation,
            getPath: (filename, data)=>sendRequest("CompilationGetPath", filename, data).wait(),
            getPathWithInfo: (filename, data)=>sendRequest("CompilationGetPathWithInfo", filename, data).wait(),
            getAssetPath: (filename, data)=>sendRequest("CompilationGetAssetPath", filename, data).wait(),
            getAssetPathWithInfo: (filename, data)=>sendRequest("CompilationGetAssetPathWithInfo", filename, data).wait()
        };
        let _module = loaderContext._module;
        loaderContext._module = {
            type: _module.type,
            identifier: ()=>_module.identifier,
            matchResource: _module.matchResource,
            request: _module.request,
            userRequest: _module.userRequest,
            rawRequest: _module.rawRequest
        }, loaderContext.importModule = function(request, options, callback) {
            if (!callback) return new Promise((resolve, reject)=>{
                sendRequest("ImportModule", request, options).then((result)=>{
                    resolve(result);
                }, (err)=>{
                    reject(err);
                });
            });
            sendRequest("ImportModule", request, options).then((result)=>{
                callback(null, result);
            }, (err)=>{
                callback(err);
            });
        }, loaderContext.fs = __webpack_require__("node:fs"), Object.defineProperty(loaderContext, "request", {
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
        }), loaderContext.getOptions = function() {
            let loader = function(loaderContext, index = loaderContext.loaderIndex) {
                return loaderContext.loaders?.length && index < loaderContext.loaders.length && index >= 0 && loaderContext.loaders[index] ? loaderContext.loaders[index] : null;
            }(loaderContext), options = loader?.options;
            if ("string" == typeof options) if (options.startsWith("{") && options.endsWith("}")) try {
                options = JSON.parse(options);
            } catch (e) {
                throw Error(`JSON parsing failed for loader's string options: ${e.message}`);
            }
            else options = external_node_querystring_default().parse(options);
            return null == options && (options = {}), options;
        }, loaderContext.cacheable = function(flag) {
            !1 === flag && sendRequest("SetCacheable", !1);
        }, Object.defineProperty(loaderContext, "data", {
            enumerable: !0,
            get: ()=>loaderContext.loaders[loaderContext.loaderIndex].loaderItem.data,
            set: (value)=>{
                loaderContext.loaders[loaderContext.loaderIndex].loaderItem.data = value;
            }
        });
        let shouldYieldToMainThread = (currentLoaderObject)=>!!(!currentLoaderObject?.parallel || currentLoaderObject?.request.startsWith("builtin:"));
        switch(loaderState){
            case binding_.JsLoaderState.Pitching:
                for(; loaderContext.loaderIndex < loaderContext.loaders.length;){
                    let currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];
                    if (shouldYieldToMainThread(currentLoaderObject)) break;
                    if (currentLoaderObject.pitchExecuted) {
                        loaderContext.loaderIndex += 1;
                        continue;
                    }
                    await loadLoaderAsync(currentLoaderObject, loaderContext._compiler);
                    let fn = currentLoaderObject.pitch;
                    if ((currentLoaderObject.pitchExecuted = !0, fn) && (args = await utils_runSyncOrAsync(fn, loaderContext, [
                        loaderContext.remainingRequest,
                        loaderContext.previousRequest,
                        currentLoaderObject.loaderItem.data
                    ]) || []).some((value)=>void 0 !== value)) break;
                }
                break;
            case binding_.JsLoaderState.Normal:
                for(; loaderContext.loaderIndex >= 0;){
                    let currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex];
                    if (shouldYieldToMainThread(currentLoaderObject)) break;
                    if (currentLoaderObject.normalExecuted) {
                        loaderContext.loaderIndex--;
                        continue;
                    }
                    await loadLoaderAsync(currentLoaderObject, loaderContext._compiler);
                    let fn = currentLoaderObject.normal;
                    currentLoaderObject.normalExecuted = !0, fn && (!function(args, raw) {
                        if (!raw && args[0] instanceof Uint8Array) {
                            var buf;
                            let isShared, str;
                            args[0] = (isShared = (buf = args[0]).buffer instanceof SharedArrayBuffer || buf.buffer.constructor?.name === "SharedArrayBuffer", 0xfeff === (str = decoder.decode(isShared ? Buffer.from(buf) : buf)).charCodeAt(0) ? str.slice(1) : str);
                        } else raw && "string" == typeof args[0] && (args[0] = Buffer.from(args[0], "utf-8"));
                        raw && args[0] instanceof Uint8Array && !Buffer.isBuffer(args[0]) && (args[0] = Buffer.from(args[0].buffer));
                    }(args, !!currentLoaderObject.raw), args = await utils_runSyncOrAsync(fn, loaderContext, args) || []);
                }
        }
        return sendRequest("UpdateLoaderObjects", loaderContext.loaders.map((item)=>({
                data: item.loaderItem.data,
                normalExecuted: item.normalExecuted,
                pitchExecuted: item.pitchExecuted
            }))), args;
    }
    let nextId = 0, responseCallbacks = {};
    function handleIncomingResponses(workerMessage) {
        if (isWorkerResponseMessage(workerMessage)) {
            let { id, data } = workerMessage, callback = responseCallbacks[id];
            if (callback) delete responseCallbacks[id], callback(null, data);
            else throw Error(`No callback found for response with id ${id}`);
        } else if ("response-error" === workerMessage.type) {
            let { id, error } = workerMessage, callback = responseCallbacks[id];
            if (callback) delete responseCallbacks[id], callback(error, void 0);
            else throw Error(`No callback found for response with id ${id}`);
        }
    }
    let loader_runner_worker = function(workerOptions) {
        var workerPort, workerSyncPort, sendRequest, workerSyncPort1;
        let sendRequest1, workerData = workerOptions.workerData;
        delete workerOptions.workerData, workerData.workerPort.on("message", handleIncomingResponses);
        let sendRequest2 = (workerPort = workerData.workerPort, workerSyncPort = workerData.workerSyncPort, (sendRequest1 = (requestType, ...args)=>{
            let id = nextId++;
            workerPort.postMessage({
                type: "request",
                id,
                requestType,
                data: args
            });
            let result = new Promise((resolve, reject)=>{
                responseCallbacks[id] = (err, data)=>{
                    err ? reject(err) : resolve(data);
                };
            });
            return result.wait = ()=>sendRequest1.sync("WaitForPendingRequest", id), result.id = id, result;
        }).sync = (workerSyncPort1 = workerSyncPort, (requestType, ...args)=>{
            let id = nextId++, sharedBuffer = new SharedArrayBuffer(8), sharedBufferView = new Int32Array(sharedBuffer);
            workerSyncPort1.postMessage({
                type: "request-sync",
                id,
                requestType,
                data: args,
                sharedBuffer
            });
            let status = Atomics.wait(sharedBufferView, 0, 0);
            if ("ok" !== status && "not-equal" !== status) throw Error(`Internal error: Atomics.wait() failed: ${status}`);
            let { message } = (0, external_node_worker_threads_namespaceObject.receiveMessageOnPort)(workerSyncPort1);
            if (id !== message.id) throw Error(`Unexpected response id: ${message.id}, expected: ${id}`);
            if (isWorkerResponseMessage(message)) return message.data;
            throw message.error;
        }), sendRequest1), waitFor = (sendRequest = sendRequest2, (requests)=>sendRequest.sync("WaitForPendingRequest", (Array.isArray(requests) ? requests : [
                requests
            ]).map((request)=>request.id)));
        loaderImpl(workerOptions, sendRequest2, waitFor).then(async (data)=>{
            workerData.workerPort.postMessage({
                type: "done",
                data
            });
        }).catch(async (err)=>{
            workerData.workerPort.postMessage({
                type: "done-error",
                error: serializeError(err)
            });
        });
    };
})(), exports.default = __webpack_exports__.default, __webpack_exports__)-1 === [
    "default"
].indexOf(__rspack_i) && (exports[__rspack_i] = __webpack_exports__[__rspack_i]);
Object.defineProperty(exports, '__esModule', {
    value: !0
});

module.exports = __webpack_exports__.default;