//#region \0@oxc-project+runtime@0.143.0/helpers/esm/typeof.js
function e(t) {
	"@babel/helpers - typeof";
	return e = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, e(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/toPrimitive.js
function t(t, n) {
	if (e(t) != "object" || !t) return t;
	var r = t[Symbol.toPrimitive];
	if (r !== void 0) {
		var i = r.call(t, n || "default");
		if (e(i) != "object") return i;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (n === "string" ? String : Number)(t);
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/toPropertyKey.js
function n(n) {
	var r = t(n, "string");
	return e(r) == "symbol" ? r : r + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/defineProperty.js
function r(e, t, r) {
	return (t = n(t)) in e ? Object.defineProperty(e, t, {
		value: r,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = r, e;
}
//#endregion
//#region src/core/SyntaxBase.js
var i = !1, a = {
	SEN: "sentence",
	PAR: "paragraph",
	DEFAULT: "sentence"
}, o = class {
	constructor(e) {
		r(this, "$engine", void 0), r(this, "$locale", void 0), r(this, "$externals", void 0), this.RULE = this.rule(e);
	}
	getType() {
		return this.constructor.HOOK_TYPE || a.DEFAULT;
	}
	getName() {
		return this.constructor.HOOK_NAME;
	}
	afterInit(e) {
		typeof e == "function" && e();
	}
	setLocale(e) {
		this.$locale = e;
	}
	beforeMakeHtml(e) {
		return e;
	}
	makeHtml(e) {
		return e;
	}
	afterMakeHtml(e) {
		return e;
	}
	onKeyDown(e, t) {}
	getOnKeyDown() {
		return this.onKeyDown || !1;
	}
	getAttributesTest() {
		return /^(color|fontSize|font-size|id|title|class|target|underline|line-through|overline|sub|super)$/;
	}
	$testAttributes(e, t) {
		this.getAttributesTest().test(e) && t();
	}
	getAttributes(e) {
		return {
			attrs: {},
			str: e
		};
	}
	static getMathJaxConfig() {
		return i;
	}
	static setMathJaxConfig(e) {
		i = e;
	}
	test(e) {
		return this.RULE.reg ? this.RULE.reg.test(e) : !1;
	}
	rule(e) {
		return {
			begin: "",
			end: "",
			content: "",
			reg: /* @__PURE__ */ RegExp("")
		};
	}
	mounted() {}
};
r(o, "HOOK_NAME", "default"), r(o, "HOOK_TYPE", a.DEFAULT);
//#endregion
//#region src/utils/lineFeed.js
function s(e, t, n = !1) {
	if (!/^\n/.test(e)) return t;
	if (n) {
		var r, i;
		return ((r = (i = e.match(/^\n+/g)) == null || (i = i[0]) == null ? void 0 : i.length) == null ? 0 : r) > 1 ? `\n\n${t}` : `\n${t}`;
	}
	return `\n\n${t}`;
}
//#endregion
//#region src/utils/config.js
function c(e) {
	return typeof localStorage < "u" && localStorage.getItem(`cherry-${e}`) !== null;
}
function l() {
	let e = "false";
	return typeof localStorage < "u" && (e = localStorage.getItem("cherry-classicBr")), e === "true";
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
			r(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : u(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
//#endregion
//#region src/utils/sanitize.js
var f = d(d(d(d(d(d({}, {
	34: "&quot;",
	38: "&amp;",
	39: "&apos;",
	60: "&lt;",
	62: "&gt;"
}), {
	192: "&Agrave;",
	193: "&Aacute;",
	194: "&Acirc;",
	195: "&Atilde;",
	196: "&Auml;",
	197: "&Aring;",
	198: "&AElig;",
	199: "&Ccedil;",
	200: "&Egrave;",
	201: "&Eacute;",
	202: "&Ecirc;",
	203: "&Euml;",
	204: "&Igrave;",
	205: "&Iacute;",
	206: "&Icirc;",
	207: "&Iuml;",
	208: "&ETH;",
	209: "&Ntilde;",
	210: "&Ograve;",
	211: "&Oacute;",
	212: "&Ocirc;",
	213: "&Otilde;",
	214: "&Ouml;",
	216: "&Oslash;",
	217: "&Ugrave;",
	218: "&Uacute;",
	219: "&Ucirc;",
	220: "&Uuml;",
	221: "&Yacute;",
	222: "&THORN;",
	223: "&szlig;",
	224: "&agrave;",
	225: "&aacute;",
	226: "&acirc;",
	227: "&atilde;",
	228: "&auml;",
	229: "&aring;",
	230: "&aelig;",
	231: "&ccedil;",
	232: "&egrave;",
	233: "&eacute;",
	234: "&ecirc;",
	235: "&euml;",
	236: "&igrave;",
	237: "&iacute;",
	238: "&icirc;",
	239: "&iuml;",
	240: "&eth;",
	241: "&ntilde;",
	242: "&ograve;",
	243: "&oacute;",
	244: "&ocirc;",
	245: "&otilde;",
	246: "&ouml;",
	248: "&oslash;",
	249: "&ugrave;",
	250: "&uacute;",
	251: "&ucirc;",
	252: "&uuml;",
	253: "&yacute;",
	254: "&thorn;",
	255: "&yuml;"
}), {
	160: "&nbsp;",
	161: "&iexcl;",
	162: "&cent;",
	163: "&pound;",
	164: "&curren;",
	165: "&yen;",
	166: "&brvbar;",
	167: "&sect;",
	168: "&uml;",
	169: "&copy;",
	170: "&ordf;",
	171: "&laquo;",
	172: "&not;",
	173: "&shy;",
	174: "&reg;",
	175: "&macr;",
	176: "&deg;",
	177: "&plusmn;",
	178: "&sup2;",
	179: "&sup3;",
	180: "&acute;",
	181: "&micro;",
	182: "&para;",
	184: "&cedil;",
	185: "&sup1;",
	186: "&ordm;",
	187: "&raquo;",
	188: "&frac14;",
	189: "&frac12;",
	190: "&frac34;",
	191: "&iquest;",
	215: "&times;",
	247: "&divide;"
}), {
	8704: "&forall;",
	8706: "&part;",
	8707: "&exist;",
	8709: "&empty;",
	8711: "&nabla;",
	8712: "&isin;",
	8713: "&notin;",
	8715: "&ni;",
	8719: "&prod;",
	8721: "&sum;",
	8722: "&minus;",
	8727: "&lowast;",
	8730: "&radic;",
	8733: "&prop;",
	8734: "&infin;",
	8736: "&ang;",
	8743: "&and;",
	8744: "&or;",
	8745: "&cap;",
	8746: "&cup;",
	8747: "&int;",
	8756: "&there4;",
	8764: "&sim;",
	8773: "&cong;",
	8776: "&asymp;",
	8800: "&ne;",
	8801: "&equiv;",
	8804: "&le;",
	8805: "&ge;",
	8834: "&sub;",
	8835: "&sup;",
	8836: "&nsub;",
	8838: "&sube;",
	8839: "&supe;",
	8853: "&oplus;",
	8855: "&otimes;",
	8869: "&perp;",
	8901: "&sdot;"
}), {
	913: "&Alpha;",
	914: "&Beta;",
	915: "&Gamma;",
	916: "&Delta;",
	917: "&Epsilon;",
	918: "&Zeta;",
	919: "&Eta;",
	920: "&Theta;",
	921: "&Iota;",
	922: "&Kappa;",
	923: "&Lambda;",
	924: "&Mu;",
	925: "&Nu;",
	926: "&Xi;",
	927: "&Omicron;",
	928: "&Pi;",
	929: "&Rho;",
	931: "&Sigma;",
	932: "&Tau;",
	933: "&Upsilon;",
	934: "&Phi;",
	935: "&Chi;",
	936: "&Psi;",
	937: "&Omega;",
	945: "&alpha;",
	946: "&beta;",
	947: "&gamma;",
	948: "&delta;",
	949: "&epsilon;",
	950: "&zeta;",
	951: "&eta;",
	952: "&theta;",
	953: "&iota;",
	954: "&kappa;",
	955: "&lambda;",
	956: "&mu;",
	957: "&nu;",
	958: "&xi;",
	959: "&omicron;",
	960: "&pi;",
	961: "&rho;",
	962: "&sigmaf;",
	963: "&sigma;",
	964: "&tau;",
	965: "&upsilon;",
	966: "&phi;",
	967: "&chi;",
	968: "&psi;",
	969: "&omega;",
	977: "&thetasym;",
	978: "&upsih;",
	982: "&piv;"
}), {
	338: "&OElig;",
	339: "&oelig;",
	352: "&Scaron;",
	353: "&scaron;",
	376: "&Yuml;",
	402: "&fnof;",
	710: "&circ;",
	732: "&tilde;",
	8194: "&ensp;",
	8195: "&emsp;",
	8201: "&thinsp;",
	8204: "&zwnj;",
	8205: "&zwj;",
	8206: "&lrm;",
	8207: "&rlm;",
	8211: "&ndash;",
	8212: "&mdash;",
	8216: "&lsquo;",
	8217: "&rsquo;",
	8218: "&sbquo;",
	8220: "&ldquo;",
	8221: "&rdquo;",
	8222: "&bdquo;",
	8224: "&dagger;",
	8225: "&Dagger;",
	8226: "&bull;",
	8230: "&hellip;",
	8240: "&permil;",
	8242: "&prime;",
	8243: "&Prime;",
	8249: "&lsaquo;",
	8250: "&rsaquo;",
	8254: "&oline;",
	8364: "&euro;",
	8482: "&trade;",
	8592: "&larr;",
	8593: "&uarr;",
	8594: "&rarr;",
	8595: "&darr;",
	8596: "&harr;",
	8629: "&crarr;",
	8968: "&lceil;",
	8969: "&rceil;",
	8970: "&lfloor;",
	8971: "&rfloor;",
	9674: "&loz;",
	9824: "&spades;",
	9827: "&clubs;",
	9829: "&hearts;",
	9830: "&diams;"
});
Object.keys(f).map((e) => f[e].replace(/^&(\w+);$/g, (e, t) => t.toLowerCase()));
var p = [
	"h1|h2|h3|h4|h5|h6",
	"ul|ol|li|dd|dl|dt",
	"table|thead|tbody|tfoot|col|colgroup|th|td|tr",
	"div|article|section|footer|aside|details|summary|code|audio|video|canvas|figure",
	"address|center|cite|p|pre|blockquote|marquee|caption|figcaption|track|source|output|svg"
].join("|"), m = [
	"span|a|link|b|s|i|del|u|em|strong|sup|sub|kbd",
	"nav|font|bdi|samp|map|area|small|time|bdo|var|wbr|meter|dfn",
	"ruby|rt|rp|mark|q|progress|input|textarea|select|ins"
].join("|");
RegExp(`^(${p}|${m}|br|img|hr)( |$|/)`, "i");
//#endregion
//#region src/utils/LRUCache.js
var h = class {
	constructor(e) {
		this.capacity = e, this.cache = /* @__PURE__ */ new Map();
	}
	get(e) {
		if (!this.cache.has(e)) return;
		let t = this.cache.get(e);
		return this.cache.delete(e), this.cache.set(e, t), t;
	}
	set(e, t) {
		if (this.cache.has(e) && this.cache.delete(e), this.cache.size >= this.capacity) {
			let e = this.cache.keys(), t = Math.min(100, this.cache.size);
			for (let n = 0; n < t; n++) {
				let t = e.next();
				if (t.done) break;
				let n = t.value;
				this.cache.delete(n);
			}
		}
		this.cache.set(e, t);
	}
	has(e) {
		return this.cache.has(e);
	}
	delete(e) {
		return this.cache.delete(e);
	}
	clear() {
		this.cache.clear();
	}
	keys() {
		return Array.from(this.cache.keys());
	}
	values() {
		return Array.from(this.cache.values());
	}
	entries() {
		return Array.from(this.cache.entries());
	}
	get size() {
		return this.cache.size;
	}
}, g = 0, _ = class e extends o {
	constructor({ needCache: e, defaultCache: t = {} } = { needCache: !1 }) {
		super({}), this.needCache = !!e, this.sign = "", e && (this.cache = new h(2e3), this.cacheKey = `~~C${g}`, g += 1), this.cacheData = {}, this.cacheDataMap = [];
	}
	cacheAndGetData(e, t, n, r, i = !1) {
		return this.cacheData[e] ? i && (this.cacheData[e] = t(e)) : (this.cacheDataMap.length > n && this.cacheDataMap.splice(r).forEach((e) => {
			delete this.cacheData[e];
		}), this.cacheData[e] = t(e), this.cacheDataMap.push(e)), this.cacheData[e];
	}
	clearCache() {
		this.cacheData = {}, this.cacheDataMap = [];
	}
	initBrReg(e = !1) {
		this.classicBr = c("classicBr") ? l() : e, this.removeBrAfterBlock = null, this.removeBrBeforeBlock = null, this.removeNewlinesBetweenTags = null;
	}
	$cleanParagraph(e) {
		let t = e.replace(/^\n+/, "").replace(/\n+$/, "");
		return this.classicBr ? t : this.joinRawHtml(t).replace(/\n/g, "<br>").replace(/\r/g, "\n");
	}
	joinRawHtml(e) {
		if (!this.removeBrAfterBlock) {
			var t, n;
			let e = (t = (n = this.$engine.htmlWhiteListAppend) == null ? void 0 : n.split("|")) == null ? [] : t;
			e = e.map((e) => /[a-z-]+/gi.test(e) ? e : null).filter((e) => e !== null);
			let r = e.concat(p).join("|");
			this.removeBrAfterBlock = RegExp(`<(${r})(>| [^>]*?>)[^\\S\\n]*?\\n`, "ig"), this.removeBrBeforeBlock = RegExp(`\\n[^\\S\\n]*?<\\/(${r})>[^\\S\\n]*?\\n`, "ig"), this.removeNewlinesBetweenTags = RegExp(`<\\/(${r})>[^\\S\\n]*?\\n([^\\S\\n]*?)<(${r})(>| [^>]*?>)`, "ig");
		}
		return e.replace(this.removeBrAfterBlock, "<$1$2").replace(this.removeBrBeforeBlock, "</$1>").replace(this.removeNewlinesBetweenTags, "</$1>\r$2<$3$4");
	}
	toHtml(e, t) {
		return e;
	}
	beforeMakeHtml(e, t = (e) => ({
		sign: "",
		html: e
	})) {
		return e;
	}
	makeHtml(e, t = (e) => ({
		sign: "",
		html: e
	})) {
		return this.needCache ? e : t(e).html;
	}
	afterMakeHtml(e, t = (e) => ({
		sign: "",
		html: e
	})) {
		return this.restoreCache(e);
	}
	isContainsCache(t, n) {
		if (n) {
			let n = /^(\s*~~C\d+I\w+\$\s*)+$/g.test(t), r = RegExp(`~~C\\d+I${e.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX}\\w+\\$`, "g").test(t);
			return n && !r;
		}
		return RegExp(`~~C\\d+I(?!${e.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX})\\w+\\$`, "g").test(t);
	}
	$splitHtmlByCache(t) {
		let n = RegExp(`\\n*~~C\\d+I(?!${e.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX})\\w+\\$\\n?`, "g");
		return {
			caches: t.match(n),
			contents: t.split(n)
		};
	}
	makeExcludingCached(e, t) {
		let { caches: n, contents: r } = this.$splitHtmlByCache(e), i = r.map(t), a = "";
		for (let e = 0; e < i.length; e++) a += i[e], n && n[e] && (a += n[e].trim());
		return a;
	}
	getCacheWithSpace(e, t, n = !1) {
		var r, i, a, o;
		let c = (r = (i = t.match(/^\n+/)) == null ? void 0 : i[0]) == null ? "" : r, l = (a = (o = t.match(/\n+$/)) == null ? void 0 : o[0]) == null ? "" : a;
		return n ? s(t, e) : `${c}${e}${l}`;
	}
	getLineCount(t, n = "") {
		var r, i;
		let a = t, o = (r = (i = n.match(/^\n+/g)) == null || (i = i[0]) == null ? void 0 : i.length) == null ? 0 : r;
		o = +(o === 1), a = a.replace(/^\n+/g, "");
		let s = RegExp(`\n*~~C\\d+I(?:${e.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX})?\\w+?_L(\\d+)\\$`, "g"), c = 0;
		return a = a.replace(s, (e, t) => (c += parseInt(t, 10), e.replace(/^\n+/g, ""))), o + c + (a.match(/\n/g) || []).length + 1;
	}
	pushCache(e, t = "", n = 0) {
		if (!this.needCache) return;
		let r = t || this.$engine.hash(e), i = `${this.cacheKey}I${r}_L${n}$`;
		return this.cache.set(r, {
			content: e,
			key: i
		}), i;
	}
	popCache(e) {
		var t;
		if (this.needCache) return ((t = this.cache.get(e)) == null ? void 0 : t.content) || "";
	}
	testHasCache(e) {
		var t;
		return !this.needCache || !this.cache.get(e) ? !1 : (t = this.cache.get(e)) == null ? void 0 : t.key;
	}
	resetCache() {}
	restoreCache(t) {
		if (!this.needCache) return t;
		let n = RegExp(`${this.cacheKey}I((?:${e.IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX})?\\w+)\\$`, "g");
		return t.replace(n, (e, t) => this.popCache(t.replace(/_L\d+$/, "")));
	}
	checkCache(e, t, n = 0) {
		return this.sign = this.$engine.hash(e), this.cache.get(this.sign) ? `${this.cacheKey}I${this.sign}_L${n}$` : this.toHtml(e, t);
	}
	mounted() {}
	signWithCache(e) {
		return !1;
	}
};
r(_, "HOOK_TYPE", a.PAR), r(_, "IN_PARAGRAPH_CACHE_KEY_PREFIX", "!"), r(_, "IN_PARAGRAPH_CACHE_KEY_PREFIX_REGEX", "\\!");
//#endregion
//#region src/addons/advance/cherry-tapd-table-plugin.js
var v = class extends _ {
	constructor() {
		super({ needCache: !0 }), this.cacheMap = {}, this.sentenceMakeFunc = null;
	}
	$nextTdKey(e) {
		return e.replace(/^([0-9]+)-([0-9]+)$/, (e, t, n) => `${t}-${Number.parseInt(n, 10) + 1}`);
	}
	$prevTdKey(e) {
		return e.replace(/^([0-9]+)-([0-9]+)$/, (e, t, n) => `${t}-${Number.parseInt(n, 10) - 1}`);
	}
	$nextTrKey(e) {
		return e.replace(/^([0-9]+)-([0-9]+)$/, (e, t, n) => `${Number.parseInt(t, 10) + 1}-${n}`);
	}
	$prevTrKey(e) {
		return e.replace(/^([0-9]+)-([0-9]+)$/, (e, t, n) => `${Number.parseInt(t, 10) - 1}-${n}`);
	}
	$setColMapVal(e, t) {
		let n = e;
		if (n[t] === void 0) return n[t] = [1, 2], n[this.$nextTdKey(t)] = [1, -1], n;
		if (n[t][1] === -1) {
			let e = this.$prevTdKey(t);
			return n[this.$nextTdKey(t)] = [1, -1], this.$setColMapVal(n, e);
		}
		return n[t][1] += 1, n;
	}
	$setRowMapVal(e, t) {
		let n = e;
		if (n[t] === void 0) return n[t] = [2, 1], n[this.$nextTrKey(t)] = [-1, 1], n;
		let r = this.$nextTrKey(t);
		if (n[r] = n[r] === void 0 ? [1, 1] : n[r], n[t][1] !== n[r][1]) return n;
		if (n[t][0] === 1) return n[t][0] = 2, n[r][0] = -1, n;
		if (n[t][0] === -1) {
			let e = this.$prevTrKey(t);
			return n[r][0] = -1, this.$setRowMapVal(n, e);
		}
		return n[t][0] += 1, n;
	}
	$dealColSpan(e, t, n, r) {
		let i = Number.parseInt(t, 10) + 1, a = n[i] ? n[i].trim() : !1, o = n[t].trim(), s = this.$getSpanKey(e, t);
		return o === a ? this.$setColMapVal(r, s) : r;
	}
	$dealRowSpan(e, t, n, r) {
		let i = Number.parseInt(e, 10) + 1, a = n[i] && n[i][t] ? n[i][t].trim() : !1, o = n[e][t].trim(), s = this.$getSpanKey(e, t);
		return o === a ? this.$setRowMapVal(r, s) : r;
	}
	$getSpanKey(e, t) {
		return `${e}-${t}`;
	}
	$getColAndRowSpanMap(e) {
		let t = {};
		for (let n of e.keys()) {
			let r = e[n];
			for (let e of r.keys()) t = this.$dealColSpan(n, e, r, t);
		}
		for (let n of e.keys()) {
			let r = e[n];
			for (let i of r.keys()) t = this.$dealRowSpan(n, i, e, t);
		}
		return t;
	}
	$convertTrsString2Array(e) {
		let t = [];
		if (!e) return e;
		for (let n of e) n.length > 0 && t.push(n.replace(/^\|{2,3}/, "").replace(/\|\|\s*$/, "").split("||"));
		return t;
	}
	$isMeerged(e, t) {
		return e[t] ? e[t][0] < 0 || e[t][1] < 0 : !1;
	}
	$getTdSpan(e, t) {
		return e[t] === void 0 ? "" : `rowspan="${e[t][0]}" colspan="${e[t][1]}"`;
	}
	$dealTh(e) {
		let t = /^\s*~T/.test(e), n = /~T\s*$/.test(e), r = {
			style: "",
			content: ""
		};
		return t && n ? r.align = "align=\"center\"" : n ? r.align = "align=\"right\"" : t && (r.align = "align=\"left\""), r.content = e.replace(/^\s*~T/, "").replace(/~T\s*$/, "").trim(), r;
	}
	makeHtml(e, t) {
		return e.replace(/(^|\n)\s*?((?:\|\|[^\n]+(?:$|\n))+)/g, (e, n, r) => {
			let i = this.$engine.md5(r), a = r.match(/\n/g).length, o = /^\|\|\|/.test(r), s = /\|{2,3}\s*~T/.test(r) || /~T\s*\|\|/.test(r), c = r.split(/\n/), l = "", u = [], d = [];
			if (s && c[0]) {
				l = "<thead><tr>";
				let e = c[0].replace(/^\|{2,3}/, "").replace(/\|\|\s*$/, "").split("||");
				for (let n of e) {
					let e = this.$dealTh(n);
					d.push(e.align), l += `<th ${e.align}>${t(e.content).html}</th>`;
				}
				l += "</tr></thead>", c.shift();
			}
			c = this.$convertTrsString2Array(c);
			let f = o ? this.$getColAndRowSpanMap(c) : {};
			for (let e of c.keys()) {
				let n = c[e], r = "<tr>";
				for (let i of n.keys()) {
					let a = this.$getSpanKey(e, i), o = n[i];
					this.$isMeerged(f, a) || (r += `<td ${d[i] ? d[i] : ""} ${this.$getTdSpan(f, a)}>${t(o.trim()).html}</td>`);
				}
				r += "</tr>", u.push(r);
			}
			let p = `<div class="cherry-table-container simple-table" data-lines="${a}" data-sign="${i}">
        <table class="cherry-table">${l + u.join("")}</table></div>`;
			return `${n}${this.pushCache(p, i)}`;
		});
	}
	rule() {
		return {};
	}
};
r(v, "HOOK_NAME", "tapdTable");
//#endregion
export { v as default };
