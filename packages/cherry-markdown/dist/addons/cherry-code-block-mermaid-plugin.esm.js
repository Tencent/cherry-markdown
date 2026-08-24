//#region src/utils/toolkit/isPlainObject.js
function e(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
//#endregion
//#region src/utils/toolkit/mergeWith.js
function t(n, r, i) {
	if (typeof r != "object" || !r) return;
	let a = Object.keys(r);
	for (let o = 0; o < a.length; o++) {
		let s = a[o], c = r[s], l = n[s];
		if (i) {
			let e = i(l, c, s, n, r);
			if (e !== void 0) {
				n[s] = e;
				continue;
			}
		}
		c !== void 0 && (e(l) && e(c) || Array.isArray(l) && Array.isArray(c) ? t(l, c, i) : n[s] = c);
	}
}
function n(e, ...n) {
	let r;
	typeof n[n.length - 1] == "function" && (r = n.pop());
	for (let i = 0; i < n.length; i++) {
		let a = n[i];
		typeof a == "object" && a && t(e, a, r);
	}
	return e;
}
//#endregion
//#region src/utils/env.js
function r() {
	return typeof window == "object";
}
//#endregion
//#region src/utils/external.js
function i(e, t) {
	if (t !== void 0) return t;
	if (r()) return window[e];
}
//#endregion
//#region src/utils/dom.js
function a(e, t) {
	return new Promise((n, r) => {
		if (document.getElementById(t)) {
			n();
			return;
		}
		let i = document.createElement("script");
		i.src = e, i.async = !0, i.onload = n, i.onerror = r, document.head.appendChild(i);
	});
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/typeof.js
function o(e) {
	"@babel/helpers - typeof";
	return o = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, o(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/toPrimitive.js
function s(e, t) {
	if (o(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (o(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/toPropertyKey.js
function c(e) {
	var t = s(e, "string");
	return o(t) == "symbol" ? t : t + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/defineProperty.js
function l(e, t, n) {
	return (t = c(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/objectSpread2.js
function u(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function d(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? u(Object(n), !0).forEach(function(t) {
			l(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : u(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
//#endregion
//#region src/addons/cherry-code-block-mermaid-plugin.js
var f = [
	"flowchart",
	"sequence",
	"gantt",
	"journey",
	"timeline",
	"class",
	"state",
	"er",
	"pie",
	"quadrantChart",
	"xyChart",
	"requirement",
	"architecture",
	"mindmap",
	"kanban",
	"gitGraph",
	"c4",
	"sankey",
	"packet",
	"block",
	"radar"
], p = {
	theme: "default",
	altFontFamily: "sans-serif",
	fontFamily: "sans-serif",
	themeCSS: ".label foreignObject { font-size: 90%; overflow: visible; } .label { font-family: sans-serif; }",
	startOnLoad: !1,
	logLevel: "fatal"
};
f.forEach((e) => {
	p[e] = { useMaxWidth: !1 };
});
var m = class e {
	static install(t, ...r) {
		n(t, { engine: { syntax: { codeBlock: { customRenderer: { mermaid: new e(...r) } } } } });
	}
	$getContentCacheKey(e, t) {
		var n, r;
		return (n = t == null || (r = t.hash) == null ? void 0 : r.call(t, e)) == null ? e : n;
	}
	$getCachedRenderHtml(e, t) {
		return this.contentRenderCache.get(this.$getContentCacheKey(e, t)) || "";
	}
	$setCachedRenderHtml(e, t, n) {
		if (!n || !n.includes("<svg") && !n.includes("svg-img")) return;
		let r = this.$getContentCacheKey(e, t);
		if (this.contentRenderCache.size >= this.contentRenderCacheMax) {
			let e = this.contentRenderCache.keys().next().value;
			this.contentRenderCache.delete(e);
		}
		this.contentRenderCache.set(r, n);
	}
	constructor(e = {}) {
		l(this, "mermaidAPIRefs", null), l(this, "options", p), l(this, "dom", null), l(this, "mermaidCanvas", null), l(this, "lastRenderedCode", ""), l(this, "needReturnLastRenderedCode", !1), l(this, "contentRenderCache", /* @__PURE__ */ new Map()), l(this, "contentRenderCacheMax", 100), l(this, "maxConcurrentRender", 1), l(this, "activeRenderCount", 0), l(this, "pendingRenderQueue", []);
		let { mermaid: t, mermaidAPI: n } = e;
		this.hasExplicitMermaid = !!(t || n), this.mermaidScriptLoading = !1, this.mermaidScriptLoaded = !1;
		let r = i("mermaid"), a = i("mermaidAPI"), o = t || r, s = n || a || o && o.mermaidAPI || null;
		if (this.options = d(d({}, p), e), delete this.options.mermaid, delete this.options.mermaidAPI, !r && !s) {
			this.mermaidAPIRefs = null;
			return;
		}
		s ? (this.mermaidAPIRefs = s, this.isAsyncRenderVersion() && (this.mermaidAPIRefs = r || this.mermaidAPIRefs)) : this.mermaidAPIRefs = r, this.mermaidAPIRefs.initialize(this.options);
	}
	isAsyncRenderVersion() {
		return !this.mermaidAPIRefs || !this.mermaidAPIRefs.render || this.mermaidAPIRefs.render.length <= 3;
	}
	mountMermaidCanvas(e) {
		this.mermaidCanvas && document.body.contains(this.mermaidCanvas) || (this.mermaidCanvas = document.createElement("div"), this.mermaidCanvas.style = "width:1024px;opacity:0;position:fixed;top:100%;", (this.options.mermaidCanvasAppendDom || e.$cherry.wrapperDom || document.body).appendChild(this.mermaidCanvas));
	}
	createAsyncRenderCanvas(e) {
		let t = document.createElement("div");
		return t.style = "width:1024px;opacity:0;position:fixed;top:100%;", (this.options.mermaidCanvasAppendDom || e.$cherry.wrapperDom || document.body).appendChild(t), t;
	}
	destroyAsyncRenderCanvas(e) {
		e && e.parentNode && e.parentNode.removeChild(e);
	}
	acquireRenderSlot() {
		return this.activeRenderCount < this.maxConcurrentRender ? (this.activeRenderCount += 1, Promise.resolve()) : new Promise((e) => {
			this.pendingRenderQueue.push(e);
		});
	}
	releaseRenderSlot() {
		if (this.pendingRenderQueue.length > 0) {
			this.pendingRenderQueue.shift()();
			return;
		}
		this.activeRenderCount = Math.max(0, this.activeRenderCount - 1);
	}
	convertMermaidSvgToImg(e, t, n = !1) {
		let r = new DOMParser(), i, a = (e) => e.replace("<svg ", "<svg style=\"max-width:100%;height:auto;font-family:sans-serif;\" ");
		try {
			let o = r.parseFromString(e, "image/svg+xml"), s = o.documentElement;
			if (s.tagName.toLowerCase() === "svg") {
				s.style.maxWidth = "100%", s.style.height = "auto", s.style.fontFamily = "sans-serif";
				let e = document.getElementById(t).getBBox();
				s.hasAttribute("viewBox") ? e = s.viewBox.baseVal : s.setAttribute("viewBox", `0 0 ${e.width} ${e.height}`), s.getAttribute("width") === "100%" && s.setAttribute("width", `${e.width}`), s.getAttribute("height") === "100%" && s.setAttribute("height", `${e.height}`), i = o.documentElement.outerHTML, n && (i = `<img class="svg-img" style="max-width:100%;height:auto;" src="${`data:image/svg+xml,${encodeURIComponent(o.documentElement.outerHTML)}`}" alt="${t}" />`);
			} else i = a(e);
		} catch (t) {
			i = a(e);
		}
		return i;
	}
	processSvgCode(e, t, n = !1) {
		let r = e.replace(/\s*markerUnits="0"/g, "").replace(/\s*x="NaN"/g, "").replace(/<br>/g, "<br/>");
		return this.convertMermaidSvgToImg(r, t, n);
	}
	syncRender(e, t, n, r, i = !1) {
		let a;
		try {
			this.mermaidAPIRefs.render(e, t, (t) => {
				a = this.processSvgCode(t, e, i);
			}, this.mermaidCanvas), this.lastRenderedCode = a, this.$setCachedRenderHtml(t, r, a);
		} catch (e) {
			return r.$cherry.options.engine.global.flowSessionContext && this.lastRenderedCode ? this.lastRenderedCode : e == null ? void 0 : e.str;
		}
		return a;
	}
	handleAsyncRenderDone(e, t, n, i, a) {
		i.updateCache(a);
		let o = n.$cherry.wrapperDom || document.body, s = i.showSourceToolbar;
		if (r()) {
			let e = o.querySelectorAll(`[data-sign="${t}"][data-type="codeBlock"]`);
			e == null || e.forEach((e) => {
				if (!e.closest("[data-mode=\"source\"]")) {
					if (s) {
						var t, n;
						let r = (t = e.parentElement) == null || (n = t.closest) == null || (n = n.call(t, "figure[data-type=\"mermaid\"]")) == null ? void 0 : n.querySelector(".cherry-mermaid-source-toolbar-panel[data-mode=\"preview\"]");
						if (r) {
							r.innerHTML = a;
							return;
						}
					}
					e.parentElement.innerHTML = a;
				}
			});
		}
		n.asyncRenderHandler.done(e, { replacer: (e) => {
			if (s) return e;
			let n = RegExp(`<div data-sign="${t}" data-type="codeBlock"[^>]*>.*?<\\/div>`, "g");
			return e.replace(n, a);
		} });
	}
	tryResolveMermaidAPIRefs() {
		if (this.mermaidAPIRefs) return !0;
		let e = i("mermaid"), t = i("mermaidAPI") || e && e.mermaidAPI || null;
		if (!e && !t) return !1;
		t ? (this.mermaidAPIRefs = t, this.isAsyncRenderVersion() && (this.mermaidAPIRefs = e || this.mermaidAPIRefs)) : this.mermaidAPIRefs = e;
		try {
			this.mermaidAPIRefs.initialize(this.options);
		} catch (e) {}
		return !0;
	}
	ensureMermaidLoaded(e) {
		var t;
		if (!r() || this.hasExplicitMermaid || this.mermaidAPIRefs) return !1;
		if (this.mermaidScriptLoading || this.mermaidScriptLoaded) return !0;
		let n = e == null || (t = e.mermaidConfig) == null ? void 0 : t.src;
		return !n || typeof n != "string" ? !1 : (this.mermaidScriptLoading = !0, a(n, "cherry-mermaid-external-script").then(() => {
			this.mermaidScriptLoaded = !0, this.mermaidScriptLoading = !1, this.tryResolveMermaidAPIRefs();
		}).catch(() => {
			this.mermaidScriptLoading = !1;
		}), !0);
	}
	asyncRender(e, t, n, r, i, a = 0) {
		var o, s;
		let c = a === 0 ? this.$getCachedRenderHtml(t, r) : "";
		if (c) return c;
		if (!this.mermaidAPIRefs && !this.tryResolveMermaidAPIRefs()) {
			if (this.ensureMermaidLoaded(i), a === 0 && r.asyncRenderHandler.add(e), a < 60) setTimeout(() => {
				this.asyncRender(e, t, n, r, i, a + 1);
			}, 300);
			else {
				let t = i.fallback();
				throw this.handleAsyncRenderDone(e, n, r, i, t), Error("code-block-mermaid-plugin[init]: Package mermaid or mermaidAPI not found.");
			}
			return i.fallback();
		}
		a === 0 && r.asyncRenderHandler.add(e);
		let l = (o = i == null || (s = i.mermaidConfig) == null ? void 0 : s.svg2img) != null && o;
		return this.acquireRenderSlot().then(() => {
			let a = this.createAsyncRenderCanvas(r);
			this.mermaidAPIRefs.render(e, t, a).then(({ svg: a }) => {
				let o = this.processSvgCode(a, e, l);
				this.lastRenderedCode = o, this.$setCachedRenderHtml(t, r, o), this.handleAsyncRenderDone(e, n, r, i, o);
			}).catch(() => {
				if (r.$cherry.options.engine.global.flowSessionContext && this.lastRenderedCode && r.$cherry.status.editor === "hide") this.needReturnLastRenderedCode = !0;
				else {
					this.needReturnLastRenderedCode = !1;
					let t = i.fallback();
					this.handleAsyncRenderDone(e, n, r, i, t);
				}
			}).finally(() => {
				this.destroyAsyncRenderCanvas(a), this.releaseRenderSlot();
			});
		}), this.needReturnLastRenderedCode ? this.lastRenderedCode : i.fallback();
	}
	render(e, t, n, r = {}) {
		var i, a;
		let o = t;
		o || (o = Math.round(Math.random() * 1e8));
		let s = this.$getCachedRenderHtml(e, n);
		if (s) return s;
		this.mountMermaidCanvas(n);
		let c = `mermaid-${t}-${(/* @__PURE__ */ new Date()).getTime()}`, l = (i = (a = r.mermaidConfig) == null ? void 0 : a.svg2img) != null && i;
		return this.isAsyncRenderVersion() ? this.asyncRender(c, e, o, n, r) : this.syncRender(c, e, o, n, l);
	}
};
l(m, "TYPE", "figure");
//#endregion
export { m as default };
