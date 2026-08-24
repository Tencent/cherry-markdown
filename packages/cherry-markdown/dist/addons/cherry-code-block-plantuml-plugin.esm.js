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
//#region src/libs/rawdeflate.js
var r = (function() {
	let e = 32768, t = 8192, n = 2 * e, r = 8192, i = 8192, a = 8191, o = 32767, s = 32506, c, l, u, d, f = null, p, m, ee, h, te, ne, g, _, v, y, b, x, re, S, C, w, T, E, D, O, ie, ae, k, oe, A, j, M, N, P, F, I, L, R, z, B, V, H, U, W, se, ce, le, G, ue, de, K, fe, q, pe, me, he;
	function J() {
		this.fc = 0, this.dl = 0;
	}
	function ge() {
		this.dyn_tree = null, this.static_tree = null, this.extra_bits = null, this.extra_base = 0, this.elems = 0, this.max_length = 0, this.max_code = 0;
	}
	function Y(e, t, n, r) {
		this.good_length = e, this.max_lazy = t, this.nice_length = n, this.max_chain = r;
	}
	function _e() {
		this.next = null, this.len = 0, this.ptr = Array(t), this.off = 0;
	}
	let ve = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		1,
		1,
		1,
		1,
		2,
		2,
		2,
		2,
		3,
		3,
		3,
		3,
		4,
		4,
		4,
		4,
		5,
		5,
		5,
		5,
		0
	], X = [
		0,
		0,
		0,
		0,
		1,
		1,
		2,
		2,
		3,
		3,
		4,
		4,
		5,
		5,
		6,
		6,
		7,
		7,
		8,
		8,
		9,
		9,
		10,
		10,
		11,
		11,
		12,
		12,
		13,
		13
	], ye = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		2,
		3,
		7
	], be = [
		16,
		17,
		18,
		0,
		8,
		7,
		9,
		6,
		10,
		5,
		11,
		4,
		12,
		3,
		13,
		2,
		14,
		1,
		15
	], xe = [
		new Y(0, 0, 0, 0),
		new Y(4, 4, 8, 4),
		new Y(4, 5, 16, 8),
		new Y(4, 6, 32, 32),
		new Y(4, 4, 16, 16),
		new Y(8, 16, 32, 32),
		new Y(8, 16, 128, 128),
		new Y(8, 32, 128, 256),
		new Y(32, 128, 258, 1024),
		new Y(32, 258, 258, 4096)
	];
	function Se(e) {
		let i;
		if (e ? e < 1 ? e = 1 : e > 9 && (e = 9) : e = 6, k = e, d = !1, D = !1, f == null) {
			for (c = l = u = null, f = Array(t), h = Array(n), te = Array(r), ne = Array(32832), g = Array(65536), A = Array(573), i = 0; i < 573; i++) A[i] = new J();
			for (j = Array(61), i = 0; i < 61; i++) j[i] = new J();
			for (M = Array(288), i = 0; i < 288; i++) M[i] = new J();
			for (N = Array(30), i = 0; i < 30; i++) N[i] = new J();
			for (P = Array(39), i = 0; i < 39; i++) P[i] = new J();
			F = new ge(), I = new ge(), L = new ge(), R = Array(16), z = Array(573), H = Array(573), U = Array(256), W = Array(512), se = Array(29), ce = Array(30), le = Array(1024);
		}
	}
	function Ce(e) {
		e.next = c, c = e;
	}
	function we() {
		let e;
		return c == null ? e = new _e() : (e = c, c = c.next), e.next = null, e.len = e.off = 0, e;
	}
	function Te(t) {
		return g[e + t];
	}
	function Ee(t, n) {
		return g[e + t] = n;
	}
	function De(e) {
		f[m + p++] = e, m + p == t && tt();
	}
	function Oe(e) {
		e &= 65535, m + p < 8190 ? (f[m + p++] = e & 255, f[m + p++] = e >>> 8) : (De(e & 255), De(e >>> 8));
	}
	function ke() {
		b = (b << 5 ^ h[T + 3 - 1] & 255) & a, x = Te(b), g[T & o] = x, Ee(b, T);
	}
	function Z(e, t) {
		$(t[e].fc, t[e].dl);
	}
	function Ae(e) {
		return (e < 256 ? W[e] : W[256 + (e >> 7)]) & 255;
	}
	function je(e, t, n) {
		return e[t].fc < e[n].fc || e[t].fc == e[n].fc && H[t] <= H[n];
	}
	function Me(e, t, n) {
		let r;
		for (r = 0; r < n && he < me.length; r++) e[t + r] = me.charCodeAt(he++) & 255;
		return r;
	}
	function Ne() {
		let t;
		for (t = 0; t < i; t++) g[e + t] = 0;
		if (ae = xe[k].max_lazy, oe = xe[k].good_length, ie = xe[k].max_chain, T = 0, y = 0, O = Me(h, 0, 2 * e), O <= 0) {
			D = !0, O = 0;
			return;
		}
		for (D = !1; O < 262 && !D;) Fe();
		for (b = 0, t = 0; t < 2; t++) b = (b << 5 ^ h[t] & 255) & a;
	}
	function Pe(e) {
		let t = ie, n = T, r, i, a = w, c = T > s ? T - s : 0, l = T + 258, u = h[n + a - 1], d = h[n + a];
		w >= oe && (t >>= 2);
		do
			if (r = e, h[r + a] == d && h[r + a - 1] == u && h[r] == h[n] && h[++r] == h[n + 1]) {
				n += 2, r++;
				do				;
while (h[++n] == h[++r] && h[++n] == h[++r] && h[++n] == h[++r] && h[++n] == h[++r] && h[++n] == h[++r] && h[++n] == h[++r] && h[++n] == h[++r] && h[++n] == h[++r] && n < l);
				if (i = 258 - (l - n), n = l - 258, i > a) {
					if (E = e, a = i, i >= 258) break;
					u = h[n + a - 1], d = h[n + a];
				}
			}
		while ((e = g[e & o]) > c && --t != 0);
		return a;
	}
	function Fe() {
		let t, r, a = n - O - T;
		if (a == -1) a--;
		else if (T >= 65274) {
			for (t = 0; t < e; t++) h[t] = h[t + e];
			for (E -= e, T -= e, y -= e, t = 0; t < i; t++) r = Te(t), Ee(t, r >= e ? r - e : 0);
			for (t = 0; t < e; t++) r = g[t], g[t] = r >= e ? r - e : 0;
			a += e;
		}
		D || (t = Me(h, T + O, a), t <= 0 ? D = !0 : O += t);
	}
	function Ie() {
		for (; O != 0 && l == null;) {
			var e;
			if (ke(), x != 0 && T - x <= s && (C = Pe(x), C > O && (C = O)), C >= 3) {
				if (e = Q(T - E, C - 3), O -= C, C <= ae) {
					C--;
					do
						T++, ke();
					while (--C != 0);
					T++;
				} else T += C, C = 0, b = h[T] & 255, b = (b << 5 ^ h[T + 1] & 255) & a;
			} else e = Q(0, h[T] & 255), O--, T++;
			for (e && (Ze(0), y = T); O < 262 && !D;) Fe();
		}
	}
	function Le() {
		for (; O != 0 && l == null;) {
			if (ke(), w = C, re = E, C = 2, x != 0 && w < ae && T - x <= s && (C = Pe(x), C > O && (C = O), C == 3 && T - E > 4096 && C--), w >= 3 && C <= w) {
				var e = Q(T - 1 - re, w - 3);
				O -= w - 1, w -= 2;
				do
					T++, ke();
				while (--w != 0);
				S = 0, C = 2, T++, e && (Ze(0), y = T);
			} else S == 0 ? (S = 1, T++, O--) : (Q(0, h[T - 1] & 255) && (Ze(0), y = T), T++, O--);
			for (; O < 262 && !D;) Fe();
		}
	}
	function Re() {
		D || (_ = 0, v = 0, Ve(), Ne(), l = null, p = 0, m = 0, k <= 3 ? (w = 2, C = 0) : (C = 2, S = 0), ee = !1);
	}
	function ze(e, t, n) {
		let r;
		return !d && (Re(), d = !0, O == 0) ? (ee = !0, 0) : (r = Be(e, t, n)) == n ? n : ee ? r : (k <= 3 ? Ie() : Le(), O == 0 && (S != 0 && Q(0, h[T - 1] & 255), Ze(1), ee = !0), r + Be(e, r + t, n - r));
	}
	function Be(e, t, n) {
		let r, i, a;
		for (r = 0; l != null && r < n;) {
			for (i = n - r, i > l.len && (i = l.len), a = 0; a < i; a++) e[t + r + a] = l.ptr[l.off + a];
			if (l.off += i, l.len -= i, r += i, l.len == 0) {
				var o = l;
				l = l.next, Ce(o);
			}
		}
		if (r == n) return r;
		if (m < p) {
			for (i = n - r, i > p - m && (i = p - m), a = 0; a < i; a++) e[t + r + a] = f[m + a];
			m += i, r += i, p == m && (p = m = 0);
		}
		return r;
	}
	function Ve() {
		let e, t, n, r, i;
		if (N[0].dl == 0) {
			for (F.dyn_tree = A, F.static_tree = M, F.extra_bits = ve, F.extra_base = 257, F.elems = 286, F.max_length = 15, F.max_code = 0, I.dyn_tree = j, I.static_tree = N, I.extra_bits = X, I.extra_base = 0, I.elems = 30, I.max_length = 15, I.max_code = 0, L.dyn_tree = P, L.static_tree = null, L.extra_bits = ye, L.extra_base = 0, L.elems = 19, L.max_length = 7, L.max_code = 0, n = 0, r = 0; r < 28; r++) for (se[r] = n, e = 0; e < 1 << ve[r]; e++) U[n++] = r;
			for (U[n - 1] = r, i = 0, r = 0; r < 16; r++) for (ce[r] = i, e = 0; e < 1 << X[r]; e++) W[i++] = r;
			for (i >>= 7; r < 30; r++) for (ce[r] = i << 7, e = 0; e < 1 << X[r] - 7; e++) W[256 + i++] = r;
			for (t = 0; t <= 15; t++) R[t] = 0;
			for (e = 0; e <= 143;) M[e++].dl = 8, R[8]++;
			for (; e <= 255;) M[e++].dl = 9, R[9]++;
			for (; e <= 279;) M[e++].dl = 7, R[7]++;
			for (; e <= 287;) M[e++].dl = 8, R[8]++;
			for (Ge(M, 287), e = 0; e < 30; e++) N[e].dl = 5, N[e].fc = $e(e, 5);
			He();
		}
	}
	function He() {
		let e;
		for (e = 0; e < 286; e++) A[e].fc = 0;
		for (e = 0; e < 30; e++) j[e].fc = 0;
		for (e = 0; e < 19; e++) P[e].fc = 0;
		A[256].fc = 1, q = pe = 0, G = ue = de = 0, K = 0, fe = 1;
	}
	function Ue(e, t) {
		let n = z[t], r = t << 1;
		for (; r <= B && (r < B && je(e, z[r + 1], z[r]) && r++, !je(e, n, z[r]));) z[t] = z[r], t = r, r <<= 1;
		z[t] = n;
	}
	function We(e) {
		let t = e.dyn_tree, n = e.extra_bits, r = e.extra_base, { max_code: i } = e, { max_length: a } = e, o = e.static_tree, s, c, l, u, d, f, p = 0;
		for (u = 0; u <= 15; u++) R[u] = 0;
		for (t[z[V]].dl = 0, s = V + 1; s < 573; s++) c = z[s], u = t[t[c].dl].dl + 1, u > a && (u = a, p++), t[c].dl = u, !(c > i) && (R[u]++, d = 0, c >= r && (d = n[c - r]), f = t[c].fc, q += f * (u + d), o != null && (pe += f * (o[c].dl + d)));
		if (p != 0) {
			do {
				for (u = a - 1; R[u] == 0;) u--;
				R[u]--, R[u + 1] += 2, R[a]--, p -= 2;
			} while (p > 0);
			for (u = a; u != 0; u--) for (c = R[u]; c != 0;) l = z[--s], !(l > i) && (t[l].dl != u && (q += (u - t[l].dl) * t[l].fc, t[l].fc = u), c--);
		}
	}
	function Ge(e, t) {
		let n = Array(16), r = 0, i, a;
		for (i = 1; i <= 15; i++) r = r + R[i - 1] << 1, n[i] = r;
		for (a = 0; a <= t; a++) {
			let t = e[a].dl;
			t != 0 && (e[a].fc = $e(n[t]++, t));
		}
	}
	function Ke(e) {
		let t = e.dyn_tree, n = e.static_tree, { elems: r } = e, i, a, o = -1, s = r;
		for (B = 0, V = 573, i = 0; i < r; i++) t[i].fc == 0 ? t[i].dl = 0 : (z[++B] = o = i, H[i] = 0);
		for (; B < 2;) {
			let e = z[++B] = o < 2 ? ++o : 0;
			t[e].fc = 1, H[e] = 0, q--, n != null && (pe -= n[e].dl);
		}
		for (e.max_code = o, i = B >> 1; i >= 1; i--) Ue(t, i);
		do
			i = z[1], z[1] = z[B--], Ue(t, 1), a = z[1], z[--V] = i, z[--V] = a, t[s].fc = t[i].fc + t[a].fc, H[i] > H[a] + 1 ? H[s] = H[i] : H[s] = H[a] + 1, t[i].dl = t[a].dl = s, z[1] = s++, Ue(t, 1);
		while (B >= 2);
		z[--V] = z[1], We(e), Ge(t, o);
	}
	function qe(e, t) {
		let n, r = -1, i, a = e[0].dl, o = 0, s = 7, c = 4;
		for (a == 0 && (s = 138, c = 3), e[t + 1].dl = 65535, n = 0; n <= t; n++) i = a, a = e[n + 1].dl, !(++o < s && i == a) && (o < c ? P[i].fc += o : i == 0 ? o <= 10 ? P[17].fc++ : P[18].fc++ : (i != r && P[i].fc++, P[16].fc++), o = 0, r = i, a == 0 ? (s = 138, c = 3) : i == a ? (s = 6, c = 3) : (s = 7, c = 4));
	}
	function Je(e, t) {
		let n, r = -1, i, a = e[0].dl, o = 0, s = 7, c = 4;
		for (a == 0 && (s = 138, c = 3), n = 0; n <= t; n++) if (i = a, a = e[n + 1].dl, !(++o < s && i == a)) {
			if (o < c) do
				Z(i, P);
			while (--o != 0);
			else i == 0 ? o <= 10 ? (Z(17, P), $(o - 3, 3)) : (Z(18, P), $(o - 11, 7)) : (i != r && (Z(i, P), o--), Z(16, P), $(o - 3, 2));
			o = 0, r = i, a == 0 ? (s = 138, c = 3) : i == a ? (s = 6, c = 3) : (s = 7, c = 4);
		}
	}
	function Ye() {
		let e;
		for (qe(A, F.max_code), qe(j, I.max_code), Ke(L), e = 18; e >= 3 && P[be[e]].dl == 0; e--);
		return q += 3 * (e + 1) + 5 + 5 + 4, e;
	}
	function Xe(e, t, n) {
		let r;
		for ($(e - 257, 5), $(t - 1, 5), $(n - 4, 4), r = 0; r < n; r++) $(P[be[r]].dl, 3);
		Je(A, e - 1), Je(j, t - 1);
	}
	function Ze(e) {
		let t, n, r, i;
		if (i = T - y, le[de] = K, Ke(F), Ke(I), r = Ye(), t = q + 3 + 7 >> 3, n = pe + 3 + 7 >> 3, n <= t && (t = n), i + 4 <= t && y >= 0) {
			let t;
			for ($(0 + e, 3), et(), Oe(i), Oe(~i), t = 0; t < i; t++) De(h[y + t]);
		} else n == t ? ($(2 + e, 3), Qe(M, N)) : ($(4 + e, 3), Xe(F.max_code + 1, I.max_code + 1, r + 1), Qe(A, j));
		He(), e != 0 && et();
	}
	function Q(e, t) {
		if (ne[G++] = t, e == 0 ? A[t].fc++ : (e--, A[U[t] + 256 + 1].fc++, j[Ae(e)].fc++, te[ue++] = e, K |= fe), fe <<= 1, G & 7 || (le[de++] = K, K = 0, fe = 1), k > 2 && !(G & 4095)) {
			let e = G * 8, t = T - y, n;
			for (n = 0; n < 30; n++) e += j[n].fc * (5 + X[n]);
			if (e >>= 3, ue < parseInt(G / 2) && e < parseInt(t / 2)) return !0;
		}
		return G == 8191 || ue == r;
	}
	function Qe(e, t) {
		let n, r, i = 0, a = 0, o = 0, s = 0, c, l;
		if (G != 0) do
			i & 7 || (s = le[o++]), r = ne[i++] & 255, s & 1 ? (c = U[r], Z(c + 256 + 1, e), l = ve[c], l != 0 && (r -= se[c], $(r, l)), n = te[a++], c = Ae(n), Z(c, t), l = X[c], l != 0 && (n -= ce[c], $(n, l))) : Z(r, e), s >>= 1;
		while (i < G);
		Z(256, e);
	}
	function $(e, t) {
		v > 16 - t ? (_ |= e << v, Oe(_), _ = e >> 16 - v, v += t - 16) : (_ |= e << v, v += t);
	}
	function $e(e, t) {
		let n = 0;
		do
			n |= e & 1, e >>= 1, n <<= 1;
		while (--t > 0);
		return n >> 1;
	}
	function et() {
		v > 8 ? Oe(_) : v > 0 && De(_), _ = 0, v = 0;
	}
	function tt() {
		if (p != 0) {
			let e, t;
			for (e = we(), l == null ? l = u = e : u = u.next = e, e.len = p - m, t = 0; t < e.len; t++) e.ptr[t] = f[m + t];
			p = m = 0;
		}
	}
	return function(e, t) {
		let n, r;
		me = e, he = 0, t === void 0 && (t = 6), Se(t);
		let i = Array(1024), a = [];
		for (; (n = ze(i, 0, i.length)) > 0;) {
			let e = Array(n);
			for (r = 0; r < n; r++) e[r] = String.fromCharCode(i[r]);
			a[a.length] = e.join("");
		}
		return me = null, a.join("");
	};
})();
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/typeof.js
function i(e) {
	"@babel/helpers - typeof";
	return i = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, i(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/toPrimitive.js
function a(e, t) {
	if (i(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (i(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/toPropertyKey.js
function o(e) {
	var t = a(e, "string");
	return i(t) == "symbol" ? t : t + "";
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/defineProperty.js
function s(e, t, n) {
	return (t = o(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
//#endregion
//#region \0@oxc-project+runtime@0.143.0/helpers/esm/objectSpread2.js
function c(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function l(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? c(Object(n), !0).forEach(function(t) {
			s(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : c(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
//#endregion
//#region src/addons/cherry-code-block-plantuml-plugin.js
function u(e) {
	let t = "";
	for (let n = 0; n < e.length; n += 3) n + 2 === e.length ? t += d(e.charCodeAt(n), e.charCodeAt(n + 1), 0) : n + 1 === e.length ? t += d(e.charCodeAt(n), 0, 0) : t += d(e.charCodeAt(n), e.charCodeAt(n + 1), e.charCodeAt(n + 2));
	return t;
}
function d(e, t, n) {
	let r = e >> 2, i = (e & 3) << 4 | t >> 4, a = (t & 15) << 2 | n >> 6, o = n & 63, s = "";
	return s += f(r & 63), s += f(i & 63), s += f(a & 63), s += f(o & 63), s;
}
function f(e) {
	let t = e;
	return t < 10 ? String.fromCharCode(48 + t) : (t -= 10, t < 26 ? String.fromCharCode(65 + t) : (t -= 26, t < 26 ? String.fromCharCode(97 + t) : (t -= 26, t === 0 ? "-" : t === 1 ? "_" : "?")));
}
function p(e, t) {
	return `${t}/svg/${u(r(unescape(encodeURIComponent(e)), 9))}`;
}
var m = class e {
	static install(t, r) {
		var i;
		n(t, { engine: { syntax: { codeBlock: { customRenderer: { plantuml: new e(l(l({}, r), (i = t.engine.syntax.plantuml) == null ? {} : i)) } } } } });
	}
	constructor(e = {}) {
		var t;
		this.baseUrl = (t = e.baseUrl) == null ? "http://www.plantuml.com/plantuml" : t;
	}
	render(e, t) {
		let n = t;
		return n || (n = Math.round(Math.random() * 1e8)), `<img id="${`plantuml-${n}-${(/* @__PURE__ */ new Date()).getTime()}`}" src="${p(e, this.baseUrl)}" />`;
	}
};
//#endregion
export { m as default };
