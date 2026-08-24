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
//#region src/Logger.js
var r = new Proxy({}, { get(e, t, n) {
	return () => {};
} });
//#endregion
//#region src/utils/env.js
function i() {
	return typeof window == "object";
}
//#endregion
//#region src/utils/external.js
function a(e, t) {
	if (t !== void 0) return t;
	if (i()) return window[e];
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/objectWithoutPropertiesLoose.js
function o(e, t) {
	if (e == null) return {};
	var n = {};
	for (var r in e) if ({}.hasOwnProperty.call(e, r)) {
		if (t.includes(r)) continue;
		n[r] = e[r];
	}
	return n;
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/objectWithoutProperties.js
function s(e, t) {
	if (e == null) return {};
	var n, r, i = o(e, t);
	if (Object.getOwnPropertySymbols) {
		var a = Object.getOwnPropertySymbols(e);
		for (r = 0; r < a.length; r++) n = a[r], t.includes(n) || {}.propertyIsEnumerable.call(e, n) && (i[n] = e[n]);
	}
	return i;
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/typeof.js
function c(e) {
	"@babel/helpers - typeof";
	return c = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, c(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/toPrimitive.js
function l(e, t) {
	if (c(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (c(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/toPropertyKey.js
function u(e) {
	var t = l(e, "string");
	return c(t) == "symbol" ? t : t + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/defineProperty.js
function d(e, t, n) {
	return (t = u(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/objectSpread2.js
function f(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function p(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? f(Object(n), !0).forEach(function(t) {
			d(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : f(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/asyncToGenerator.js
function m(e, t, n, r, i, a, o) {
	try {
		var s = e[a](o), c = s.value;
	} catch (e) {
		n(e);
		return;
	}
	s.done ? t(c) : Promise.resolve(c).then(r, i);
}
function h(e) {
	return function() {
		var t = this, n = arguments;
		return new Promise(function(r, i) {
			var a = e.apply(t, n);
			function o(e) {
				m(a, r, i, o, s, "next", e);
			}
			function s(e) {
				m(a, r, i, o, s, "throw", e);
			}
			o(void 0);
		});
	};
}
//#endregion
//#region src/addons/advance/cherry-table-echarts-plugin.js
var g = [
	"echarts",
	"cherryOptions",
	"cherry"
], _ = {
	color: {
		tooltipTextLight: "#333",
		tooltipTextDark: "#ddd",
		emphasis: "#ff6b6b",
		error: "#ff4d4f"
	},
	shadow: {
		color: "rgba(0, 0, 0, 0.5)",
		blur: 10
	},
	fontSize: {
		base: 12,
		small: 10,
		title: 16
	}
}, v = {
	renderer: "svg",
	width: 500,
	height: 300
}, y = class e {
	static install(t, ...a) {
		if (!i()) {
			r.warn("echarts-table-engine only works in browser."), n(t, { engine: { syntax: { table: { enableChart: !1 } } } });
			return;
		}
		n(t, { engine: { syntax: { table: {
			enableChart: !0,
			chartRenderEngine: e,
			externals: ["echarts"]
		} } } });
	}
	constructor(e = {}) {
		let { echarts: t, cherryOptions: n, cherry: r } = e, i = s(e, g), o = a("echarts"), c = t || o;
		if (!c) {
			console.warn("table-echarts-plugin[init]: Package echarts not found."), this.echartsRef = !1;
			return;
		}
		this.options = p(p({}, v), i || {}), this.echartsRef = c, this.dom = null, this.cherryOptions = n, this.cherry = r, this.instances = /* @__PURE__ */ new Set(), this.themeObservers = /* @__PURE__ */ new Map(), this.themeRuntime = null, this.themeCache = /* @__PURE__ */ new Map(), this.exportObservers = /* @__PURE__ */ new Map(), this.$enableLocaleObserver();
	}
	isValid() {
		return !!this.echartsRef;
	}
	$palette(e = "default") {
		let t = [];
		switch (e) {
			case "radar":
				t = [
					"rgba(114, 172, 209, 0.2)",
					"rgba(114, 172, 209, 0.4)",
					"rgba(114, 172, 209, 0.6)",
					"rgba(114, 172, 209, 0.8)",
					"rgba(114, 172, 209, 1)"
				];
				break;
			case "heatmap":
				t = [
					"#313695",
					"#4575b4",
					"#74add1",
					"#abd9e9",
					"#e0f3f8",
					"#ffffcc",
					"#fee090",
					"#fdae61",
					"#f46d43",
					"#d73027",
					"#a50026"
				];
				break;
			case "sankey":
				t = [
					"#5070dd",
					"#b6d634",
					"#505372",
					"#ff994d",
					"#0ca8df",
					"#ffd10a",
					"#fb628b",
					"#785db0",
					"#3fbe95"
				];
				break;
			case "map":
				t = ["#e0ffff", "#006edd"];
				break;
			default: t = [
				"#5470c6",
				"#91cc75",
				"#fac858",
				"#ee6666",
				"#73c0de",
				"#3ba272",
				"#fc8452",
				"#9a60b4",
				"#ea7ccc"
			];
		}
		return t;
	}
	$grid(e = {}) {
		return p({
			containLabel: !0,
			left: "8%",
			right: "8%",
			bottom: "8%",
			top: "12%"
		}, e);
	}
	$axis(e = "value", t = {}) {
		return p({
			type: e,
			axisLine: { lineStyle: { color: this.$theme().color.text } },
			axisLabel: {
				color: this.$theme().color.text,
				fontSize: this.$theme().fontSize.base
			},
			splitLine: { lineStyle: {
				color: this.$theme().color.lineSplit,
				type: "dashed"
			} }
		}, t);
	}
	$dataZoom(e = !0, t = {}) {
		let n = [{
			type: "inside",
			xAxisIndex: [0],
			start: 0,
			end: 100
		}];
		return e && n.push({
			type: "slider",
			xAxisIndex: [0],
			bottom: "2%",
			start: 0,
			end: 100,
			height: 20
		}), n.map((e) => p(p({}, e), t));
	}
	$num(e) {
		let t = parseFloat(String(e == null ? "" : e).replace(/,/g, ""));
		return Number.isFinite(t) ? t : 0;
	}
	$baseSeries(e, t = {}) {
		let n = {
			animation: !0,
			animationDuration: 1e3,
			animationEasing: "elasticOut",
			animationDelay(e) {
				return e * 10;
			}
		}, r = {
			data: [],
			emphasis: {
				focus: "series",
				itemStyle: {
					shadowBlur: this.$theme().shadow.blur,
					shadowOffsetX: 0,
					shadowColor: this.$theme().shadow.color
				}
			}
		}, i = {
			bar: {
				type: "bar",
				label: {
					show: !1,
					position: "top",
					formatter: "{c}"
				}
			},
			line: {
				type: "line",
				symbol: "circle",
				symbolSize: 8,
				lineStyle: {
					width: 3,
					cap: "round",
					join: "round"
				},
				itemStyle: {
					borderWidth: 2,
					borderColor: "#fff"
				},
				smooth: .3,
				markPoint: { data: [{
					type: "max",
					name: this.cherry.locale.maxValue
				}, {
					type: "min",
					name: this.cherry.locale.minValue
				}] },
				emphasis: {
					focus: "series",
					lineStyle: { width: 5 },
					itemStyle: { borderWidth: 3 }
				}
			},
			scatter: { type: "scatter" },
			radar: { type: "radar" },
			heatmap: { type: "heatmap" },
			pie: { type: "pie" },
			sankey: { type: "sankey" }
		};
		return p(p(p(p({}, r), i[e]), n), t);
	}
	$dot(e) {
		return `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${e};"></span>`;
	}
	$tagEchartsSvg(e) {
		let t = e && e.querySelector && e.querySelector("svg");
		t && t.classList.add("echarts-svg");
	}
	cleanupInvalidInstances() {
		let e = [];
		this.instances.forEach((t) => {
			if (t.isDisposed && t.isDisposed()) {
				e.push(t);
				return;
			}
			let n = t.getDom && t.getDom();
			(!n || !n.isConnected) && e.push(t);
		}), e.forEach((e) => {
			e.isDisposed() || e.dispose(), this.instances.delete(e);
		}), e.length > 0 && r.info(`Cleaned up ${e.length} invalid chart instances`);
	}
	destroyChart(e) {
		let t = null, n = null;
		e && typeof e.getDom == "function" ? (n = e, t = n.getDom && n.getDom()) : e instanceof Element && (t = e, n = this.echartsRef.getInstanceByDom(t)), n && !n.isDisposed() && n.dispose(), n && this.instances.delete(n), !n && t && this.cleanupInvalidInstances();
	}
	createChart(e, t = {}, n) {
		if (!e) return null;
		let r = this.echartsRef.getInstanceByDom(e);
		return r || (r = this.echartsRef.init(e, null, this.options)), t && Object.keys(t).length && r.setOption(t, !0), this.instances.add(r), this.$tagEchartsSvg(e), this.$enableThemeObserver(e), this.$enableExportObserver(e), (n === "heatmap" || n === "pie") && this.addClickHighlightEffect(r, n), r;
	}
	$readCssVar(e, t, n) {
		try {
			return getComputedStyle(e).getPropertyValue(t).trim() || n;
		} catch (e) {
			return n;
		}
	}
	$extractThemeNameFromClassList(e) {
		try {
			let t = Array.from(e || []).find((e) => e.startsWith("theme__"));
			return t ? t.replace("theme__", "") : "default";
		} catch (e) {
			return "default";
		}
	}
	$themeCacheKey(e) {
		let t = e || this.$getCherryRoot() || document.body;
		return this.$extractThemeNameFromClassList(t && t.classList || []);
	}
	$buildEchartsThemeFromCss(e) {
		let t = e || this.$getCherryRoot(), r = this.$themeCacheKey(t);
		if (this.themeCache.has(r)) {
			let e = this.themeCache.get(r);
			this.themeRuntime = e.runtime;
			return;
		}
		let i = this.$readCssVar(t, "--primary-color", _.color.primary), a = this.$readCssVar(t, "--base-previewer-bg", this.$readCssVar(t, "--base-editor-bg", "transparent")), o = this.$readCssVar(t, "--base-font-color", _.color.text), s = this.$readCssVar(t, "--md-table-border", _.color.border), c = this.$readCssVar(t, "--md-hr-border", _.color.border), l = (() => {
			let e = String(a || "").toLowerCase();
			return e.includes("#0") || e.includes("#1") || e.includes("#2") || e.includes("#3");
		})(), u = {
			color: {
				primary: i,
				border: s,
				borderHover: s,
				text: o,
				tooltipText: l ? _.color.tooltipTextDark : _.color.tooltipTextLight,
				lineSplit: c,
				backgroundColor: a,
				tooltipBg: l ? a : "white",
				emphasis: _.color.emphasis
			},
			shadow: p({}, _.shadow),
			fontSize: p({}, _.fontSize)
		};
		n(u, _), this.themeRuntime = u, this.themeCache.set(r, { runtime: u });
	}
	$theme() {
		return this.themeRuntime;
	}
	$getCherryRoot(e = null) {
		if (e) {
			let t = e.closest(".cherry") || e.closest(".cherry-markdown");
			if (t) return t;
		}
		return document.querySelector(".cherry") || document.querySelector(".cherry-markdown") || document.body;
	}
	$enableThemeObserver(e) {
		let t = this.$getCherryRoot(e);
		if (!t || this.themeObservers.has(t)) return;
		let n = new MutationObserver(() => {
			this.$buildEchartsThemeFromCss(t), Array.from(this.instances).forEach((e) => {
				this.$applyThemeOnly(e);
			});
		});
		n.observe(t, {
			attributes: !0,
			attributeFilter: ["class"]
		}), this.themeObservers.set(t, n);
	}
	$setInstanceTheme(e) {
		if (!e || typeof e.getDom != "function") return;
		let t = e.getDom();
		if (!t) return;
		let n = this.$chartOptionsFromDataset(t) || {};
		e.setOption(n, !1, !0), this.$tagEchartsSvg(t);
	}
	$applyThemeOnly(e) {
		if (!e || typeof e.getDom != "function" || e.isDisposed && e.isDisposed()) return;
		let t = e.getDom();
		if (!t || !t.isConnected) return;
		let n = this.$theme();
		if (!n) return;
		let i = e.getOption ? e.getOption() : null;
		if (!i) return;
		let a = this.$buildThemeOnlyOption(i, n);
		try {
			e.setOption(a, !1, !0), this.$tagEchartsSvg(t);
		} catch (e) {
			r.warn("apply theme-only option failed:", e);
		}
	}
	$buildThemeOnlyOption(e, t) {
		let { color: n, fontSize: r } = t, i = (e) => Array.isArray(e) ? e : e ? [e] : [], a = {
			backgroundColor: n.backgroundColor,
			textStyle: { color: n.text }
		}, o = i(e.title);
		o.length && (a.title = o.map(() => ({
			textStyle: { color: n.tooltipText },
			subtextStyle: { color: n.text }
		}))), e.tooltip && (a.tooltip = {
			backgroundColor: n.tooltipBg,
			borderColor: n.border,
			textStyle: {
				color: n.tooltipText,
				fontSize: r.base
			}
		});
		let s = i(e.legend);
		s.length && (a.legend = s.map(() => ({
			textStyle: {
				color: n.text,
				fontSize: r.base
			},
			selectorLabel: {
				color: n.text,
				borderColor: n.border
			}
		})));
		let c = i(e.toolbox);
		c.length && (a.toolbox = c.map(() => ({
			iconStyle: { borderColor: n.border },
			emphasis: { iconStyle: { borderColor: n.borderHover } }
		})));
		let l = (e) => e.map(() => ({
			axisLine: { lineStyle: { color: n.text } },
			axisLabel: {
				color: n.text,
				fontSize: r.base
			},
			splitLine: { lineStyle: {
				color: n.lineSplit,
				type: "dashed"
			} },
			nameTextStyle: { color: n.text }
		})), u = i(e.xAxis);
		u.length && (a.xAxis = l(u));
		let d = i(e.yAxis);
		d.length && (a.yAxis = l(d));
		let f = i(e.visualMap);
		f.length && (a.visualMap = f.map(() => ({ textStyle: {
			color: n.text,
			fontSize: r.base
		} })));
		let p = i(e.radar);
		p.length && (a.radar = p.map(() => ({ axisName: { color: n.text } })));
		let m = i(e.series);
		return m.length && (a.series = m.map((e) => {
			let i = e && e.type, a = {
				label: { color: n.text },
				itemStyle: { shadowColor: t.shadow.color },
				emphasis: { itemStyle: {
					shadowColor: t.shadow.color,
					borderColor: n.emphasis
				} }
			};
			return i === "line" && (a.itemStyle.borderColor = "#fff"), i === "sankey" && (a.label = {
				color: n.text,
				fontSize: r.base
			}), a;
		})), a;
	}
	$generateChartOptions(e, t, n) {
		let r = {
			bar: w,
			line: C,
			radar: T,
			map: N,
			heatmap: E,
			pie: D,
			scatter: O,
			sankey: k
		}[e];
		return n.engine = this, r ? I(r, t, n) : {};
	}
	$chartOptionsFromDataset(e) {
		let t = e.getAttribute("data-chart-type"), n = e.getAttribute("data-table-data"), r = e.getAttribute("data-chart-options"), i = e.getAttribute("id"), a = null, o = {};
		try {
			a = n ? JSON.parse(n) : null;
		} catch (e) {
			a = null;
		}
		try {
			o = r ? JSON.parse(r) : {};
		} catch (e) {
			o = { chartId: i };
		}
		return !t || !a ? {} : (o.chartId = i, this.$generateChartOptions(t, a, o));
	}
	$rehydrateChartsForContainers(e, t) {
		e.forEach((e) => {
			if (!(e instanceof Element) || !e.isConnected) return;
			let t = e.getAttribute("data-chart-type"), n = this.$chartOptionsFromDataset(e);
			try {
				this.destroyChart(e), this.createChart(e, n, t);
			} catch (e) {
				r.warn("rehydrate (partial) chart failed:", e);
			}
		});
	}
	$rebuildAllCharts(e) {
		if (e) try {
			let t = /* @__PURE__ */ new Set(), n = e.querySelectorAll(".cherry-echarts-wrapper");
			n && n.length && Array.from(n).forEach((e) => t.add(e)), t.size && this.$rehydrateChartsForContainers(t, e);
		} catch (e) {
			r.warn("rehydrate charts failed:", e);
		}
	}
	$enableLocaleObserver() {
		this.cherry && this.cherry.$event && this.cherry.$event.on(this.cherry.$event.Events.afterChangeLocale, (e) => {
			setTimeout(() => {
				let e = this.$getCherryRoot();
				this.$rebuildAllCharts(e);
			}, 0);
		});
	}
	$enableExportObserver(e) {
		let t = this.$getCherryRoot(e);
		if (!t || this.exportObservers.has(t)) return;
		let n = () => {
			this.$rebuildAllCharts(t);
		};
		window.addEventListener("cherry:export:done", n), this.exportObservers.set(t, n);
	}
	render(e, t, n, r) {
		let i = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, a = JSON.stringify(n), o = JSON.stringify(t);
		t.chartId = i, this.$buildEchartsThemeFromCss();
		let s = this.$generateChartOptions(e, n, t), c = {
			width: `${this.options.width}px`,
			height: `${this.options.height}px`,
			"min-height": "300px",
			display: "block",
			position: "relative",
			border: "1px solid var(--md-table-border)"
		}, l = Object.entries(c).map(([e, t]) => `${e}: ${t};`).join(" "), u = (e) => String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"), d = [
			"<div class=\"cherry-echarts-wrapper\"",
			` style="${u(l)}"`,
			` id="${u(i)}"`,
			` data-chart-type="${u(e)}"`,
			` data-table-data="${u(a)}"`,
			` data-chart-options="${u(o)}">`,
			"</div>"
		].join(""), f = r.previewer.getDom();
		return setTimeout(() => {
			let t = f.querySelectorAll(`#${i}`);
			t.length <= 0 || !this.echartsRef || (t.forEach((t) => {
				try {
					this.createChart(t, s, e);
				} catch (e) {
					t.innerHTML = r.options.engine.syntax.global.flowSessionContext ? "drawing..." : `<div style="text-align: center; color: red; transform: translateY(125px);">
              <div style="font-size: ${this.$theme().fontSize.title}px; color: ${this.$theme().color.error};">${this.cherry.locale.chartRenderError}</div>
              <div style="font-size: ${this.$theme().fontSize.base}px; color: ${this.$theme().color.text}; opacity: 0.7;">${e.message}</div>
            </div>`;
				}
			}), this.cleanupInvalidInstances());
		}, 50), d;
	}
	addClickHighlightEffect(e, t) {
		let n = null;
		e.on("click", (i) => {
			if (r.log("Chart clicked:", i), n === i.dataIndex) {
				n = null, this.clearHighlight(e, t);
				return;
			}
			n = i.dataIndex;
		});
	}
	clearHighlight(e, t) {
		e.dispatchAction({
			type: "downplay",
			seriesIndex: 0
		});
		let n = e.getOption().series[0].data;
		n.forEach((e) => {
			e.itemStyle && (delete e.itemStyle.opacity, delete e.itemStyle.borderWidth, delete e.itemStyle.borderColor);
		}), e.setOption({ series: [{ data: n }] });
	}
	onDestroy() {
		if (this.cleanupInvalidInstances(), this.instances && this.instances.size > 0 && (this.instances.forEach((e) => {
			this.destroyChart(e);
		}), this.instances.clear()), this.themeObservers && this.themeObservers.size && (this.themeObservers.forEach((e) => {
			e.disconnect();
		}), this.themeObservers.clear()), this.exportObservers && this.exportObservers.size && (this.exportObservers.forEach((e) => {
			window.removeEventListener("cherry:export:done", e);
		}), this.exportObservers.clear()), this.dom) {
			let e = this.echartsRef.getInstanceByDom(this.dom);
			e && !e.isDisposed() && e.dispose(), this.dom = null;
		}
	}
}, b = {
	components: [{ options(e, t) {
		return t.title ? { title: {
			text: t.title.replace(/\s*,\s*$/, ""),
			left: "center",
			top: "bottom",
			textStyle: {
				color: t.engine.$theme().color.tooltipText,
				fontSize: 16
			}
		} } : {};
	} }],
	options(e, t) {
		let { engine: n } = t;
		return {
			aria: { enabled: !0 },
			backgroundColor: n.$theme().color.backgroundColor,
			color: n.$palette(),
			tooltip: {
				trigger: "item",
				backgroundColor: n.$theme().color.tooltipBg,
				borderColor: n.$theme().color.border,
				borderWidth: 1,
				textStyle: {
					color: n.$theme().color.tooltipText,
					fontSize: 12
				},
				extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-radius: 4px;"
			},
			toolbox: {
				show: !0,
				orient: "vertical",
				left: "right",
				top: "bottom",
				feature: { saveAsImage: {
					show: !0,
					title: n.cherry.locale.saveAsImage,
					type: n.options.renderer === "svg" ? "svg" : "png",
					backgroundColor: "#fff"
				} },
				iconStyle: { borderColor: n.$theme().color.border },
				emphasis: { iconStyle: { borderColor: n.$theme().color.borderHover } }
			}
		};
	}
}, x = { options(e, t) {
	let { engine: n } = t;
	return { legend: {
		type: "scroll",
		orient: "horizontal",
		left: "center",
		top: "top",
		textStyle: {
			color: n.$theme().color.text,
			fontSize: n.$theme().fontSize.base
		},
		itemWidth: 12,
		itemHeight: 12,
		selectedMode: "multiple",
		selectorLabel: {
			color: n.$theme().color.text,
			borderColor: n.$theme().color.border
		}
	} };
} }, S = {
	components: [b, x],
	options(e, t) {
		let { engine: n } = t, r = [], i = [];
		return e.rows.forEach((e) => {
			r.push(e[0]), i.push({
				name: e[0],
				data: e.slice(1).map((e) => n.$num(e))
			});
		}), {
			tooltip: {
				trigger: "axis",
				axisPointer: {
					label: { backgroundColor: "#6a7985" },
					crossStyle: { color: "#999" }
				},
				formatter: (e) => {
					var t, r;
					let i = `<div style="margin-bottom:4px;font-weight:bold;">${(t = e == null || (r = e[0]) == null ? void 0 : r.axisValueLabel) == null ? "" : t}</div>`;
					return e.forEach((e) => {
						i += "<div style=\"margin:2px 0;\">", i += `${n.$dot(e.color)}`, i += `<span style="font-weight:bold;">${e.seriesName}</span>`, i += `<span style="float:right;margin-left:20px;font-weight:bold;">${e.value}</span>`, i += "</div>";
					}), i;
				}
			},
			legend: { data: r },
			series: i,
			xAxis: n.$axis("category", {
				data: e.header.slice(1),
				axisTick: { alignWithLabel: !0 },
				axisLabel: {
					rotate: e.header.slice(1).some((e) => e.length > 4) ? 45 : 0,
					interval: 0
				}
			}),
			yAxis: n.$axis("value", {
				axisLabel: { formatter(e) {
					return e >= 1e6 ? `${(e / 1e6).toFixed(1)}M` : e >= 1e3 ? `${(e / 1e3).toFixed(1)}K` : e;
				} },
				nameTextStyle: { color: n.$theme().color.text }
			}),
			grid: n.$grid({
				left: "3%",
				top: "15%"
			}),
			dataZoom: n.$dataZoom(e.header.length > 8)
		};
	}
}, C = {
	components: [S],
	options(e, t) {
		let { engine: n } = t;
		return {
			"tooltip.axisPointer.type": "cross",
			"series.$item": n.$baseSeries("line")
		};
	}
}, w = {
	components: [S],
	options(e, t) {
		let { engine: n } = t;
		return {
			"tooltip.axisPointer.type": "shadow",
			"series.$item": n.$baseSeries("bar")
		};
	}
}, T = {
	components: [b, x],
	options(e, t) {
		let { engine: n } = t, r = e.header.slice(1).map((t) => {
			let r = Math.max(...e.rows.map((r) => {
				let i = e.header.indexOf(t);
				return n.$num(r[i]);
			}));
			return {
				name: t,
				max: Math.ceil(r * 1.2)
			};
		}), i = e.rows.map((e, t) => ({
			name: e[0],
			value: e.slice(1).map((e) => n.$num(e)),
			areaStyle: { opacity: .1 + t * .05 },
			lineStyle: { width: 2 },
			itemStyle: { borderWidth: 2 }
		}));
		return {
			"tooltip.formatter"(e) {
				let t = `<div style="margin-bottom:4px;font-weight:bold;">${n.$dot(e.color)}${e.name}</div>`;
				return e.value.forEach((e, n) => {
					t += "<div style=\"margin:2px 0;\">", t += `<span style="font-weight:bold;">${r[n].name}</span>`, t += `<span style="float:right;margin-left:20px;font-weight:bold;">${e}</span>`, t += "</div>";
				}), t;
			},
			radar: {
				indicator: r,
				radius: "60%",
				center: ["50%", "50%"],
				splitNumber: 5,
				shape: "polygon",
				splitArea: { areaStyle: { color: n.$palette("radar").reverse() } },
				axisName: {
					color: n.$theme().color.text,
					fontSize: 12,
					fontWeight: "bold",
					formatter(e) {
						return e.length > 6 ? `${e.substr(0, 6)}...` : e;
					}
				},
				axisLine: { lineStyle: { color: "rgba(211, 253, 250, 0.8)" } },
				splitLine: { lineStyle: { color: "rgba(211, 253, 250, 0.8)" } }
			},
			series: [n.$baseSeries("radar", {
				name: n.cherry.locale.radarData,
				data: i,
				emphasis: {
					lineStyle: { width: 4 },
					areaStyle: { opacity: .3 }
				}
			})]
		};
	}
}, E = {
	components: [b],
	options(e, t) {
		let { engine: n } = t, r = e.header.slice(1), i = e.rows.map((e) => e[0]), a = [];
		e.rows.forEach((e, t) => {
			e.slice(1).forEach((e, r) => {
				a.push([
					r,
					t,
					n.$num(e)
				]);
			});
		});
		let o = a.map((e) => e[2]), s = Math.min(...o), c = Math.max(...o);
		return {
			"tooltip.formatter"(e) {
				return `${n.$dot(e.color)}${i[e.data[1]]}<br/>${r[e.data[0]]}: <strong>${e.data[2]}</strong>`;
			},
			grid: n.$grid({
				height: "50%",
				top: "10%",
				left: "10%",
				right: "10%"
			}),
			xAxis: n.$axis("category", {
				data: r,
				splitArea: { show: !0 }
			}),
			yAxis: n.$axis("category", {
				data: i,
				splitArea: { show: !0 }
			}),
			visualMap: {
				min: s,
				max: c,
				calculable: !0,
				orient: "horizontal",
				left: "center",
				bottom: "15%",
				inRange: { color: n.$palette("heatmap") },
				textStyle: {
					color: n.$theme().color.text,
					fontSize: n.$theme().fontSize.base
				}
			},
			series: [n.$baseSeries("heatmap", {
				name: n.cherry.locale.heatmapData,
				data: a,
				label: {
					show: !0,
					fontSize: 10
				},
				emphasis: { itemStyle: {
					shadowBlur: n.$theme().shadow.blur,
					shadowColor: n.$theme().shadow.color,
					borderWidth: 2,
					borderColor: n.$theme().color.emphasis
				} },
				select: { itemStyle: {
					borderWidth: 2,
					borderColor: n.$theme().color.emphasis,
					opacity: 1
				} },
				selectedMode: "single",
				animationEasing: "cubicOut"
			})]
		};
	}
}, D = {
	components: [b, x],
	options(e, t) {
		let { engine: n } = t, r = e.rows.map((e) => ({
			name: e[0],
			value: n.$num(e[1])
		}));
		return {
			tooltip: {
				trigger: "item",
				formatter: (e) => `${n.$dot(e.color)}${e.seriesName}<br/>${e.name}: ${e.value} (${e.percent}%)`
			},
			legend: {
				orient: "vertical",
				left: "left",
				top: "middle"
			},
			series: [n.$baseSeries("pie", {
				name: n.cherry.locale.pieData,
				radius: ["40%", "70%"],
				center: ["50%", "50%"],
				avoidLabelOverlap: !1,
				label: {
					show: !1,
					position: "center"
				},
				emphasis: {
					label: {
						show: !0,
						fontSize: "18",
						fontWeight: "bold"
					},
					itemStyle: {
						shadowBlur: n.$theme().shadow.blur,
						shadowOffsetX: 0,
						shadowColor: n.$theme().shadow.color,
						borderWidth: 3,
						borderColor: n.$theme().color.emphasis
					}
				},
				select: { itemStyle: {
					borderWidth: 3,
					borderColor: n.$theme().color.emphasis,
					opacity: 1
				} },
				selectedMode: "single",
				labelLine: { show: !1 },
				data: r,
				animationEasing: "cubicOut"
			})]
		};
	}
}, O = {
	components: [b, x],
	options(e, t) {
		let { engine: n } = t, i = [], a = !1, o = !1, s = t["cherry:mapping"];
		if (s && typeof s == "object") {
			let t = e.header, c = /* @__PURE__ */ new Map();
			t.forEach((e, t) => {
				c.set(e.trim(), t);
			});
			let l = {
				fatalErrors: [],
				warnings: [],
				columnIndexMap: {}
			}, u = ["x", "y"], d = [
				"size",
				"group",
				"series"
			];
			for (let e of u) s[e] || l.fatalErrors.push(`Required dimension "${e}" is not defined in "cherry:mapping".`);
			for (let [e, t] of Object.entries(s)) if (c.has(t)) l.columnIndexMap[e] = c.get(t);
			else {
				let n = `Mapping failed for dimension "${e}": Column "${t}" not found in table headers.`;
				u.includes(e) ? l.fatalErrors.push(n) : d.includes(e) && l.warnings.push(n);
			}
			if (l.fatalErrors.length > 0) return r.error(`Failed to render scatter chart due to FATAL configuration errors in "cherry:mapping":
- ${l.fatalErrors.join("\n- ")}\nAvailable columns are: [${t.slice(1).join(", ")}]`), { series: [] };
			l.warnings.length > 0 && r.warn(`Scatter chart rendered with WARNINGS due to configuration issues in "cherry:mapping":
- ${l.warnings.join("\n- ")}\nThese optional dimensions have been ignored.`);
			let { columnIndexMap: f } = l, p = f.x, m = f.y, h = f.size, g = f.group || f.series;
			a = typeof h == "number", o = typeof g == "number", i = e.rows.map((e) => {
				var t;
				return {
					name: e[0],
					x: n.$num(e[p]),
					y: n.$num(e[m]),
					size: a ? n.$num(e[h]) : void 0,
					seriesName: o ? String((t = e[g]) == null ? "" : t).trim() || "系列1" : null
				};
			});
		} else {
			let t = e.header, r = (e) => t.findIndex((t, n) => n > 0 && e.some((e) => String(t).toLowerCase().includes(e))), s = r(["x"]), c = r(["y"]), l = r(["size", "大小"]), u = r([
				"series",
				"group",
				"分组",
				"系列"
			]);
			u <= 0 && t.length >= 5 && (u = t.length - 1), a = l > 0, o = u > 0, i = e.rows.map((e) => {
				var t;
				let r = n.$num(e[s > 0 ? s : 1]), i = n.$num(e[c > 0 ? c : 2]), d = a ? n.$num(e[l]) : void 0, f = o ? String((t = e[u]) == null ? "" : t).trim() || "系列1" : null;
				return {
					name: e[0],
					x: r,
					y: i,
					size: d,
					seriesName: f
				};
			});
		}
		let c = this.buildSeriesFromParsedRows(i, a, o, n);
		return {
			tooltip: {
				trigger: "item",
				formatter(e) {
					let [t, r] = e.value || [];
					return `${n.$dot(e.color)}${e.seriesName} ${e.name}<br/>x: <strong>${t}</strong><br/>y: <strong>${r}</strong>`;
				}
			},
			grid: n.$grid(),
			xAxis: n.$axis("value"),
			yAxis: n.$axis("value"),
			series: c,
			legend: { data: c.map((e) => e.name) }
		};
	},
	buildSeriesFromParsedRows(e, t, n, r) {
		let i = Infinity, a = -Infinity;
		t && (e.forEach((e) => {
			typeof e.size == "number" && !Number.isNaN(e.size) && (i = Math.min(i, e.size), a = Math.max(a, e.size));
		}), (!Number.isFinite(i) || !Number.isFinite(a)) && (i = 0, a = 0));
		let o = [];
		if (n) {
			let n = /* @__PURE__ */ new Map();
			e.forEach((e) => {
				let r = {
					value: [e.x, e.y],
					name: e.name
				};
				if (t) {
					if (a === i) r.symbolSize = 12;
					else if (typeof e.size == "number" && !Number.isNaN(e.size)) {
						let t = (e.size - i) / (a - i);
						r.symbolSize = Math.round(6 + t * 22);
					} else r.symbolSize = 10;
				}
				let o = e.seriesName;
				n.has(o) || n.set(o, []), n.get(o).push(r);
			}), o = Array.from(n.entries()).map(([e, t]) => r.$baseSeries("scatter", {
				name: e,
				data: t,
				emphasis: {
					focus: "series",
					itemStyle: {
						shadowBlur: r.$theme().shadow.blur,
						shadowColor: r.$theme().shadow.color,
						borderWidth: 2,
						borderColor: r.$theme().color.emphasis
					}
				},
				select: { itemStyle: {
					borderWidth: 2,
					borderColor: r.$theme().color.emphasis,
					opacity: 1
				} },
				selectedMode: "single",
				animationEasing: "cubicOut"
			}));
		} else {
			let n = e.map((e) => {
				let n = {
					value: [e.x, e.y],
					name: e.name
				};
				if (t) {
					if (a === i) n.symbolSize = 12;
					else if (typeof e.size == "number" && !Number.isNaN(e.size)) {
						let t = (e.size - i) / (a - i);
						n.symbolSize = Math.round(6 + t * 22);
					} else n.symbolSize = 10;
				}
				return n;
			});
			o = [r.$baseSeries("scatter", {
				name: r.cherry.locale.scatterData,
				data: n,
				emphasis: {
					focus: "series",
					itemStyle: {
						borderWidth: 2,
						borderColor: r.$theme().color.emphasis
					}
				},
				select: { itemStyle: {
					borderWidth: 2,
					borderColor: r.$theme().color.emphasis,
					opacity: 1
				} },
				selectedMode: "single",
				animationEasing: "cubicOut"
			})];
		}
		return o;
	}
}, k = {
	components: [b],
	options(e, t) {
		let { engine: n } = t, r = [], i = /* @__PURE__ */ new Set();
		e.rows.forEach((e) => {
			let t = String(e[0] || "").trim(), a = String(e[1] || "").trim(), o = n.$num(e[2]);
			t && a && o > 0 && (r.push({
				source: t,
				target: a,
				value: o
			}), i.add(t), i.add(a));
		});
		let a = Array.from(i).map((e) => ({ name: e }));
		return {
			tooltip: { trigger: "item" },
			series: [n.$baseSeries("sankey", {
				layout: "none",
				emphasis: { focus: "adjacency" },
				data: a,
				links: r,
				orient: "horizontal",
				label: {
					show: !0,
					position: "right",
					fontSize: n.$theme().fontSize.base,
					color: n.$theme().color.text
				},
				lineStyle: {
					color: "source",
					curveness: .5
				}
			})],
			color: n.$palette("sankey")
		};
	}
}, A = { options(e, t) {
	let { engine: n } = t;
	return a("echarts") ? {
		title: {
			text: `${n.cherry.locale.mapChartLoading}...`,
			left: "center",
			top: "middle",
			textStyle: {
				color: n.$theme().color.text,
				fontSize: n.$theme().fontSize.title
			}
		},
		graphic: { elements: [{
			type: "text",
			left: "center",
			top: "60%",
			style: {
				text: n.cherry.locale.mapChartLoadingTip,
				font: "12px sans-serif",
				fill: n.$theme().color.text,
				opacity: .7
			}
		}] }
	} : { title: {
		text: `${n.cherry.locale.chartRenderError} : ${n.cherry.locale.chartLibraryNotLoadedTip}`,
		left: "center",
		textStyle: { color: n.$theme().color.error }
	} };
} }, j = {
	components: [b],
	options(e, t) {
		let { engine: n } = t, r = e.rows.map((e) => {
			let t = e[0];
			return {
				name: F(t),
				value: n.$num(e[1])
			};
		});
		return {
			"tooltip.formatter": (e) => `${e.name}: ${e.value || 0}`,
			visualMap: {
				min: Math.min(...r.map((e) => e.value)),
				max: Math.max(...r.map((e) => e.value)),
				left: "left",
				top: "bottom",
				text: [n.cherry.locale.high, n.cherry.locale.low],
				calculable: !0,
				inRange: { color: n.$palette("map") },
				textStyle: {
					color: n.$theme().color.text,
					fontSize: n.$theme().fontSize.base
				}
			},
			series: [{
				name: n.cherry.locale.mapData,
				type: "map",
				map: t.mapDataSource || "china",
				roam: !0,
				label: {
					show: !0,
					fontSize: n.$theme().fontSize.base
				},
				data: r,
				emphasis: {
					label: {
						show: !0,
						fontSize: n.$theme().fontSize.base,
						fontWeight: "bold"
					},
					itemStyle: {
						shadowBlur: 10,
						shadowOffsetX: 0,
						shadowColor: n.$theme().shadow.color
					}
				}
			}]
		};
	}
}, M = { options(e, t) {
	let { engine: n } = t;
	return {
		title: {
			text: n.cherry.locale.mapChartError,
			subtext: n.cherry.locale.mapChartErrorTip,
			left: "center",
			top: "40%",
			textStyle: {
				fontSize: n.$theme().fontSize.title,
				color: n.$theme().color.error
			},
			subtextStyle: {
				fontSize: n.$theme().fontSize.base,
				color: n.$theme().color.text,
				opacity: .7
			}
		},
		graphic: {
			type: "text",
			left: "center",
			top: "60%",
			style: {
				text: n.cherry.locale.mapChartRetry,
				fontSize: n.$theme().fontSize.base,
				fill: n.$theme().color.primary,
				cursor: "pointer"
			},
			onclick: () => {
				let e = document.querySelector(`[id="${t.chartId}"][data-chart-type="map"]`);
				N.$showChartWithHandler(e, t, A), N.$loadMapData(null, t);
			}
		}
	};
} }, N = {
	options(e, t) {
		let n = t && t.mapDataSource ? t.mapDataSource : null, r = document.querySelector(`[id="${t.chartId}"][data-chart-type="map"]`);
		if (r && r.getAttribute("data-map-status") === "failed") return I(M, e, t);
		if (n) {
			var i, o;
			return (i = a("echarts")) != null && (o = i.getMap) != null && o.call(i, n) ? I(j, e, t) : (this.$loadMapData(e, t), I(A, e, t));
		}
		let s = this.$getAllPossibleMapSources(t), c = !1, l = null;
		for (let e of s) {
			var u, d;
			if ((u = a("echarts")) != null && (d = u.getMap) != null && d.call(u, e)) {
				c = !0, l = e;
				break;
			}
		}
		return c ? I(j, e, p(p({}, t), {}, { mapDataSource: l })) : (this.$loadMapData(e, t), I(A, e, t));
	},
	$getAllPossibleMapSources(e) {
		var t;
		let n = [];
		return e && e.mapDataSource && n.push(e.mapDataSource), e != null && (t = e.engine) != null && (t = t.cherryOptions) != null && (t = t.toolbars) != null && (t = t.config) != null && (t = t.mapTable) != null && t.sourceUrl && (n = n.concat(e.engine.cherryOptions.toolbars.config.mapTable.sourceUrl)), n = n.concat(["https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json", "./assets/data/china.json"]), n;
	},
	$loadMapData(e, t) {
		let n = this.$getAllPossibleMapSources(t);
		if (t && t.chartId) {
			let e = document.querySelector(`[id="${t.chartId}"][data-chart-type="map"]`);
			e && e.setAttribute("data-map-status", "loading");
		}
		if (!n || n.length === 0) {
			this.$handleMapLoadFailure(t);
			return;
		}
		this.$tryLoadMapDataFromPaths(n, 0, t);
	},
	$tryLoadMapDataFromPaths(e, t, n) {
		if (t >= e.length) {
			this.$handleMapLoadFailure(n);
			return;
		}
		let i = e[t];
		this.$fetchMapData(i).then((e) => {
			var t, r;
			return (t = a("echarts")) == null || (r = t.registerMap) == null || r.call(t, i, e), this.$refreshMapChart(n.chartId, i, n.engine), e;
		}).catch((e) => {
			r.warn(`Map data loading failed (${i}):`, e.message), this.$handleMapLoadFailure(n);
		});
	},
	$handleMapLoadFailure(e) {
		if (e && e.chartId) {
			let t = document.querySelector(`[id="${e.chartId}"][data-chart-type="map"]`);
			t && (t.setAttribute("data-map-status", "failed"), this.$showChartWithHandler(t, e, M));
		}
	},
	$showChartWithHandler(e, t, n) {
		if (t.engine && t.engine.echartsRef) {
			let r = I(n, null, t), i = t.engine.echartsRef.getInstanceByDom(e);
			i ? i.setOption(r, !0) : t.engine.createChart(e, r, "map");
		}
	},
	$fetchMapData(e) {
		return h(function* () {
			let t = yield fetch(e, { referrerPolicy: "no-referrer" });
			if (!t.ok) throw Error(`HTTP error! status: ${t.status} for ${e}`);
			return yield t.json();
		})();
	},
	$refreshMapChart(e, t, n) {
		let r = document.querySelector(`[id="${e}"][data-chart-type="map"]`), i = r.getAttribute("data-table-data"), a = r.getAttribute("data-chart-options");
		if (i && n.echartsRef) try {
			let e = JSON.parse(i), o = a ? JSON.parse(a) : {};
			o.engine = n, L(o, { mapDataSource: t });
			let s = I(j, e, o), c = n.echartsRef.getInstanceByDom(r);
			c ? (c.clear(), c.setOption(s, !0)) : n.createChart(r, s, "map"), r.setAttribute("data-map-status", "success");
		} catch (e) {}
	}
}, P = {
	北京: "北京市",
	天津: "天津市",
	上海: "上海市",
	重庆: "重庆市",
	河北: "河北省",
	山西: "山西省",
	辽宁: "辽宁省",
	吉林: "吉林省",
	黑龙江: "黑龙江省",
	江苏: "江苏省",
	浙江: "浙江省",
	安徽: "安徽省",
	福建: "福建省",
	江西: "江西省",
	山东: "山东省",
	河南: "河南省",
	湖北: "湖北省",
	湖南: "湖南省",
	广东: "广东省",
	海南: "海南省",
	四川: "四川省",
	贵州: "贵州省",
	云南: "云南省",
	陕西: "陕西省",
	甘肃: "甘肃省",
	青海: "青海省",
	台湾: "台湾省",
	内蒙古: "内蒙古自治区",
	广西: "广西壮族自治区",
	西藏: "西藏自治区",
	宁夏: "宁夏回族自治区",
	新疆: "新疆维吾尔自治区",
	香港: "香港特别行政区",
	澳门: "澳门特别行政区"
}, F = (e) => {
	let t = e.trim();
	if (P[t]) return P[t];
	if (t.endsWith("市") || t.endsWith("省") || t.endsWith("自治区") || t.endsWith("特别行政区")) return t;
	for (let [e, n] of Object.entries(P)) if (n.includes(t) || t.includes(e)) return n;
	return t;
};
function I(e, t, n) {
	let r;
	if (!e.components || e.components.length === 0) r = {};
	else {
		r = I(e.components[0], t, n);
		for (let i of e.components.slice(1)) L(r, I(i, t, n));
	}
	return L(r, e.options(t, n)), r;
}
function L(e, t) {
	for (let n of Object.keys(t)) if (Object.prototype.hasOwnProperty.call(t, n)) {
		let r = n.split("."), i = e;
		for (let e of r.slice(0, -1)) (typeof i[e] != "object" || i[e] === null || i[e] === void 0) && (i[e] = {}), i = i[e];
		let a = r[r.length - 1];
		if (Array.isArray(i) && a === "$item") for (let e of i) L(e, t[n]);
		else typeof i[a] == "object" && typeof t[n] == "object" ? L(i[a], t[n]) : i[a] = t[n];
	}
	return e;
}
//#endregion
export { y as default };
