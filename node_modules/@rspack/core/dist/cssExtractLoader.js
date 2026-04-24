"use strict";
var __webpack_require__ = {};
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
__webpack_require__.r(__webpack_exports__), __webpack_require__.d(__webpack_exports__, {
    hotLoader: ()=>hotLoader,
    default: ()=>css_extract_loader,
    ABSOLUTE_PUBLIC_PATH: ()=>ABSOLUTE_PUBLIC_PATH,
    MODULE_TYPE: ()=>MODULE_TYPE,
    AUTO_PUBLIC_PATH: ()=>AUTO_PUBLIC_PATH,
    pitch: ()=>pitch,
    SINGLE_DOT_PATH_SEGMENT: ()=>SINGLE_DOT_PATH_SEGMENT,
    BASE_URI: ()=>BASE_URI
});
const external_node_path_namespaceObject = require("node:path");
var external_node_path_default = __webpack_require__.n(external_node_path_namespaceObject);
function isAbsolutePath(str) {
    return external_node_path_default().posix.isAbsolute(str) || external_node_path_default().win32.isAbsolute(str);
}
const PLUGIN_NAME = "css-extract-rspack-plugin", RELATIVE_PATH_REGEXP = /^\.\.?[/\\]/, BASE_URI = "rspack-css-extract://", MODULE_TYPE = "css/mini-extract", AUTO_PUBLIC_PATH = "__css_extract_public_path_auto__", ABSOLUTE_PUBLIC_PATH = `${BASE_URI}/css-extract-plugin/`, SINGLE_DOT_PATH_SEGMENT = "__css_extract_single_dot_path_segment__";
function hotLoader(content, context) {
    let localsJsonString = JSON.stringify(JSON.stringify(context.locals));
    return `${content}
    if(module.hot) {
      (function() {
        var localsJsonString = ${localsJsonString};
        // ${Date.now()}
        var cssReload = require(${function(loaderContext, request) {
        if (void 0 !== loaderContext.utils && "function" == typeof loaderContext.utils.contextify) return JSON.stringify(loaderContext.utils.contextify(loaderContext.context || loaderContext.rootContext, request));
        let splitted = request.split("!"), { context } = loaderContext;
        return JSON.stringify(splitted.map((part)=>{
            let splittedPart = part.match(/^(.*?)(\?.*)/), query = splittedPart ? splittedPart[2] : "", singlePath = splittedPart ? splittedPart[1] : part;
            if (isAbsolutePath(singlePath) && context) {
                var str;
                if (isAbsolutePath(singlePath = external_node_path_default().relative(context, singlePath))) return singlePath + query;
                str = singlePath, RELATIVE_PATH_REGEXP.test(str) || (singlePath = `./${singlePath}`);
            }
            return singlePath.replace(/\\/g, "/") + query;
        }).join("!"));
    }(context.loaderContext, external_node_path_default().join(__dirname, "cssExtractHmr.js"))}).cssReload(module.id, ${JSON.stringify(context.options ?? {})});
        // only invalidate when locals change
        if (
          module.hot.data &&
          module.hot.data.value &&
          module.hot.data.value !== localsJsonString
        ) {
          module.hot.invalidate();
        } else {
          module.hot.accept();
        }
        module.hot.dispose(function(data) {
          data.value = localsJsonString;
          cssReload();
        });
      })();
    }
  `;
}
const pitch = function(request, _, data) {
    let publicPathForExtract;
    if (this._compiler?.options?.experiments?.css && this._module && ("css" === this._module.type || "css/auto" === this._module.type || "css/global" === this._module.type || "css/module" === this._module.type)) {
        let e = Error("use type 'css' and `CssExtractRspackPlugin` together, please set `experiments.css` to `false` or set `{ type: \"javascript/auto\" }` for rules with `CssExtractRspackPlugin` in your rspack config (now `CssExtractRspackPlugin` does nothing).");
        e.stack = void 0, this.emitWarning(e);
        return;
    }
    let options = this.getOptions(), emit = void 0 === options.emit || options.emit, callback = this.async(), filepath = this.resourcePath;
    this.addDependency(filepath);
    let { publicPath } = this._compilation.outputOptions;
    "string" == typeof options.publicPath ? publicPath = options.publicPath : "function" == typeof options.publicPath && (publicPath = options.publicPath(this.resourcePath, this.rootContext)), "auto" === publicPath && (publicPath = AUTO_PUBLIC_PATH), publicPathForExtract = "string" == typeof publicPath ? /^[a-zA-Z][a-zA-Z\d+\-.]*?:/.test(publicPath) ? publicPath : `${ABSOLUTE_PUBLIC_PATH}${publicPath.replace(/\./g, SINGLE_DOT_PATH_SEGMENT)}` : publicPath;
    let handleExports = (originalExports)=>{
        let locals, namedExport, esModule = void 0 === options.esModule || options.esModule, dependencies = [];
        try {
            let exports1 = originalExports.__esModule ? originalExports.default : originalExports;
            if (namedExport = originalExports.__esModule && (!originalExports.default || !("locals" in originalExports.default))) for (let key of Object.keys(originalExports))"default" !== key && (locals || (locals = {}), locals[key] = originalExports[key]);
            else locals = exports1?.locals;
            if (Array.isArray(exports1) && emit) {
                let identifierCountMap = new Map();
                dependencies = exports1.map(([id, content, media, sourceMap, supports, layer])=>{
                    let context = this.rootContext, count = identifierCountMap.get(id) || 0;
                    return identifierCountMap.set(id, count + 1), {
                        identifier: id,
                        context,
                        content,
                        media,
                        supports,
                        layer,
                        identifierIndex: count,
                        sourceMap: sourceMap ? JSON.stringify(sourceMap) : void 0,
                        filepath
                    };
                }).filter((item)=>null !== item);
            }
        } catch (e) {
            callback(e);
            return;
        }
        let result = function() {
            if (locals) {
                if (namedExport) {
                    let identifiers = Array.from(function*() {
                        let identifierId = 0;
                        for (let key of Object.keys(locals))identifierId += 1, yield [
                            `_${identifierId.toString(16)}`,
                            key
                        ];
                    }()), localsString = identifiers.map(([id, key])=>{
                        var value;
                        return `\nvar ${id} = ${"function" == typeof (value = locals[key]) ? value.toString() : JSON.stringify(value)};`;
                    }).join(""), exportsString = `export { ${identifiers.map(([id, key])=>`${id} as ${JSON.stringify(key)}`).join(", ")} }`;
                    return void 0 !== options.defaultExport && options.defaultExport ? `${localsString}\n${exportsString}\nexport default { ${identifiers.map(([id, key])=>`${JSON.stringify(key)}: ${id}`).join(", ")} }\n` : `${localsString}\n${exportsString}\n`;
                }
                return `\n${esModule ? "export default" : "module.exports = "} ${JSON.stringify(locals)};`;
            }
            return esModule ? "\nexport {};" : "";
        }(), resultSource = `// extracted by ${PLUGIN_NAME}`;
        resultSource += this.hot && emit ? hotLoader(result, {
            loaderContext: this,
            options,
            locals: locals
        }) : result, dependencies.length > 0 && this.__internal__setParseMeta(PLUGIN_NAME, JSON.stringify(dependencies)), callback(null, resultSource, void 0, data);
    };
    this.importModule(`${this.resourcePath}.rspack[javascript/auto]!=!!!${request}`, {
        layer: options.layer,
        publicPath: publicPathForExtract,
        baseUri: `${BASE_URI}/`
    }, (error, exports1)=>{
        error ? callback(error) : handleExports(exports1);
    });
}, css_extract_loader = function(content) {
    if (this._compiler?.options?.experiments?.css && this._module && ("css" === this._module.type || "css/auto" === this._module.type || "css/global" === this._module.type || "css/module" === this._module.type)) return content;
};
for(var __rspack_i in exports.ABSOLUTE_PUBLIC_PATH = __webpack_exports__.ABSOLUTE_PUBLIC_PATH, exports.AUTO_PUBLIC_PATH = __webpack_exports__.AUTO_PUBLIC_PATH, exports.BASE_URI = __webpack_exports__.BASE_URI, exports.MODULE_TYPE = __webpack_exports__.MODULE_TYPE, exports.SINGLE_DOT_PATH_SEGMENT = __webpack_exports__.SINGLE_DOT_PATH_SEGMENT, exports.default = __webpack_exports__.default, exports.hotLoader = __webpack_exports__.hotLoader, exports.pitch = __webpack_exports__.pitch, __webpack_exports__)-1 === [
    "ABSOLUTE_PUBLIC_PATH",
    "AUTO_PUBLIC_PATH",
    "BASE_URI",
    "MODULE_TYPE",
    "SINGLE_DOT_PATH_SEGMENT",
    "default",
    "hotLoader",
    "pitch"
].indexOf(__rspack_i) && (exports[__rspack_i] = __webpack_exports__[__rspack_i]);
Object.defineProperty(exports, '__esModule', {
    value: !0
});
