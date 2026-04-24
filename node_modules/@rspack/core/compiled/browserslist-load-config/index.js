/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 24:
/***/ ((module) => {

module.exports = require("node:fs");

/***/ }),

/***/ 760:
/***/ ((module) => {

module.exports = require("node:path");

/***/ }),

/***/ 867:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {


var __nested_webpack_require_18__ = {};
(()=>{
    __nested_webpack_require_18__.n = (module)=>{
        var getter = module && module.__esModule ? ()=>module['default'] : ()=>module;
        __nested_webpack_require_18__.d(getter, {
            a: getter
        });
        return getter;
    };
})();
(()=>{
    __nested_webpack_require_18__.d = (exports1, definition)=>{
        for(var key in definition)if (__nested_webpack_require_18__.o(definition, key) && !__nested_webpack_require_18__.o(exports1, key)) Object.defineProperty(exports1, key, {
            enumerable: true,
            get: definition[key]
        });
    };
})();
(()=>{
    __nested_webpack_require_18__.o = (obj, prop)=>Object.prototype.hasOwnProperty.call(obj, prop);
})();
(()=>{
    __nested_webpack_require_18__.r = (exports1)=>{
        if ('undefined' != typeof Symbol && Symbol.toStringTag) Object.defineProperty(exports1, Symbol.toStringTag, {
            value: 'Module'
        });
        Object.defineProperty(exports1, '__esModule', {
            value: true
        });
    };
})();
var __nested_webpack_exports__ = {};
__nested_webpack_require_18__.r(__nested_webpack_exports__);
__nested_webpack_require_18__.d(__nested_webpack_exports__, {
    loadConfig: ()=>loadConfig,
    findConfig: ()=>findConfig
});
const external_node_fs_namespaceObject = __nccwpck_require__(24);
var external_node_fs_default = /*#__PURE__*/ __nested_webpack_require_18__.n(external_node_fs_namespaceObject);
const external_node_path_namespaceObject = __nccwpck_require__(760);
var external_node_path_default = /*#__PURE__*/ __nested_webpack_require_18__.n(external_node_path_namespaceObject);
function _define_property(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}
class BrowserslistError extends Error {
    constructor(message){
        super(message), _define_property(this, "browserslist", void 0);
        this.name = 'BrowserslistError';
        this.browserslist = true;
        if (Error.captureStackTrace) Error.captureStackTrace(this, BrowserslistError);
    }
}
const isFileCache = {};
function isFile(file) {
    if (file in isFileCache) return isFileCache[file];
    const result = external_node_fs_default().existsSync(file) && external_node_fs_default().statSync(file).isFile();
    isFileCache[file] = result;
    return result;
}
function check(section) {
    const FORMAT = 'Browserslist config should be a string or an array of strings with browser queries';
    if (Array.isArray(section)) {
        for(let i = 0; i < section.length; i++)if ('string' != typeof section[i]) throw new BrowserslistError(FORMAT);
    } else if ('string' != typeof section) throw new BrowserslistError(FORMAT);
}
function parsePackage(file) {
    const config = JSON.parse(external_node_fs_default().readFileSync(file).toString().replace(/^\uFEFF/m, ''));
    if (config.browserlist && !config.browserslist) throw new BrowserslistError(`\`browserlist\` key instead of \`browserslist\` in ${file}`);
    let list = config.browserslist;
    if (Array.isArray(list)) list = {
        defaults: list
    };
    if ('string' == typeof list) list = parseConfig(list);
    for(const i in list)check(list[i]);
    return list;
}
const IS_SECTION = /^\s*\[(.+)]\s*$/;
function parseConfig(string) {
    const result = {
        defaults: []
    };
    let sections = [
        'defaults'
    ];
    string.toString().replace(/#[^\n]*/g, '').split(/\n|,/).map((line)=>line.trim()).filter((line)=>'' !== line).forEach((line)=>{
        const matched = line.match(IS_SECTION);
        if (matched) {
            sections = matched[1].trim().split(' ');
            sections.forEach((section)=>{
                if (result[section]) throw new BrowserslistError(`Duplicate section ${section} in Browserslist config`);
                result[section] = [];
            });
        } else sections.forEach((section)=>{
            result[section].push(line);
        });
    });
    return result;
}
function readConfig(file) {
    if (!isFile(file)) throw new BrowserslistError(`Can't read ${file} config`);
    return parseConfig(external_node_fs_default().readFileSync(file, 'utf-8'));
}
function parsePackageOrReadConfig(file) {
    if ('package.json' === external_node_path_default().basename(file)) return parsePackage(file);
    return readConfig(file);
}
function pickEnv(config, opts) {
    if ('object' != typeof config) return config;
    let name;
    name = 'string' == typeof opts.env ? opts.env : process.env.BROWSERSLIST_ENV ? process.env.BROWSERSLIST_ENV : process.env.NODE_ENV ? process.env.NODE_ENV : 'production';
    return config[name] || config.defaults;
}
function eachParent(file, callback) {
    const dir = isFile(file) ? external_node_path_default().dirname(file) : file;
    let loc = external_node_path_default().resolve(dir);
    do {
        const result = callback(loc);
        if (void 0 !== result) return result;
    }while (loc !== (loc = external_node_path_default().dirname(loc)));
}
function findConfigFile(from) {
    return eachParent(from, (dir)=>{
        const config = external_node_path_default().join(dir, 'browserslist');
        const pkg = external_node_path_default().join(dir, 'package.json');
        const rc = external_node_path_default().join(dir, '.browserslistrc');
        let pkgBrowserslist;
        if (isFile(pkg)) try {
            pkgBrowserslist = parsePackage(pkg);
        } catch (e) {
            if (e instanceof BrowserslistError) throw e;
            console.warn(`[Browserslist] Could not parse ${pkg}. Ignoring it.`);
        }
        if (isFile(config) && pkgBrowserslist) throw new BrowserslistError(`${dir} contains both browserslist and package.json with browsers`);
        if (isFile(rc) && pkgBrowserslist) throw new BrowserslistError(`${dir} contains both .browserslistrc and package.json with browsers`);
        if (isFile(config) && isFile(rc)) throw new BrowserslistError(`${dir} contains both .browserslistrc and browserslist`);
        if (isFile(config)) return config;
        if (isFile(rc)) return rc;
        if (pkgBrowserslist) return pkg;
    });
}
const configCache = {};
function findConfig(from) {
    from = external_node_path_default().resolve(from);
    const fromDir = isFile(from) ? external_node_path_default().dirname(from) : from;
    if (fromDir in configCache) return configCache[fromDir];
    let resolved;
    const configFile = findConfigFile(from);
    if (configFile) resolved = parsePackageOrReadConfig(configFile);
    const configDir = configFile && external_node_path_default().dirname(configFile);
    eachParent(from, (dir)=>{
        if (resolved) configCache[dir] = resolved;
        if (dir === configDir) return null;
    });
    return resolved;
}
function loadConfig(opts) {
    if (opts.config) return pickEnv(parsePackageOrReadConfig(opts.config), opts);
    if (opts.path) {
        const config = findConfig(opts.path);
        if (!config) return;
        return pickEnv(config, opts);
    }
}
exports.findConfig = __nested_webpack_exports__.findConfig;
exports.loadConfig = __nested_webpack_exports__.loadConfig;
for(var __webpack_i__ in __nested_webpack_exports__)if (-1 === [
    "findConfig",
    "loadConfig"
].indexOf(__webpack_i__)) exports[__webpack_i__] = __nested_webpack_exports__[__webpack_i__];
Object.defineProperty(exports, "__esModule", ({
    value: true
}));


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(867);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;