"use strict";
var __webpack_require__ = {};
__webpack_require__.d = (exports1, definition)=>{
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
function normalizeUrl(url) {
    let urlString = url.trim();
    if (/^data:/i.test(urlString)) return urlString;
    let protocol = -1 !== urlString.indexOf("//") ? `${urlString.split("//")[0]}//` : "", components = urlString.replace(RegExp(protocol, "i"), "").split("/"), host = components[0].toLowerCase().replace(/\.$/, "");
    return components[0] = "", protocol + host + components.reduce((accumulator, item)=>{
        switch(item){
            case "..":
                accumulator.pop();
                break;
            case ".":
                break;
            default:
                accumulator.push(item);
        }
        return accumulator;
    }, []).join("/");
}
__webpack_require__.r(__webpack_exports__), __webpack_require__.d(__webpack_exports__, {
    cssReload: ()=>cssReload,
    normalizeUrl: ()=>normalizeUrl
});
const srcByModuleId = Object.create(null), noDocument = "undefined" == typeof document, { forEach } = Array.prototype;
function noop() {}
function updateCss(el, url) {
    let normalizedUrl;
    if (url) normalizedUrl = url;
    else {
        let href = el.getAttribute("href");
        if (!href) return;
        normalizedUrl = href.split("?")[0];
    }
    if (!isUrlRequest(el.href) || !1 === el.isLoaded || !normalizedUrl || !(normalizedUrl.indexOf(".css") > -1)) return;
    el.visited = !0;
    let newEl = el.cloneNode();
    newEl.isLoaded = !1, newEl.addEventListener("load", ()=>{
        !newEl.isLoaded && (newEl.isLoaded = !0, el.parentNode && el.parentNode.removeChild(el));
    }), newEl.addEventListener("error", ()=>{
        !newEl.isLoaded && (newEl.isLoaded = !0, el.parentNode && el.parentNode.removeChild(el));
    }), newEl.href = `${normalizedUrl}?${Date.now()}`;
    let parent = el.parentNode;
    parent && (el.nextSibling ? parent.insertBefore(newEl, el.nextSibling) : parent.appendChild(newEl));
}
function reloadAll() {
    let elements = document.querySelectorAll("link");
    forEach.call(elements, (el)=>{
        !0 !== el.visited && updateCss(el);
    });
}
function isUrlRequest(url) {
    return !!/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(url);
}
function cssReload(moduleId, options) {
    var fn;
    let timeout;
    if (noDocument) return console.log("[HMR] No `window.document` found, CSS HMR disabled"), noop;
    let getScriptSrc = function(moduleId) {
        let src = srcByModuleId[moduleId];
        if (!src) {
            if (document.currentScript) ({ src } = document.currentScript);
            else {
                let scripts = document.getElementsByTagName("script"), lastScriptTag = scripts[scripts.length - 1];
                lastScriptTag && ({ src } = lastScriptTag);
            }
            srcByModuleId[moduleId] = src;
        }
        return (fileMap)=>{
            if (!src) return null;
            let splitResult = src.match(/([^\\/]+)\.js$/), filename = splitResult && splitResult[1];
            return filename && fileMap ? fileMap.split(",").map((mapRule)=>{
                let reg = RegExp(`${filename}\\.js$`, "g");
                return normalizeUrl(src.replace(reg, `${mapRule.replace(/{fileName}/g, filename)}.css`));
            }) : [
                src.replace(".js", ".css")
            ];
        };
    }(moduleId);
    return fn = function() {
        let src = getScriptSrc(options.filename), reloaded = function(src) {
            if (!src) return !1;
            let elements = document.querySelectorAll("link"), loaded = !1;
            return forEach.call(elements, (el)=>{
                var href;
                let ret, normalizedHref;
                if (!el.href) return;
                let url = (href = el.href, ret = "", normalizedHref = normalizeUrl(href), src.some((url)=>{
                    normalizedHref.indexOf(src) > -1 && (ret = url);
                }), ret);
                !isUrlRequest(url) || !0 !== el.visited && url && (updateCss(el, url), loaded = !0);
            }), loaded;
        }(src);
        if (options.locals) {
            console.log("[HMR] Detected local CSS Modules. Reload all CSS"), reloadAll();
            return;
        }
        reloaded ? console.log("[HMR] CSS reload %s", src && src.join(" ")) : (console.log("[HMR] Reload all CSS"), reloadAll());
    }, timeout = 0, function(...args) {
        let self = this;
        clearTimeout(timeout), timeout = setTimeout(function() {
            return fn.apply(self, args);
        }, 50);
    };
}
for(var __rspack_i in exports.cssReload = __webpack_exports__.cssReload, exports.normalizeUrl = __webpack_exports__.normalizeUrl, __webpack_exports__)-1 === [
    "cssReload",
    "normalizeUrl"
].indexOf(__rspack_i) && (exports[__rspack_i] = __webpack_exports__[__rspack_i]);
Object.defineProperty(exports, '__esModule', {
    value: !0
});
