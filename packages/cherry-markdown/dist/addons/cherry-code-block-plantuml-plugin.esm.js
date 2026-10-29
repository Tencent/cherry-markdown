// src/utils/toolkit/isPlainObject.js
function e(e) {
	if (typeof e != "object" || !e) return !1;
	let t = Object.getPrototypeOf(e);
	return t === Object.prototype || t === null;
}
// src/utils/toolkit/mergeWith.js
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
function r(e) {
	let t = e.length;
	for (; --t >= 0;) e[t] = 0;
}
var i = 29, a = 30, o = new Uint8Array([
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
]), s = new Uint8Array([
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
]), c = new Uint8Array([
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
]), l = new Uint8Array([
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
]), u = 512, d = Array(576);
r(d);
var f = Array(60);
r(f);
var p = Array(u);
r(p);
var m = Array(256);
r(m);
var h = Array(i);
r(h);
var g = Array(a);
r(g);
function _(e, t, n, r, i) {
	this.static_tree = e, this.extra_bits = t, this.extra_base = n, this.elems = r, this.max_length = i, this.has_stree = e && e.length;
}
var v, y, b;
function x(e, t) {
	this.dyn_tree = e, this.max_code = 0, this.stat_desc = t;
}
var S = (e) => e < 256 ? p[e] : p[256 + (e >>> 7)], C = (e, t) => {
	e.pending_buf[e.pending++] = t & 255, e.pending_buf[e.pending++] = t >>> 8 & 255;
}, w = (e, t, n) => {
	e.bi_valid > 16 - n ? (e.bi_buf |= t << e.bi_valid & 65535, C(e, e.bi_buf), e.bi_buf = t >> 16 - e.bi_valid, e.bi_valid += n - 16) : (e.bi_buf |= t << e.bi_valid & 65535, e.bi_valid += n);
}, T = (e, t, n) => {
	w(e, n[t * 2], n[t * 2 + 1]);
}, E = (e, t) => {
	let n = 0;
	do
		n |= e & 1, e >>>= 1, n <<= 1;
	while (--t > 0);
	return n >>> 1;
}, D = (e) => {
	e.bi_valid === 16 ? (C(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : e.bi_valid >= 8 && (e.pending_buf[e.pending++] = e.bi_buf & 255, e.bi_buf >>= 8, e.bi_valid -= 8);
}, O = (e, t) => {
	let n = t.dyn_tree, r = t.max_code, i = t.stat_desc.static_tree, a = t.stat_desc.has_stree, o = t.stat_desc.extra_bits, s = t.stat_desc.extra_base, c = t.stat_desc.max_length, l, u, d, f, p, m, h = 0;
	for (f = 0; f <= 15; f++) e.bl_count[f] = 0;
	for (n[e.heap[e.heap_max] * 2 + 1] = 0, l = e.heap_max + 1; l < 573; l++) u = e.heap[l], f = n[n[u * 2 + 1] * 2 + 1] + 1, f > c && (f = c, h++), n[u * 2 + 1] = f, !(u > r) && (e.bl_count[f]++, p = 0, u >= s && (p = o[u - s]), m = n[u * 2], e.opt_len += m * (f + p), a && (e.static_len += m * (i[u * 2 + 1] + p)));
	if (h !== 0) {
		do {
			for (f = c - 1; e.bl_count[f] === 0;) f--;
			e.bl_count[f]--, e.bl_count[f + 1] += 2, e.bl_count[c]--, h -= 2;
		} while (h > 0);
		for (f = c; f !== 0; f--) for (u = e.bl_count[f]; u !== 0;) d = e.heap[--l], !(d > r) && (n[d * 2 + 1] !== f && (e.opt_len += (f - n[d * 2 + 1]) * n[d * 2], n[d * 2 + 1] = f), u--);
	}
}, ee = (e, t, n) => {
	let r = Array(16), i = 0, a, o;
	for (a = 1; a <= 15; a++) i = i + n[a - 1] << 1, r[a] = i;
	for (o = 0; o <= t; o++) {
		let t = e[o * 2 + 1];
		t !== 0 && (e[o * 2] = E(r[t]++, t));
	}
}, te = () => {
	let e, t, n, r, i, l = Array(16);
	for (n = 0, r = 0; r < 28; r++) for (h[r] = n, e = 0; e < 1 << o[r]; e++) m[n++] = r;
	for (m[n - 1] = r, i = 0, r = 0; r < 16; r++) for (g[r] = i, e = 0; e < 1 << s[r]; e++) p[i++] = r;
	for (i >>= 7; r < a; r++) for (g[r] = i << 7, e = 0; e < 1 << s[r] - 7; e++) p[256 + i++] = r;
	for (t = 0; t <= 15; t++) l[t] = 0;
	for (e = 0; e <= 143;) d[e * 2 + 1] = 8, e++, l[8]++;
	for (; e <= 255;) d[e * 2 + 1] = 9, e++, l[9]++;
	for (; e <= 279;) d[e * 2 + 1] = 7, e++, l[7]++;
	for (; e <= 287;) d[e * 2 + 1] = 8, e++, l[8]++;
	for (ee(d, 287, l), e = 0; e < a; e++) f[e * 2 + 1] = 5, f[e * 2] = E(e, 5);
	v = new _(d, o, 257, 286, 15), y = new _(f, s, 0, a, 15), b = new _([], c, 0, 19, 7);
}, ne = (e) => {
	let t = 0;
	for (; t < 286; t++) e.dyn_ltree[t * 2] = 0;
	for (t = 0; t < a; t++) e.dyn_dtree[t * 2] = 0;
	for (t = 0; t < 19; t++) e.bl_tree[t * 2] = 0;
	e.dyn_ltree[512] = 1, e.opt_len = e.static_len = 0, e.sym_next = e.matches = 0;
}, re = (e) => {
	e.bi_valid > 8 ? C(e, e.bi_buf) : e.bi_valid > 0 && (e.pending_buf[e.pending++] = e.bi_buf), e.bi_buf = 0, e.bi_valid = 0;
}, ie = (e, t, n, r) => {
	let i = t * 2, a = n * 2;
	return e[i] < e[a] || e[i] === e[a] && r[t] <= r[n];
}, ae = (e, t, n) => {
	let r = e.heap[n], i = n << 1;
	for (; i <= e.heap_len && (i < e.heap_len && ie(t, e.heap[i + 1], e.heap[i], e.depth) && i++, !ie(t, r, e.heap[i], e.depth));) e.heap[n] = e.heap[i], n = i, i <<= 1;
	e.heap[n] = r;
}, oe = (e, t, n) => {
	let r, i, a = 0, c, l;
	if (e.sym_next !== 0) do
		r = e.pending_buf[e.sym_buf + a++] & 255, r += (e.pending_buf[e.sym_buf + a++] & 255) << 8, i = e.pending_buf[e.sym_buf + a++], r === 0 ? T(e, i, t) : (c = m[i], T(e, c + 256 + 1, t), l = o[c], l !== 0 && (i -= h[c], w(e, i, l)), r--, c = S(r), T(e, c, n), l = s[c], l !== 0 && (r -= g[c], w(e, r, l)));
	while (a < e.sym_next);
	T(e, 256, t);
}, se = (e, t) => {
	let n = t.dyn_tree, r = t.stat_desc.static_tree, i = t.stat_desc.has_stree, a = t.stat_desc.elems, o, s, c = -1, l;
	for (e.heap_len = 0, e.heap_max = 573, o = 0; o < a; o++) n[o * 2] === 0 ? n[o * 2 + 1] = 0 : (e.heap[++e.heap_len] = c = o, e.depth[o] = 0);
	for (; e.heap_len < 2;) l = e.heap[++e.heap_len] = c < 2 ? ++c : 0, n[l * 2] = 1, e.depth[l] = 0, e.opt_len--, i && (e.static_len -= r[l * 2 + 1]);
	for (t.max_code = c, o = e.heap_len >> 1; o >= 1; o--) ae(e, n, o);
	l = a;
	do
		o = e.heap[1], e.heap[1] = e.heap[e.heap_len--], ae(e, n, 1), s = e.heap[1], e.heap[--e.heap_max] = o, e.heap[--e.heap_max] = s, n[l * 2] = n[o * 2] + n[s * 2], e.depth[l] = (e.depth[o] >= e.depth[s] ? e.depth[o] : e.depth[s]) + 1, n[o * 2 + 1] = n[s * 2 + 1] = l, e.heap[1] = l++, ae(e, n, 1);
	while (e.heap_len >= 2);
	e.heap[--e.heap_max] = e.heap[1], O(e, t), ee(n, c, e.bl_count);
}, ce = (e, t, n) => {
	let r, i = -1, a, o = t[1], s = 0, c = 7, l = 4;
	for (o === 0 && (c = 138, l = 3), t[(n + 1) * 2 + 1] = 65535, r = 0; r <= n; r++) a = o, o = t[(r + 1) * 2 + 1], !(++s < c && a === o) && (s < l ? e.bl_tree[a * 2] += s : a === 0 ? s <= 10 ? e.bl_tree[34]++ : e.bl_tree[36]++ : (a !== i && e.bl_tree[a * 2]++, e.bl_tree[32]++), s = 0, i = a, o === 0 ? (c = 138, l = 3) : a === o ? (c = 6, l = 3) : (c = 7, l = 4));
}, le = (e, t, n) => {
	let r, i = -1, a, o = t[1], s = 0, c = 7, l = 4;
	for (o === 0 && (c = 138, l = 3), r = 0; r <= n; r++) if (a = o, o = t[(r + 1) * 2 + 1], !(++s < c && a === o)) {
		if (s < l) do
			T(e, a, e.bl_tree);
		while (--s !== 0);
		else a === 0 ? s <= 10 ? (T(e, 17, e.bl_tree), w(e, s - 3, 3)) : (T(e, 18, e.bl_tree), w(e, s - 11, 7)) : (a !== i && (T(e, a, e.bl_tree), s--), T(e, 16, e.bl_tree), w(e, s - 3, 2));
		s = 0, i = a, o === 0 ? (c = 138, l = 3) : a === o ? (c = 6, l = 3) : (c = 7, l = 4);
	}
}, ue = (e) => {
	let t;
	for (ce(e, e.dyn_ltree, e.l_desc.max_code), ce(e, e.dyn_dtree, e.d_desc.max_code), se(e, e.bl_desc), t = 18; t >= 3 && e.bl_tree[l[t] * 2 + 1] === 0; t--);
	return e.opt_len += 3 * (t + 1) + 5 + 5 + 4, t;
}, de = (e, t, n, r) => {
	let i;
	for (w(e, t - 257, 5), w(e, n - 1, 5), w(e, r - 4, 4), i = 0; i < r; i++) w(e, e.bl_tree[l[i] * 2 + 1], 3);
	le(e, e.dyn_ltree, t - 1), le(e, e.dyn_dtree, n - 1);
}, fe = (e) => {
	let t = 4093624447, n = 0;
	for (; n <= 31; n++, t >>>= 1) if (t & 1 && e.dyn_ltree[n * 2] !== 0) return 0;
	if (e.dyn_ltree[18] !== 0 || e.dyn_ltree[20] !== 0 || e.dyn_ltree[26] !== 0) return 1;
	for (n = 32; n < 256; n++) if (e.dyn_ltree[n * 2] !== 0) return 1;
	return 0;
}, pe = !1, me = (e) => {
	pe || (te(), pe = !0), e.l_desc = new x(e.dyn_ltree, v), e.d_desc = new x(e.dyn_dtree, y), e.bl_desc = new x(e.bl_tree, b), e.bi_buf = 0, e.bi_valid = 0, ne(e);
}, he = (e, t, n, r) => {
	w(e, 0 + +!!r, 3), re(e), C(e, n), C(e, ~n), n && e.pending_buf.set(e.window.subarray(t, t + n), e.pending), e.pending += n;
}, ge = {
	_tr_init: me,
	_tr_stored_block: he,
	_tr_flush_block: (e, t, n, r) => {
		let i, a, o = 0;
		e.level > 0 ? (e.strm.data_type === 2 && (e.strm.data_type = fe(e)), se(e, e.l_desc), se(e, e.d_desc), o = ue(e), i = e.opt_len + 3 + 7 >>> 3, a = e.static_len + 3 + 7 >>> 3, a <= i && (i = a)) : i = a = n + 5, n + 4 <= i && t !== -1 ? he(e, t, n, r) : e.strategy === 4 || a === i ? (w(e, 2 + +!!r, 3), oe(e, d, f)) : (w(e, 4 + +!!r, 3), de(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, o + 1), oe(e, e.dyn_ltree, e.dyn_dtree)), ne(e), r && re(e);
	},
	_tr_tally: (e, t, n) => (e.pending_buf[e.sym_buf + e.sym_next++] = t, e.pending_buf[e.sym_buf + e.sym_next++] = t >> 8, e.pending_buf[e.sym_buf + e.sym_next++] = n, t === 0 ? e.dyn_ltree[n * 2]++ : (e.matches++, t--, e.dyn_ltree[(m[n] + 256 + 1) * 2]++, e.dyn_dtree[S(t) * 2]++), e.sym_next === e.sym_end),
	_tr_align: (e) => {
		w(e, 2, 3), T(e, 256, d), D(e);
	}
}, _e = (e, t, n, r) => {
	let i = e & 65535, a = e >>> 16 & 65535, o = 0;
	for (; n !== 0;) {
		o = n > 2e3 ? 2e3 : n, n -= o;
		do
			i = i + t[r++] | 0, a = a + i | 0;
		while (--o);
		i %= 65521, a %= 65521;
	}
	return i | a << 16;
}, ve = new Uint32Array((() => {
	let e, t = [];
	for (var n = 0; n < 256; n++) {
		e = n;
		for (var r = 0; r < 8; r++) e = e & 1 ? 3988292384 ^ e >>> 1 : e >>> 1;
		t[n] = e;
	}
	return t;
})()), k = (e, t, n, r) => {
	let i = ve, a = r + n;
	e ^= -1;
	for (let n = r; n < a; n++) e = e >>> 8 ^ i[(e ^ t[n]) & 255];
	return e ^ -1;
}, ye = {
	2: "need dictionary",
	1: "stream end",
	0: "",
	"-1": "file error",
	"-2": "stream error",
	"-3": "data error",
	"-4": "insufficient memory",
	"-5": "buffer error",
	"-6": "incompatible version"
}, be = {
	Z_NO_FLUSH: 0,
	Z_PARTIAL_FLUSH: 1,
	Z_SYNC_FLUSH: 2,
	Z_FULL_FLUSH: 3,
	Z_FINISH: 4,
	Z_BLOCK: 5,
	Z_TREES: 6,
	Z_OK: 0,
	Z_STREAM_END: 1,
	Z_NEED_DICT: 2,
	Z_ERRNO: -1,
	Z_STREAM_ERROR: -2,
	Z_DATA_ERROR: -3,
	Z_MEM_ERROR: -4,
	Z_BUF_ERROR: -5,
	Z_NO_COMPRESSION: 0,
	Z_BEST_SPEED: 1,
	Z_BEST_COMPRESSION: 9,
	Z_DEFAULT_COMPRESSION: -1,
	Z_FILTERED: 1,
	Z_HUFFMAN_ONLY: 2,
	Z_RLE: 3,
	Z_FIXED: 4,
	Z_DEFAULT_STRATEGY: 0,
	Z_BINARY: 0,
	Z_TEXT: 1,
	Z_UNKNOWN: 2,
	Z_DEFLATED: 8
}, { _tr_init: xe, _tr_stored_block: Se, _tr_flush_block: Ce, _tr_tally: A, _tr_align: we } = ge, { Z_NO_FLUSH: j, Z_PARTIAL_FLUSH: Te, Z_FULL_FLUSH: Ee, Z_FINISH: M, Z_BLOCK: De, Z_OK: N, Z_STREAM_END: Oe, Z_STREAM_ERROR: P, Z_DATA_ERROR: ke, Z_BUF_ERROR: Ae, Z_DEFAULT_COMPRESSION: je, Z_FILTERED: Me, Z_HUFFMAN_ONLY: Ne, Z_RLE: Pe, Z_FIXED: Fe, Z_DEFAULT_STRATEGY: Ie, Z_UNKNOWN: Le, Z_DEFLATED: Re } = be, ze = 9, Be = 15, Ve = 8, He = 573, F = 3, I = 258, L = 262, Ue = 32, We = 42, Ge = 57, Ke = 69, qe = 73, Je = 91, Ye = 103, R = 113, Xe = 666, z = 1, Ze = 2, B = 3, Qe = 4, $e = 3, V = (e, t) => (e.msg = ye[t], t), et = (e) => e * 2 - (e > 4 ? 9 : 0), H = (e) => {
	let t = e.length;
	for (; --t >= 0;) e[t] = 0;
}, tt = (e) => {
	let t, n, r, i = e.w_size;
	t = e.hash_size, r = t;
	do
		n = e.head[--r], e.head[r] = n >= i ? n - i : 0;
	while (--t);
	t = i, r = t;
	do
		n = e.prev[--r], e.prev[r] = n >= i ? n - i : 0;
	while (--t);
}, nt = (e, t, n) => (t << e.hash_shift ^ n) & e.hash_mask, U = (e, t) => {
	let n;
	if (e.legacy_hash) n = e.ins_h = nt(e, e.ins_h, e.window[t + F - 1]);
	else {
		let r = e.window, i = r[t] | r[t + 1] << 8 | r[t + 2] << 16 | r[t + 3] << 24;
		n = e.ins_h = Math.imul(i, 66521) + 66521 >>> 16 & e.hash_mask;
	}
	let r = e.prev[t & e.w_mask] = e.head[n];
	return e.head[n] = t, r;
}, W = (e) => {
	let t = e.state, n = t.pending;
	n > e.avail_out && (n = e.avail_out), n !== 0 && (e.output.set(t.pending_buf.subarray(t.pending_out, t.pending_out + n), e.next_out), e.next_out += n, t.pending_out += n, e.total_out += n, e.avail_out -= n, t.pending -= n, t.pending === 0 && (t.pending_out = 0));
}, G = (e, t) => {
	Ce(e, e.block_start >= 0 ? e.block_start : -1, e.strstart - e.block_start, t), e.block_start = e.strstart, W(e.strm);
}, K = (e, t) => {
	e.pending_buf[e.pending++] = t;
}, rt = (e, t) => {
	e.pending_buf[e.pending++] = t >>> 8 & 255, e.pending_buf[e.pending++] = t & 255;
}, it = (e, t, n, r) => {
	let i = e.avail_in;
	return i > r && (i = r), i === 0 ? 0 : (e.avail_in -= i, t.set(e.input.subarray(e.next_in, e.next_in + i), n), e.state.wrap === 1 ? e.adler = _e(e.adler, t, i, n) : e.state.wrap === 2 && (e.adler = k(e.adler, t, i, n)), e.next_in += i, e.total_in += i, i);
}, at = (e, t) => {
	let n = e.max_chain_length, r = e.strstart, i, a, o = e.prev_length, s = e.nice_match, c = e.strstart > e.w_size - L ? e.strstart - (e.w_size - L) : 0, l = e.window, u = e.w_mask, d = e.prev, f = e.strstart + I, p = l[r + o - 1], m = l[r + o];
	e.prev_length >= e.good_match && (n >>= 2), s > e.lookahead && (s = e.lookahead);
	do
		if (i = t, l[i + o] === m && l[i + o - 1] === p && l[i] === l[r] && l[++i] === l[r + 1]) {
			r += 2, i++;
			do;
			while (l[++r] === l[++i] && l[++r] === l[++i] && l[++r] === l[++i] && l[++r] === l[++i] && l[++r] === l[++i] && l[++r] === l[++i] && l[++r] === l[++i] && l[++r] === l[++i] && r < f);
			if (a = I - (f - r), r = f - I, a > o) {
				if (e.match_start = t, o = a, a >= s) break;
				p = l[r + o - 1], m = l[r + o];
			}
		}
	while ((t = d[t & u]) > c && --n !== 0);
	return o <= e.lookahead ? o : e.lookahead;
}, ot = (e) => {
	let t = e.w_size, n, r, i;
	do {
		if (r = e.window_size - e.lookahead - e.strstart, e.strstart >= t + (t - L) && (e.window.set(e.window.subarray(t, t + t - r), 0), e.match_start -= t, e.strstart -= t, e.block_start -= t, e.insert > e.strstart && (e.insert = e.strstart), tt(e), r += t), e.strm.avail_in === 0) break;
		if (n = it(e.strm, e.window, e.strstart + e.lookahead, r), e.lookahead += n, !e.legacy_hash) {
			if (e.lookahead + e.insert > F) for (i = e.strstart - e.insert; e.insert && (U(e, i), i++, e.insert--, !(e.lookahead + e.insert <= F)););
		} else if (e.lookahead + e.insert >= F) for (i = e.strstart - e.insert, e.ins_h = e.window[i], e.ins_h = nt(e, e.ins_h, e.window[i + 1]); e.insert && (U(e, i), i++, e.insert--, !(e.lookahead + e.insert < F)););
	} while (e.lookahead < L && e.strm.avail_in !== 0);
}, st = (e, t) => {
	let n = e.pending_buf_size - 5 > e.w_size ? e.w_size : e.pending_buf_size - 5, r, i, a, o = 0, s = e.strm.avail_in;
	do {
		if (r = 65535, a = e.bi_valid + 42 >> 3, e.strm.avail_out < a || (a = e.strm.avail_out - a, i = e.strstart - e.block_start, r > i + e.strm.avail_in && (r = i + e.strm.avail_in), r > a && (r = a), r < n && (r === 0 && t !== M || t === j || r !== i + e.strm.avail_in))) break;
		o = +(t === M && r === i + e.strm.avail_in), Se(e, 0, 0, o), e.pending_buf[e.pending - 4] = r, e.pending_buf[e.pending - 3] = r >> 8, e.pending_buf[e.pending - 2] = ~r, e.pending_buf[e.pending - 1] = ~r >> 8, W(e.strm), i && (i > r && (i = r), e.strm.output.set(e.window.subarray(e.block_start, e.block_start + i), e.strm.next_out), e.strm.next_out += i, e.strm.avail_out -= i, e.strm.total_out += i, e.block_start += i, r -= i), r && (it(e.strm, e.strm.output, e.strm.next_out, r), e.strm.next_out += r, e.strm.avail_out -= r, e.strm.total_out += r);
	} while (o === 0);
	return s -= e.strm.avail_in, s && (s >= e.w_size ? (e.matches = 2, e.window.set(e.strm.input.subarray(e.strm.next_in - e.w_size, e.strm.next_in), 0), e.strstart = e.w_size, e.insert = e.strstart) : (e.window_size - e.strstart <= s && (e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, e.insert > e.strstart && (e.insert = e.strstart)), e.window.set(e.strm.input.subarray(e.strm.next_in - s, e.strm.next_in), e.strstart), e.strstart += s, e.insert += s > e.w_size - e.insert ? e.w_size - e.insert : s), e.block_start = e.strstart), e.high_water < e.strstart && (e.high_water = e.strstart), o ? Qe : t !== j && t !== M && e.strm.avail_in === 0 && e.strstart === e.block_start ? Ze : (a = e.window_size - e.strstart, e.strm.avail_in > a && e.block_start >= e.w_size && (e.block_start -= e.w_size, e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, a += e.w_size, e.insert > e.strstart && (e.insert = e.strstart)), a > e.strm.avail_in && (a = e.strm.avail_in), a && (it(e.strm, e.window, e.strstart, a), e.strstart += a, e.insert += a > e.w_size - e.insert ? e.w_size - e.insert : a), e.high_water < e.strstart && (e.high_water = e.strstart), a = e.bi_valid + 42 >> 3, a = e.pending_buf_size - a > 65535 ? 65535 : e.pending_buf_size - a, n = a > e.w_size ? e.w_size : a, i = e.strstart - e.block_start, (i >= n || (i || t === M) && t !== j && e.strm.avail_in === 0 && i <= a) && (r = i > a ? a : i, o = +(t === M && e.strm.avail_in === 0 && r === i), Se(e, e.block_start, r, o), e.block_start += r, W(e.strm)), o ? B : z);
}, ct = (e, t) => {
	let n, r;
	for (;;) {
		if (e.lookahead < L) {
			if (ot(e), e.lookahead < L && t === j) return z;
			if (e.lookahead === 0) break;
		}
		if (n = 0, e.lookahead >= F && (n = U(e, e.strstart)), n !== 0 && e.strstart - n <= e.w_size - L && (e.match_length = at(e, n)), e.match_length >= F) {
			if (r = A(e, e.strstart - e.match_start, e.match_length - F), e.lookahead -= e.match_length, e.match_length <= e.max_lazy_match && e.lookahead >= F) {
				e.match_length--;
				do
					e.strstart++, n = U(e, e.strstart);
				while (--e.match_length !== 0);
				e.strstart++;
			} else e.strstart += e.match_length, e.match_length = 0, e.legacy_hash && (e.ins_h = e.window[e.strstart], e.ins_h = nt(e, e.ins_h, e.window[e.strstart + 1]));
		} else r = A(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++;
		if (r && (G(e, !1), e.strm.avail_out === 0)) return z;
	}
	return e.insert = e.strstart < 2 ? e.strstart : 2, t === M ? (G(e, !0), e.strm.avail_out === 0 ? B : Qe) : e.sym_next && (G(e, !1), e.strm.avail_out === 0) ? z : Ze;
}, lt = (e, t) => {
	let n, r, i;
	for (;;) {
		if (e.lookahead < L) {
			if (ot(e), e.lookahead < L && t === j) return z;
			if (e.lookahead === 0) break;
		}
		if (n = 0, e.lookahead >= F && (n = U(e, e.strstart)), e.prev_length = e.match_length, e.prev_match = e.match_start, e.match_length = 2, n !== 0 && e.prev_length < e.max_lazy_match && e.strstart - n <= e.w_size - L && (e.match_length = at(e, n), e.match_length <= 5 && (e.strategy === Me || e.match_length === F && e.strstart - e.match_start > 4096) && (e.match_length = 2)), e.prev_length >= F && e.match_length <= e.prev_length) {
			i = e.strstart + e.lookahead - F, r = A(e, e.strstart - 1 - e.prev_match, e.prev_length - F), e.lookahead -= e.prev_length - 1, e.prev_length -= 2;
			do
				++e.strstart <= i && (n = U(e, e.strstart));
			while (--e.prev_length !== 0);
			if (e.match_available = 0, e.match_length = 2, e.strstart++, r && (G(e, !1), e.strm.avail_out === 0)) return z;
		} else if (e.match_available) {
			if (r = A(e, 0, e.window[e.strstart - 1]), r && G(e, !1), e.strstart++, e.lookahead--, e.strm.avail_out === 0) return z;
		} else e.match_available = 1, e.strstart++, e.lookahead--;
	}
	return e.match_available && (r = A(e, 0, e.window[e.strstart - 1]), e.match_available = 0), e.insert = e.strstart < 2 ? e.strstart : 2, t === M ? (G(e, !0), e.strm.avail_out === 0 ? B : Qe) : e.sym_next && (G(e, !1), e.strm.avail_out === 0) ? z : Ze;
}, ut = (e, t) => {
	let n, r, i, a, o = e.window;
	for (;;) {
		if (e.lookahead <= I) {
			if (ot(e), e.lookahead <= I && t === j) return z;
			if (e.lookahead === 0) break;
		}
		if (e.match_length = 0, e.lookahead >= F && e.strstart > 0 && (i = e.strstart - 1, r = o[i], r === o[++i] && r === o[++i] && r === o[++i])) {
			a = e.strstart + I;
			do;
			while (r === o[++i] && r === o[++i] && r === o[++i] && r === o[++i] && r === o[++i] && r === o[++i] && r === o[++i] && r === o[++i] && i < a);
			e.match_length = I - (a - i), e.match_length > e.lookahead && (e.match_length = e.lookahead);
		}
		if (e.match_length >= F ? (n = A(e, 1, e.match_length - F), e.lookahead -= e.match_length, e.strstart += e.match_length, e.match_length = 0) : (n = A(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++), n && (G(e, !1), e.strm.avail_out === 0)) return z;
	}
	return e.insert = 0, t === M ? (G(e, !0), e.strm.avail_out === 0 ? B : Qe) : e.sym_next && (G(e, !1), e.strm.avail_out === 0) ? z : Ze;
}, dt = (e, t) => {
	let n;
	for (;;) {
		if (e.lookahead === 0 && (ot(e), e.lookahead === 0)) {
			if (t === j) return z;
			break;
		}
		if (e.match_length = 0, n = A(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++, n && (G(e, !1), e.strm.avail_out === 0)) return z;
	}
	return e.insert = 0, t === M ? (G(e, !0), e.strm.avail_out === 0 ? B : Qe) : e.sym_next && (G(e, !1), e.strm.avail_out === 0) ? z : Ze;
};
function q(e, t, n, r, i) {
	this.good_length = e, this.max_lazy = t, this.nice_length = n, this.max_chain = r, this.func = i;
}
var ft = [
	new q(0, 0, 0, 0, st),
	new q(4, 4, 8, 4, ct),
	new q(4, 5, 16, 8, ct),
	new q(4, 6, 32, 32, ct),
	new q(4, 4, 16, 16, lt),
	new q(8, 16, 32, 32, lt),
	new q(8, 16, 128, 128, lt),
	new q(8, 32, 128, 256, lt),
	new q(32, 128, 258, 1024, lt),
	new q(32, 258, 258, 4096, lt)
], pt = (e) => {
	e.window_size = 2 * e.w_size, H(e.head), e.max_lazy_match = ft[e.level].max_lazy, e.good_match = ft[e.level].good_length, e.nice_match = ft[e.level].nice_length, e.max_chain_length = ft[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = 2, e.match_available = 0, e.ins_h = 0;
};
function mt() {
	this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Re, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.legacy_hash = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(He * 2), this.dyn_dtree = /* @__PURE__ */ new Uint16Array(122), this.bl_tree = /* @__PURE__ */ new Uint16Array(78), H(this.dyn_ltree), H(this.dyn_dtree), H(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = /* @__PURE__ */ new Uint16Array(16), this.heap = /* @__PURE__ */ new Uint16Array(573), H(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = /* @__PURE__ */ new Uint16Array(573), H(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
var ht = (e) => {
	if (!e) return 1;
	let t = e.state;
	return +(!t || t.strm !== e || t.status !== We && t.status !== Ge && t.status !== Ke && t.status !== qe && t.status !== Je && t.status !== Ye && t.status !== R && t.status !== Xe);
}, gt = (e) => {
	if (ht(e)) return V(e, P);
	e.total_in = e.total_out = 0, e.data_type = Le;
	let t = e.state;
	return t.pending = 0, t.pending_out = 0, t.wrap < 0 && (t.wrap = -t.wrap), t.status = t.wrap === 2 ? Ge : t.wrap ? We : R, e.adler = t.wrap === 2 ? 0 : 1, t.last_flush = -2, xe(t), N;
}, _t = (e) => {
	let t = gt(e);
	return t === N && pt(e.state), t;
}, vt = (e, t) => ht(e) || e.state.wrap !== 2 ? P : (e.state.gzhead = t, N), yt = (e, t, n, r, i, a, o) => {
	if (!e) return P;
	let s = 1;
	if (t === je && (t = 6), r < 0 ? (s = 0, r = -r) : r > 15 && (s = 2, r -= 16), i < 1 || i > ze || n !== Re || r < 8 || r > 15 || t < 0 || t > 9 || a < 0 || a > Fe || r === 8 && s !== 1) return V(e, P);
	r === 8 && (r = 9);
	let c = new mt();
	return e.state = c, c.strm = e, c.status = We, c.wrap = s, c.gzhead = null, c.w_bits = r, c.w_size = 1 << c.w_bits, c.w_mask = c.w_size - 1, c.legacy_hash = +!!o, c.hash_bits = i + 7, !c.legacy_hash && c.hash_bits < 15 && (c.hash_bits = 15), c.hash_size = 1 << c.hash_bits, c.hash_mask = c.hash_size - 1, c.hash_shift = ~~((c.hash_bits + F - 1) / F), c.window = new Uint8Array(c.w_size * 2), c.head = new Uint16Array(c.hash_size), c.prev = new Uint16Array(c.w_size), c.lit_bufsize = 1 << i + 6, c.pending_buf_size = c.lit_bufsize * 4, c.pending_buf = new Uint8Array(c.pending_buf_size), c.sym_buf = c.lit_bufsize, c.sym_end = (c.lit_bufsize - 1) * 3, c.level = t, c.strategy = a, c.method = n, _t(e);
}, bt = {
	deflateInit: (e, t) => yt(e, t, Re, Be, Ve, Ie),
	deflateInit2: yt,
	deflateReset: _t,
	deflateResetKeep: gt,
	deflateSetHeader: vt,
	deflate: (e, t) => {
		if (ht(e) || t > De || t < 0) return e ? V(e, P) : P;
		let n = e.state;
		if (!e.output || e.avail_in !== 0 && !e.input || n.status === Xe && t !== M) return V(e, e.avail_out === 0 ? Ae : P);
		let r = n.last_flush;
		if (n.last_flush = t, n.pending !== 0) {
			if (W(e), e.avail_out === 0) return n.last_flush = -1, N;
		} else if (e.avail_in === 0 && et(t) <= et(r) && t !== M) return V(e, Ae);
		if (n.status === Xe && e.avail_in !== 0) return V(e, Ae);
		if (n.status === We && n.wrap === 0 && (n.status = R), n.status === We) {
			let t = Re + (n.w_bits - 8 << 4) << 8, r = -1;
			if (r = n.strategy >= Ne || n.level < 2 ? 0 : n.level < 6 ? 1 : n.level === 6 ? 2 : 3, t |= r << 6, n.strstart !== 0 && (t |= Ue), t += 31 - t % 31, rt(n, t), n.strstart !== 0 && (rt(n, e.adler >>> 16), rt(n, e.adler & 65535)), e.adler = 1, n.status = R, W(e), n.pending !== 0) return n.last_flush = -1, N;
		}
		if (n.status === Ge) {
			if (e.adler = 0, K(n, 31), K(n, 139), K(n, 8), n.gzhead) K(n, +!!n.gzhead.text + (n.gzhead.hcrc ? 2 : 0) + (n.gzhead.extra ? 4 : 0) + (n.gzhead.name ? 8 : 0) + (n.gzhead.comment ? 16 : 0)), K(n, n.gzhead.time & 255), K(n, n.gzhead.time >> 8 & 255), K(n, n.gzhead.time >> 16 & 255), K(n, n.gzhead.time >> 24 & 255), K(n, n.level === 9 ? 2 : n.strategy >= Ne || n.level < 2 ? 4 : 0), K(n, n.gzhead.os & 255), n.gzhead.extra && n.gzhead.extra.length && (K(n, n.gzhead.extra.length & 255), K(n, n.gzhead.extra.length >> 8 & 255)), n.gzhead.hcrc && (e.adler = k(e.adler, n.pending_buf, n.pending, 0)), n.gzindex = 0, n.status = Ke;
			else if (K(n, 0), K(n, 0), K(n, 0), K(n, 0), K(n, 0), K(n, n.level === 9 ? 2 : n.strategy >= Ne || n.level < 2 ? 4 : 0), K(n, $e), n.status = R, W(e), n.pending !== 0) return n.last_flush = -1, N;
		}
		if (n.status === Ke) {
			if (n.gzhead.extra) {
				let t = n.pending, r = (n.gzhead.extra.length & 65535) - n.gzindex;
				for (; n.pending + r > n.pending_buf_size;) {
					let i = n.pending_buf_size - n.pending;
					if (n.pending_buf.set(n.gzhead.extra.subarray(n.gzindex, n.gzindex + i), n.pending), n.pending = n.pending_buf_size, n.gzhead.hcrc && n.pending > t && (e.adler = k(e.adler, n.pending_buf, n.pending - t, t)), n.gzindex += i, W(e), n.pending !== 0) return n.last_flush = -1, N;
					t = 0, r -= i;
				}
				let i = new Uint8Array(n.gzhead.extra);
				n.pending_buf.set(i.subarray(n.gzindex, n.gzindex + r), n.pending), n.pending += r, n.gzhead.hcrc && n.pending > t && (e.adler = k(e.adler, n.pending_buf, n.pending - t, t)), n.gzindex = 0;
			}
			n.status = qe;
		}
		if (n.status === qe) {
			if (n.gzhead.name) {
				let t = n.pending, r;
				do {
					if (n.pending === n.pending_buf_size) {
						if (n.gzhead.hcrc && n.pending > t && (e.adler = k(e.adler, n.pending_buf, n.pending - t, t)), W(e), n.pending !== 0) return n.last_flush = -1, N;
						t = 0;
					}
					r = n.gzindex < n.gzhead.name.length ? n.gzhead.name.charCodeAt(n.gzindex++) & 255 : 0, K(n, r);
				} while (r !== 0);
				n.gzhead.hcrc && n.pending > t && (e.adler = k(e.adler, n.pending_buf, n.pending - t, t)), n.gzindex = 0;
			}
			n.status = Je;
		}
		if (n.status === Je) {
			if (n.gzhead.comment) {
				let t = n.pending, r;
				do {
					if (n.pending === n.pending_buf_size) {
						if (n.gzhead.hcrc && n.pending > t && (e.adler = k(e.adler, n.pending_buf, n.pending - t, t)), W(e), n.pending !== 0) return n.last_flush = -1, N;
						t = 0;
					}
					r = n.gzindex < n.gzhead.comment.length ? n.gzhead.comment.charCodeAt(n.gzindex++) & 255 : 0, K(n, r);
				} while (r !== 0);
				n.gzhead.hcrc && n.pending > t && (e.adler = k(e.adler, n.pending_buf, n.pending - t, t));
			}
			n.status = Ye;
		}
		if (n.status === Ye) {
			if (n.gzhead.hcrc) {
				if (n.pending + 2 > n.pending_buf_size && (W(e), n.pending !== 0)) return n.last_flush = -1, N;
				K(n, e.adler & 255), K(n, e.adler >> 8 & 255), e.adler = 0;
			}
			if (n.status = R, W(e), n.pending !== 0) return n.last_flush = -1, N;
		}
		if (e.avail_in !== 0 || n.lookahead !== 0 || t !== j && n.status !== Xe) {
			let r = n.level === 0 ? st(n, t) : n.strategy === Ne ? dt(n, t) : n.strategy === Pe ? ut(n, t) : ft[n.level].func(n, t);
			if ((r === B || r === Qe) && (n.status = Xe), r === z || r === B) return e.avail_out === 0 && (n.last_flush = -1), N;
			if (r === Ze && (t === Te ? we(n) : t !== De && (Se(n, 0, 0, !1), t === Ee && (H(n.head), n.lookahead === 0 && (n.strstart = 0, n.block_start = 0, n.insert = 0))), W(e), e.avail_out === 0)) return n.last_flush = -1, N;
		}
		return t === M ? n.wrap <= 0 ? Oe : (n.wrap === 2 ? (K(n, e.adler & 255), K(n, e.adler >> 8 & 255), K(n, e.adler >> 16 & 255), K(n, e.adler >> 24 & 255), K(n, e.total_in & 255), K(n, e.total_in >> 8 & 255), K(n, e.total_in >> 16 & 255), K(n, e.total_in >> 24 & 255)) : (rt(n, e.adler >>> 16), rt(n, e.adler & 65535)), W(e), n.wrap > 0 && (n.wrap = -n.wrap), n.pending === 0 ? Oe : N) : N;
	},
	deflateEnd: (e) => {
		if (ht(e)) return P;
		let t = e.state.status;
		return e.state = null, t === R ? V(e, ke) : N;
	},
	deflateSetDictionary: (e, t) => {
		let n = t.length;
		if (ht(e)) return P;
		let r = e.state, i = r.wrap;
		if (i === 2 || i === 1 && r.status !== We || r.lookahead) return P;
		if (i === 1 && (e.adler = _e(e.adler, t, n, 0)), r.wrap = 0, n >= r.w_size) {
			i === 0 && (H(r.head), r.strstart = 0, r.block_start = 0, r.insert = 0);
			let e = new Uint8Array(r.w_size);
			e.set(t.subarray(n - r.w_size, n), 0), t = e, n = r.w_size;
		}
		let a = e.avail_in, o = e.next_in, s = e.input;
		for (e.avail_in = n, e.next_in = 0, e.input = t, ot(r); r.lookahead >= F;) {
			let e = r.strstart, t = r.lookahead - 2;
			do
				U(r, e), e++;
			while (--t);
			r.strstart = e, r.lookahead = 2, ot(r);
		}
		return r.strstart += r.lookahead, r.block_start = r.strstart, r.insert = r.lookahead, r.lookahead = 0, r.match_length = r.prev_length = 2, r.match_available = 0, e.next_in = o, e.input = s, e.avail_in = a, r.wrap = i, N;
	},
	deflateInfo: "pako deflate (from Nodeca project)"
}, xt = (e, t) => Object.prototype.hasOwnProperty.call(e, t), St = {
	assign: function(e) {
		let t = Array.prototype.slice.call(arguments, 1);
		for (; t.length;) {
			let n = t.shift();
			if (n) {
				if (typeof n != "object") throw TypeError(n + "must be non-object");
				for (let t in n) xt(n, t) && (e[t] = n[t]);
			}
		}
		return e;
	},
	flattenChunks: (e) => {
		let t = 0;
		for (let n = 0, r = e.length; n < r; n++) t += e[n].length;
		let n = new Uint8Array(t);
		for (let t = 0, r = 0, i = e.length; t < i; t++) {
			let i = e[t];
			n.set(i, r), r += i.length;
		}
		return n;
	}
}, Ct = !0;
try {
	String.fromCharCode.apply(null, /* @__PURE__ */ new Uint8Array(1));
} catch (e) {
	Ct = !1;
}
var wt = /* @__PURE__ */ new Uint8Array(256);
for (let e = 0; e < 256; e++) wt[e] = e >= 252 ? 6 : e >= 248 ? 5 : e >= 240 ? 4 : e >= 224 ? 3 : e >= 192 ? 2 : 1;
wt[254] = wt[255] = 1;
var Tt = (e) => {
	if (typeof TextEncoder == "function" && TextEncoder.prototype.encode) return new TextEncoder().encode(e);
	let t, n, r, i, a, o = e.length, s = 0;
	for (i = 0; i < o; i++) n = e.charCodeAt(i), (n & 64512) == 55296 && i + 1 < o && (r = e.charCodeAt(i + 1), (r & 64512) == 56320 && (n = 65536 + (n - 55296 << 10) + (r - 56320), i++)), s += n < 128 ? 1 : n < 2048 ? 2 : n < 65536 ? 3 : 4;
	for (t = new Uint8Array(s), a = 0, i = 0; a < s; i++) n = e.charCodeAt(i), (n & 64512) == 55296 && i + 1 < o && (r = e.charCodeAt(i + 1), (r & 64512) == 56320 && (n = 65536 + (n - 55296 << 10) + (r - 56320), i++)), n < 128 ? t[a++] = n : n < 2048 ? (t[a++] = 192 | n >>> 6, t[a++] = 128 | n & 63) : n < 65536 ? (t[a++] = 224 | n >>> 12, t[a++] = 128 | n >>> 6 & 63, t[a++] = 128 | n & 63) : (t[a++] = 240 | n >>> 18, t[a++] = 128 | n >>> 12 & 63, t[a++] = 128 | n >>> 6 & 63, t[a++] = 128 | n & 63);
	return t;
}, Et = (e, t) => {
	if (t < 65534 && e.subarray && Ct) return String.fromCharCode.apply(null, e.length === t ? e : e.subarray(0, t));
	let n = "";
	for (let r = 0; r < t; r++) n += String.fromCharCode(e[r]);
	return n;
}, Dt = {
	string2buf: Tt,
	buf2string: (e, t) => {
		let n = t || e.length;
		if (typeof TextDecoder == "function" && TextDecoder.prototype.decode) return new TextDecoder().decode(e.subarray(0, t));
		let r, i, a = Array(n * 2);
		for (i = 0, r = 0; r < n;) {
			let t = e[r++];
			if (t < 128) {
				a[i++] = t;
				continue;
			}
			let o = wt[t];
			if (o > 4) a[i++] = 65533, r += o - 1;
			else {
				for (t &= o === 2 ? 31 : o === 3 ? 15 : 7; o > 1 && r < n;) t = t << 6 | e[r++] & 63, o--;
				o > 1 ? a[i++] = 65533 : t < 65536 ? a[i++] = t : (t -= 65536, a[i++] = 55296 | t >> 10 & 1023, a[i++] = 56320 | t & 1023);
			}
		}
		return Et(a, i);
	},
	utf8border: (e, t) => {
		t = t || e.length, t > e.length && (t = e.length);
		let n = t - 1;
		for (; n >= 0 && (e[n] & 192) == 128;) n--;
		return n < 0 || n === 0 ? t : n + wt[e[n]] > t ? n : t;
	}
};
function Ot() {
	this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var kt = Ot, At = Object.prototype.toString, { Z_NO_FLUSH: jt, Z_SYNC_FLUSH: Mt, Z_FULL_FLUSH: Nt, Z_FINISH: Pt, Z_OK: Ft, Z_STREAM_END: It, Z_DEFAULT_COMPRESSION: Lt, Z_DEFAULT_STRATEGY: Rt, Z_DEFLATED: zt } = be, Bt = {
	level: Lt,
	method: zt,
	chunkSize: 16384,
	windowBits: 15,
	memLevel: 8,
	strategy: Rt,
	legacyHash: !0
};
function Vt(e) {
	this.options = St.assign({}, Bt, e || {});
	let t = this.options;
	t.raw && t.windowBits > 0 ? t.windowBits = -t.windowBits : t.gzip && t.windowBits > 0 && t.windowBits < 16 && (t.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new kt(), this.strm.avail_out = 0;
	let n = bt.deflateInit2(this.strm, t.level, t.method, t.windowBits, t.memLevel, t.strategy, t.legacyHash);
	if (n !== Ft) throw Error(ye[n]);
	if (t.header && bt.deflateSetHeader(this.strm, t.header), t.dictionary) {
		let e;
		if (e = typeof t.dictionary == "string" ? Dt.string2buf(t.dictionary) : At.call(t.dictionary) === "[object ArrayBuffer]" ? new Uint8Array(t.dictionary) : t.dictionary, n = bt.deflateSetDictionary(this.strm, e), n !== Ft) throw Error(ye[n]);
		this._dict_set = !0;
	}
}
Vt.prototype.push = function(e, t) {
	let n = this.strm, r = this.options.chunkSize, i, a;
	if (this.ended) return !1;
	for (a = t === ~~t ? t : t === !0 ? Pt : jt, n.input = typeof e == "string" ? Dt.string2buf(e) : At.call(e) === "[object ArrayBuffer]" ? new Uint8Array(e) : e, n.next_in = 0, n.avail_in = n.input.length;;) if (n.avail_out === 0 && (n.output = new Uint8Array(r), n.next_out = 0, n.avail_out = r), (a === Mt || a === Nt) && n.avail_out <= 6) this.onData(n.output.subarray(0, n.next_out)), n.avail_out = 0;
	else {
		if (i = bt.deflate(n, a), i === It) return n.next_out > 0 && this.onData(n.output.subarray(0, n.next_out)), i = bt.deflateEnd(this.strm), this.onEnd(i), this.ended = !0, i === Ft;
		if (n.avail_out === 0) this.onData(n.output);
		else if (a > 0 && n.next_out > 0) this.onData(n.output.subarray(0, n.next_out)), n.avail_out = 0;
		else if (n.avail_in === 0) break;
	}
	return !0;
}, Vt.prototype.onData = function(e) {
	this.chunks.push(e);
}, Vt.prototype.onEnd = function(e) {
	e === Ft && (this.result = St.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
function Ht(e, t) {
	let n = new Vt(t);
	if (n.push(e, !0), n.err) throw n.msg || ye[n.err];
	return n.result;
}
function Ut(e, t) {
	return t = t || {}, t.raw = !0, Ht(e, t);
}
function Wt(e, t) {
	return t = t || {}, t.gzip = !0, Ht(e, t);
}
var Gt = {
	Deflate: Vt,
	deflate: Ht,
	deflateRaw: Ut,
	gzip: Wt,
	constants: be
}, Kt = 16209, qt = 16191, Jt = function(e, t) {
	let n, r, i, a, o, s, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S, C, w, T, E = e.state;
	n = e.next_in, w = e.input, r = n + (e.avail_in - 5), i = e.next_out, T = e.output, a = i - (t - e.avail_out), o = i + (e.avail_out - 257), s = E.dmax, c = E.wsize, l = E.whave, u = E.wnext, d = E.window, f = E.hold, p = E.bits, m = E.lencode, h = E.distcode, g = (1 << E.lenbits) - 1, _ = (1 << E.distbits) - 1;
	top: do {
		p < 15 && (f += w[n++] << p, p += 8, f += w[n++] << p, p += 8), v = m[f & g];
		dolen: for (;;) {
			if (y = v >>> 24, f >>>= y, p -= y, y = v >>> 16 & 255, y === 0) T[i++] = v & 65535;
			else if (y & 16) {
				b = v & 65535, y &= 15, y && (p < y && (f += w[n++] << p, p += 8), b += f & (1 << y) - 1, f >>>= y, p -= y), p < 15 && (f += w[n++] << p, p += 8, f += w[n++] << p, p += 8), v = h[f & _];
				dodist: for (;;) {
					if (y = v >>> 24, f >>>= y, p -= y, y = v >>> 16 & 255, y & 16) {
						if (x = v & 65535, y &= 15, p < y && (f += w[n++] << p, p += 8, p < y && (f += w[n++] << p, p += 8)), x += f & (1 << y) - 1, x > s) {
							e.msg = "invalid distance too far back", E.mode = Kt;
							break top;
						}
						if (f >>>= y, p -= y, y = i - a, x > y) {
							if (y = x - y, y > l && E.sane) {
								e.msg = "invalid distance too far back", E.mode = Kt;
								break top;
							}
							if (S = 0, C = d, u === 0) {
								if (S += c - y, y < b) {
									b -= y;
									do
										T[i++] = d[S++];
									while (--y);
									S = i - x, C = T;
								}
							} else if (u < y) {
								if (S += c + u - y, y -= u, y < b) {
									b -= y;
									do
										T[i++] = d[S++];
									while (--y);
									if (S = 0, u < b) {
										y = u, b -= y;
										do
											T[i++] = d[S++];
										while (--y);
										S = i - x, C = T;
									}
								}
							} else if (S += u - y, y < b) {
								b -= y;
								do
									T[i++] = d[S++];
								while (--y);
								S = i - x, C = T;
							}
							for (; b > 2;) T[i++] = C[S++], T[i++] = C[S++], T[i++] = C[S++], b -= 3;
							b && (T[i++] = C[S++], b > 1 && (T[i++] = C[S++]));
						} else {
							S = i - x;
							do
								T[i++] = T[S++], T[i++] = T[S++], T[i++] = T[S++], b -= 3;
							while (b > 2);
							b && (T[i++] = T[S++], b > 1 && (T[i++] = T[S++]));
						}
					} else if (y & 64) {
						e.msg = "invalid distance code", E.mode = Kt;
						break top;
					} else {
						v = h[(v & 65535) + (f & (1 << y) - 1)];
						continue dodist;
					}
					break;
				}
			} else if (!(y & 64)) {
				v = m[(v & 65535) + (f & (1 << y) - 1)];
				continue dolen;
			} else if (y & 32) {
				E.mode = qt;
				break top;
			} else {
				e.msg = "invalid literal/length code", E.mode = Kt;
				break top;
			}
			break;
		}
	} while (n < r && i < o);
	b = p >> 3, n -= b, p -= b << 3, f &= (1 << p) - 1, e.next_in = n, e.next_out = i, e.avail_in = n < r ? 5 + (r - n) : 5 - (n - r), e.avail_out = i < o ? 257 + (o - i) : 257 - (i - o), E.hold = f, E.bits = p;
}, Yt = 15, Xt = 852, Zt = 592, Qt = 0, $t = 1, en = 2, tn = new Uint16Array([
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	13,
	15,
	17,
	19,
	23,
	27,
	31,
	35,
	43,
	51,
	59,
	67,
	83,
	99,
	115,
	131,
	163,
	195,
	227,
	258,
	0,
	0
]), nn = new Uint8Array([
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	16,
	17,
	17,
	17,
	17,
	18,
	18,
	18,
	18,
	19,
	19,
	19,
	19,
	20,
	20,
	20,
	20,
	21,
	21,
	21,
	21,
	16,
	199,
	75
]), rn = new Uint16Array([
	1,
	2,
	3,
	4,
	5,
	7,
	9,
	13,
	17,
	25,
	33,
	49,
	65,
	97,
	129,
	193,
	257,
	385,
	513,
	769,
	1025,
	1537,
	2049,
	3073,
	4097,
	6145,
	8193,
	12289,
	16385,
	24577,
	0,
	0
]), an = new Uint8Array([
	16,
	16,
	16,
	16,
	17,
	17,
	18,
	18,
	19,
	19,
	20,
	20,
	21,
	21,
	22,
	22,
	23,
	23,
	24,
	24,
	25,
	25,
	26,
	26,
	27,
	27,
	28,
	28,
	29,
	29,
	64,
	64
]), on = (e, t, n, r, i, a, o, s) => {
	let c = s.bits, l = 0, u = 0, d = 0, f = 0, p = 0, m = 0, h = 0, g = 0, _ = 0, v = 0, y, b, x, S, C, w = null, T, E = /* @__PURE__ */ new Uint16Array(16), D = /* @__PURE__ */ new Uint16Array(16), O = null, ee, te, ne;
	for (l = 0; l <= Yt; l++) E[l] = 0;
	for (u = 0; u < r; u++) E[t[n + u]]++;
	for (p = c, f = Yt; f >= 1 && E[f] === 0; f--);
	if (p > f && (p = f), f === 0) return i[a++] = 20971520, i[a++] = 20971520, s.bits = 1, 0;
	for (d = 1; d < f && E[d] === 0; d++);
	for (p < d && (p = d), g = 1, l = 1; l <= Yt; l++) if (g <<= 1, g -= E[l], g < 0) return -1;
	if (g > 0 && (e === Qt || f !== 1)) return -1;
	for (D[1] = 0, l = 1; l < Yt; l++) D[l + 1] = D[l] + E[l];
	for (u = 0; u < r; u++) t[n + u] !== 0 && (o[D[t[n + u]]++] = u);
	if (e === Qt ? (w = O = o, T = 20) : e === $t ? (w = tn, O = nn, T = 257) : (w = rn, O = an, T = 0), v = 0, u = 0, l = d, C = a, m = p, h = 0, x = -1, _ = 1 << p, S = _ - 1, e === $t && _ > Xt || e === en && _ > Zt) return 1;
	for (;;) {
		ee = l - h, o[u] + 1 < T ? (te = 0, ne = o[u]) : o[u] >= T ? (te = O[o[u] - T], ne = w[o[u] - T]) : (te = 96, ne = 0), y = 1 << l - h, b = 1 << m, d = b;
		do
			b -= y, i[C + (v >> h) + b] = ee << 24 | te << 16 | ne;
		while (b !== 0);
		for (y = 1 << l - 1; v & y;) y >>= 1;
		if (y === 0 ? v = 0 : (v &= y - 1, v += y), u++, --E[l] === 0) {
			if (l === f) break;
			l = t[n + o[u]];
		}
		if (l > p && (v & S) !== x) {
			for (h === 0 && (h = p), C += d, m = l - h, g = 1 << m; m + h < f && (g -= E[m + h], !(g <= 0));) m++, g <<= 1;
			if (_ += 1 << m, e === $t && _ > Xt || e === en && _ > Zt) return 1;
			x = v & S, i[x] = p << 24 | m << 16 | C - a;
		}
	}
	return v !== 0 && (i[C + v] = l - h << 24 | 4194304), s.bits = p, 0;
}, sn = 0, cn = 1, ln = 2, { Z_FINISH: un, Z_BLOCK: dn, Z_TREES: fn, Z_OK: J, Z_STREAM_END: pn, Z_NEED_DICT: mn, Z_STREAM_ERROR: Y, Z_DATA_ERROR: hn, Z_MEM_ERROR: gn, Z_BUF_ERROR: _n, Z_DEFLATED: vn } = be, yn = 16180, bn = 16181, xn = 16182, Sn = 16183, Cn = 16184, wn = 16185, Tn = 16186, En = 16187, Dn = 16188, On = 16189, kn = 16190, X = 16191, An = 16192, jn = 16193, Mn = 16194, Nn = 16195, Pn = 16196, Fn = 16197, In = 16198, Ln = 16199, Rn = 16200, zn = 16201, Bn = 16202, Vn = 16203, Hn = 16204, Un = 16205, Wn = 16206, Gn = 16207, Kn = 16208, Z = 16209, qn = 16210, Jn = 16211, Yn = 852, Xn = 592, Zn = 15, Qn = (e) => (e >>> 24 & 255) + (e >>> 8 & 65280) + ((e & 65280) << 8) + ((e & 255) << 24);
function $n() {
	this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = /* @__PURE__ */ new Uint16Array(320), this.work = /* @__PURE__ */ new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
var Q = (e) => {
	if (!e) return 1;
	let t = e.state;
	return +(!t || t.strm !== e || t.mode < yn || t.mode > Jn);
}, er = (e) => {
	if (Q(e)) return Y;
	let t = e.state;
	return e.total_in = e.total_out = t.total = 0, e.msg = "", t.wrap && (e.adler = t.wrap & 1), t.mode = yn, t.last = 0, t.havedict = 0, t.flags = -1, t.dmax = 32768, t.head = null, t.hold = 0, t.bits = 0, t.lencode = t.lendyn = new Int32Array(Yn), t.distcode = t.distdyn = new Int32Array(Xn), t.sane = 1, t.back = -1, J;
}, tr = (e) => {
	if (Q(e)) return Y;
	let t = e.state;
	return t.wsize = 0, t.whave = 0, t.wnext = 0, er(e);
}, nr = (e, t) => {
	let n;
	if (Q(e)) return Y;
	let r = e.state;
	return t < 0 ? (n = 0, t = -t) : (n = (t >> 4) + 5, t < 48 && (t &= 15)), t && (t < 8 || t > 15) ? Y : (r.window !== null && r.wbits !== t && (r.window = null), r.wrap = n, r.wbits = t, tr(e));
}, rr = (e, t) => {
	if (!e) return Y;
	let n = new $n();
	e.state = n, n.strm = e, n.window = null, n.mode = yn;
	let r = nr(e, t);
	return r !== J && (e.state = null), r;
}, ir = (e) => rr(e, Zn), ar = !0, or, sr, cr = (e) => {
	if (ar) {
		or = /* @__PURE__ */ new Int32Array(512), sr = /* @__PURE__ */ new Int32Array(32);
		let t = 0;
		for (; t < 144;) e.lens[t++] = 8;
		for (; t < 256;) e.lens[t++] = 9;
		for (; t < 280;) e.lens[t++] = 7;
		for (; t < 288;) e.lens[t++] = 8;
		for (on(cn, e.lens, 0, 288, or, 0, e.work, { bits: 9 }), t = 0; t < 32;) e.lens[t++] = 5;
		on(ln, e.lens, 0, 32, sr, 0, e.work, { bits: 5 }), ar = !1;
	}
	e.lencode = or, e.lenbits = 9, e.distcode = sr, e.distbits = 5;
}, lr = (e, t, n, r) => {
	let i, a = e.state;
	return a.window === null && (a.window = new Uint8Array(1 << a.wbits)), a.wsize === 0 && (a.wsize = 1 << a.wbits, a.wnext = 0, a.whave = 0), r >= a.wsize ? (a.window.set(t.subarray(n - a.wsize, n), 0), a.wnext = 0, a.whave = a.wsize) : (i = a.wsize - a.wnext, i > r && (i = r), a.window.set(t.subarray(n - r, n - r + i), a.wnext), r -= i, r ? (a.window.set(t.subarray(n - r, n), 0), a.wnext = r, a.whave = a.wsize) : (a.wnext += i, a.wnext === a.wsize && (a.wnext = 0), a.whave < a.wsize && (a.whave += i))), 0;
}, $ = {
	inflateReset: tr,
	inflateReset2: nr,
	inflateResetKeep: er,
	inflateInit: ir,
	inflateInit2: rr,
	inflate: (e, t) => {
		let n, r, i, a, o, s, c, l, u, d, f, p, m, h, g = 0, _, v, y, b, x, S, C, w, T = /* @__PURE__ */ new Uint8Array(4), E, D, O = new Uint8Array([
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
		]);
		if (Q(e) || !e.output || !e.input && e.avail_in !== 0) return Y;
		n = e.state, n.mode === X && (n.mode = An), o = e.next_out, i = e.output, c = e.avail_out, a = e.next_in, r = e.input, s = e.avail_in, l = n.hold, u = n.bits, d = s, f = c, w = J;
		inf_leave: for (;;) switch (n.mode) {
			case yn:
				if (n.wrap === 0) {
					n.mode = An;
					break;
				}
				for (; u < 16;) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				if (n.wrap & 2 && l === 35615) {
					n.wbits === 0 && (n.wbits = 15), n.check = 0, T[0] = l & 255, T[1] = l >>> 8 & 255, n.check = k(n.check, T, 2, 0), l = 0, u = 0, n.mode = bn;
					break;
				}
				if (n.head && (n.head.done = !1), !(n.wrap & 1) || (((l & 255) << 8) + (l >> 8)) % 31) {
					e.msg = "incorrect header check", n.mode = Z;
					break;
				}
				if ((l & 15) !== vn) {
					e.msg = "unknown compression method", n.mode = Z;
					break;
				}
				if (l >>>= 4, u -= 4, C = (l & 15) + 8, n.wbits === 0 && (n.wbits = C), C > 15 || C > n.wbits) {
					e.msg = "invalid window size", n.mode = Z;
					break;
				}
				n.dmax = 1 << n.wbits, n.flags = 0, e.adler = n.check = 1, n.mode = l & 512 ? On : X, l = 0, u = 0;
				break;
			case bn:
				for (; u < 16;) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				if (n.flags = l, (n.flags & 255) !== vn) {
					e.msg = "unknown compression method", n.mode = Z;
					break;
				}
				if (n.flags & 57344) {
					e.msg = "unknown header flags set", n.mode = Z;
					break;
				}
				n.head && (n.head.text = l >> 8 & 1), n.flags & 512 && n.wrap & 4 && (T[0] = l & 255, T[1] = l >>> 8 & 255, n.check = k(n.check, T, 2, 0)), l = 0, u = 0, n.mode = xn;
			case xn:
				for (; u < 32;) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				n.head && (n.head.time = l), n.flags & 512 && n.wrap & 4 && (T[0] = l & 255, T[1] = l >>> 8 & 255, T[2] = l >>> 16 & 255, T[3] = l >>> 24 & 255, n.check = k(n.check, T, 4, 0)), l = 0, u = 0, n.mode = Sn;
			case Sn:
				for (; u < 16;) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				n.head && (n.head.xflags = l & 255, n.head.os = l >> 8), n.flags & 512 && n.wrap & 4 && (T[0] = l & 255, T[1] = l >>> 8 & 255, n.check = k(n.check, T, 2, 0)), l = 0, u = 0, n.mode = Cn;
			case Cn:
				if (n.flags & 1024) {
					for (; u < 16;) {
						if (s === 0) break inf_leave;
						s--, l += r[a++] << u, u += 8;
					}
					n.length = l, n.head && (n.head.extra_len = l), n.flags & 512 && n.wrap & 4 && (T[0] = l & 255, T[1] = l >>> 8 & 255, n.check = k(n.check, T, 2, 0)), l = 0, u = 0;
				} else n.head && (n.head.extra = null);
				n.mode = wn;
			case wn:
				if (n.flags & 1024 && (p = n.length, p > s && (p = s), p && (n.head && (C = n.head.extra_len - n.length, n.head.extra || (n.head.extra = new Uint8Array(n.head.extra_len)), n.head.extra.set(r.subarray(a, a + p), C)), n.flags & 512 && n.wrap & 4 && (n.check = k(n.check, r, p, a)), s -= p, a += p, n.length -= p), n.length)) break inf_leave;
				n.length = 0, n.mode = Tn;
			case Tn:
				if (n.flags & 2048) {
					if (s === 0) break inf_leave;
					p = 0;
					do
						C = r[a + p++], n.head && C && n.length < 65536 && (n.head.name += String.fromCharCode(C));
					while (C && p < s);
					if (n.flags & 512 && n.wrap & 4 && (n.check = k(n.check, r, p, a)), s -= p, a += p, C) break inf_leave;
				} else n.head && (n.head.name = null);
				n.length = 0, n.mode = En;
			case En:
				if (n.flags & 4096) {
					if (s === 0) break inf_leave;
					p = 0;
					do
						C = r[a + p++], n.head && C && n.length < 65536 && (n.head.comment += String.fromCharCode(C));
					while (C && p < s);
					if (n.flags & 512 && n.wrap & 4 && (n.check = k(n.check, r, p, a)), s -= p, a += p, C) break inf_leave;
				} else n.head && (n.head.comment = null);
				n.mode = Dn;
			case Dn:
				if (n.flags & 512) {
					for (; u < 16;) {
						if (s === 0) break inf_leave;
						s--, l += r[a++] << u, u += 8;
					}
					if (n.wrap & 4 && l !== (n.check & 65535)) {
						e.msg = "header crc mismatch", n.mode = Z;
						break;
					}
					l = 0, u = 0;
				}
				n.head && (n.head.hcrc = n.flags >> 9 & 1, n.head.done = !0), e.adler = n.check = 0, n.mode = X;
				break;
			case On:
				for (; u < 32;) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				e.adler = n.check = Qn(l), l = 0, u = 0, n.mode = kn;
			case kn:
				if (n.havedict === 0) return e.next_out = o, e.avail_out = c, e.next_in = a, e.avail_in = s, n.hold = l, n.bits = u, mn;
				e.adler = n.check = 1, n.mode = X;
			case X: if (t === dn || t === fn) break inf_leave;
			case An:
				if (n.last) {
					l >>>= u & 7, u -= u & 7, n.mode = Wn;
					break;
				}
				for (; u < 3;) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				switch (n.last = l & 1, l >>>= 1, --u, l & 3) {
					case 0:
						n.mode = jn;
						break;
					case 1:
						if (cr(n), n.mode = Ln, t === fn) {
							l >>>= 2, u -= 2;
							break inf_leave;
						}
						break;
					case 2:
						n.mode = Pn;
						break;
					case 3: e.msg = "invalid block type", n.mode = Z;
				}
				l >>>= 2, u -= 2;
				break;
			case jn:
				for (l >>>= u & 7, u -= u & 7; u < 32;) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				if ((l & 65535) != (l >>> 16 ^ 65535)) {
					e.msg = "invalid stored block lengths", n.mode = Z;
					break;
				}
				if (n.length = l & 65535, l = 0, u = 0, n.mode = Mn, t === fn) break inf_leave;
			case Mn: n.mode = Nn;
			case Nn:
				if (p = n.length, p) {
					if (p > s && (p = s), p > c && (p = c), p === 0) break inf_leave;
					i.set(r.subarray(a, a + p), o), s -= p, a += p, c -= p, o += p, n.length -= p;
					break;
				}
				n.mode = X;
				break;
			case Pn:
				for (; u < 14;) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				if (n.nlen = (l & 31) + 257, l >>>= 5, u -= 5, n.ndist = (l & 31) + 1, l >>>= 5, u -= 5, n.ncode = (l & 15) + 4, l >>>= 4, u -= 4, n.nlen > 286 || n.ndist > 30) {
					e.msg = "too many length or distance symbols", n.mode = Z;
					break;
				}
				n.have = 0, n.mode = Fn;
			case Fn:
				for (; n.have < n.ncode;) {
					for (; u < 3;) {
						if (s === 0) break inf_leave;
						s--, l += r[a++] << u, u += 8;
					}
					n.lens[O[n.have++]] = l & 7, l >>>= 3, u -= 3;
				}
				for (; n.have < 19;) n.lens[O[n.have++]] = 0;
				if (n.lencode = n.lendyn, n.lenbits = 7, E = { bits: n.lenbits }, w = on(sn, n.lens, 0, 19, n.lencode, 0, n.work, E), n.lenbits = E.bits, w) {
					e.msg = "invalid code lengths set", n.mode = Z;
					break;
				}
				n.have = 0, n.mode = In;
			case In:
				for (; n.have < n.nlen + n.ndist;) {
					for (; g = n.lencode[l & (1 << n.lenbits) - 1], _ = g >>> 24, v = g >>> 16 & 255, y = g & 65535, !(_ <= u);) {
						if (s === 0) break inf_leave;
						s--, l += r[a++] << u, u += 8;
					}
					if (y < 16) l >>>= _, u -= _, n.lens[n.have++] = y;
					else {
						if (y === 16) {
							for (D = _ + 2; u < D;) {
								if (s === 0) break inf_leave;
								s--, l += r[a++] << u, u += 8;
							}
							if (l >>>= _, u -= _, n.have === 0) {
								e.msg = "invalid bit length repeat", n.mode = Z;
								break;
							}
							C = n.lens[n.have - 1], p = 3 + (l & 3), l >>>= 2, u -= 2;
						} else if (y === 17) {
							for (D = _ + 3; u < D;) {
								if (s === 0) break inf_leave;
								s--, l += r[a++] << u, u += 8;
							}
							l >>>= _, u -= _, C = 0, p = 3 + (l & 7), l >>>= 3, u -= 3;
						} else {
							for (D = _ + 7; u < D;) {
								if (s === 0) break inf_leave;
								s--, l += r[a++] << u, u += 8;
							}
							l >>>= _, u -= _, C = 0, p = 11 + (l & 127), l >>>= 7, u -= 7;
						}
						if (n.have + p > n.nlen + n.ndist) {
							e.msg = "invalid bit length repeat", n.mode = Z;
							break;
						}
						for (; p--;) n.lens[n.have++] = C;
					}
				}
				if (n.mode === Z) break;
				if (n.lens[256] === 0) {
					e.msg = "invalid code -- missing end-of-block", n.mode = Z;
					break;
				}
				if (n.lenbits = 9, E = { bits: n.lenbits }, w = on(cn, n.lens, 0, n.nlen, n.lencode, 0, n.work, E), n.lenbits = E.bits, w) {
					e.msg = "invalid literal/lengths set", n.mode = Z;
					break;
				}
				if (n.distbits = 6, n.distcode = n.distdyn, E = { bits: n.distbits }, w = on(ln, n.lens, n.nlen, n.ndist, n.distcode, 0, n.work, E), n.distbits = E.bits, w) {
					e.msg = "invalid distances set", n.mode = Z;
					break;
				}
				if (n.mode = Ln, t === fn) break inf_leave;
			case Ln: n.mode = Rn;
			case Rn:
				if (s >= 6 && c >= 258) {
					e.next_out = o, e.avail_out = c, e.next_in = a, e.avail_in = s, n.hold = l, n.bits = u, Jt(e, f), o = e.next_out, i = e.output, c = e.avail_out, a = e.next_in, r = e.input, s = e.avail_in, l = n.hold, u = n.bits, n.mode === X && (n.back = -1);
					break;
				}
				for (n.back = 0; g = n.lencode[l & (1 << n.lenbits) - 1], _ = g >>> 24, v = g >>> 16 & 255, y = g & 65535, !(_ <= u);) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				if (v && !(v & 240)) {
					for (b = _, x = v, S = y; g = n.lencode[S + ((l & (1 << b + x) - 1) >> b)], _ = g >>> 24, v = g >>> 16 & 255, y = g & 65535, !(b + _ <= u);) {
						if (s === 0) break inf_leave;
						s--, l += r[a++] << u, u += 8;
					}
					l >>>= b, u -= b, n.back += b;
				}
				if (l >>>= _, u -= _, n.back += _, n.length = y, v === 0) {
					n.mode = Un;
					break;
				}
				if (v & 32) {
					n.back = -1, n.mode = X;
					break;
				}
				if (v & 64) {
					e.msg = "invalid literal/length code", n.mode = Z;
					break;
				}
				n.extra = v & 15, n.mode = zn;
			case zn:
				if (n.extra) {
					for (D = n.extra; u < D;) {
						if (s === 0) break inf_leave;
						s--, l += r[a++] << u, u += 8;
					}
					n.length += l & (1 << n.extra) - 1, l >>>= n.extra, u -= n.extra, n.back += n.extra;
				}
				n.was = n.length, n.mode = Bn;
			case Bn:
				for (; g = n.distcode[l & (1 << n.distbits) - 1], _ = g >>> 24, v = g >>> 16 & 255, y = g & 65535, !(_ <= u);) {
					if (s === 0) break inf_leave;
					s--, l += r[a++] << u, u += 8;
				}
				if (!(v & 240)) {
					for (b = _, x = v, S = y; g = n.distcode[S + ((l & (1 << b + x) - 1) >> b)], _ = g >>> 24, v = g >>> 16 & 255, y = g & 65535, !(b + _ <= u);) {
						if (s === 0) break inf_leave;
						s--, l += r[a++] << u, u += 8;
					}
					l >>>= b, u -= b, n.back += b;
				}
				if (l >>>= _, u -= _, n.back += _, v & 64) {
					e.msg = "invalid distance code", n.mode = Z;
					break;
				}
				n.offset = y, n.extra = v & 15, n.mode = Vn;
			case Vn:
				if (n.extra) {
					for (D = n.extra; u < D;) {
						if (s === 0) break inf_leave;
						s--, l += r[a++] << u, u += 8;
					}
					n.offset += l & (1 << n.extra) - 1, l >>>= n.extra, u -= n.extra, n.back += n.extra;
				}
				if (n.offset > n.dmax) {
					e.msg = "invalid distance too far back", n.mode = Z;
					break;
				}
				n.mode = Hn;
			case Hn:
				if (c === 0) break inf_leave;
				if (p = f - c, n.offset > p) {
					if (p = n.offset - p, p > n.whave && n.sane) {
						e.msg = "invalid distance too far back", n.mode = Z;
						break;
					}
					p > n.wnext ? (p -= n.wnext, m = n.wsize - p) : m = n.wnext - p, p > n.length && (p = n.length), h = n.window;
				} else h = i, m = o - n.offset, p = n.length;
				p > c && (p = c), c -= p, n.length -= p;
				do
					i[o++] = h[m++];
				while (--p);
				n.length === 0 && (n.mode = Rn);
				break;
			case Un:
				if (c === 0) break inf_leave;
				i[o++] = n.length, c--, n.mode = Rn;
				break;
			case Wn:
				if (n.wrap) {
					for (; u < 32;) {
						if (s === 0) break inf_leave;
						s--, l |= r[a++] << u, u += 8;
					}
					if (f -= c, e.total_out += f, n.total += f, n.wrap & 4 && f && (e.adler = n.check = n.flags ? k(n.check, i, f, o - f) : _e(n.check, i, f, o - f)), f = c, n.wrap & 4 && (n.flags ? l : Qn(l)) !== n.check) {
						e.msg = "incorrect data check", n.mode = Z;
						break;
					}
					l = 0, u = 0;
				}
				n.mode = Gn;
			case Gn:
				if (n.wrap && n.flags) {
					for (; u < 32;) {
						if (s === 0) break inf_leave;
						s--, l += r[a++] << u, u += 8;
					}
					if (n.wrap & 4 && l !== (n.total | 0)) {
						e.msg = "incorrect length check", n.mode = Z;
						break;
					}
					l = 0, u = 0;
				}
				n.mode = Kn;
			case Kn:
				w = pn;
				break inf_leave;
			case Z:
				w = hn;
				break inf_leave;
			case qn: return gn;
			case Jn:
			default: return Y;
		}
		return e.next_out = o, e.avail_out = c, e.next_in = a, e.avail_in = s, n.hold = l, n.bits = u, (n.wsize || f !== e.avail_out && n.mode < Z && (n.mode < Wn || t !== un)) && lr(e, e.output, e.next_out, f - e.avail_out), d -= e.avail_in, f -= e.avail_out, e.total_in += d, e.total_out += f, n.total += f, n.wrap & 4 && f && (e.adler = n.check = n.flags ? k(n.check, i, f, e.next_out - f) : _e(n.check, i, f, e.next_out - f)), e.data_type = n.bits + (n.last ? 64 : 0) + (n.mode === X ? 128 : 0) + (n.mode === Ln || n.mode === Mn ? 256 : 0), (d === 0 && f === 0 || t === un) && w === J && (w = _n), w;
	},
	inflateEnd: (e) => {
		if (Q(e)) return Y;
		let t = e.state;
		return t.window && (t.window = null), e.state = null, J;
	},
	inflateGetHeader: (e, t) => {
		if (Q(e)) return Y;
		let n = e.state;
		return n.wrap & 2 ? (n.head = t, t.done = !1, J) : Y;
	},
	inflateSetDictionary: (e, t) => {
		let n = t.length, r, i, a;
		return Q(e) || (r = e.state, r.wrap !== 0 && r.mode !== kn) ? Y : r.mode === kn && (i = 1, i = _e(i, t, n, 0), i !== r.check) ? hn : (a = lr(e, t, n, n), a ? (r.mode = qn, gn) : (r.havedict = 1, J));
	},
	inflateInfo: "pako inflate (from Nodeca project)"
};
function ur() {
	this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var dr = ur, fr = Object.prototype.toString, { Z_NO_FLUSH: pr, Z_FINISH: mr, Z_OK: hr, Z_STREAM_END: gr, Z_NEED_DICT: _r, Z_STREAM_ERROR: vr, Z_DATA_ERROR: yr, Z_MEM_ERROR: br, Z_BUF_ERROR: xr } = be, Sr = {
	chunkSize: 65536,
	windowBits: 15,
	to: ""
};
function Cr(e) {
	this.options = St.assign({}, Sr, e || {});
	let t = this.options;
	t.raw && t.windowBits >= 0 && t.windowBits < 16 && (t.windowBits = -t.windowBits, t.windowBits === 0 && (t.windowBits = -15)), t.windowBits >= 0 && t.windowBits < 16 && !(e && e.windowBits) && (t.windowBits += 32), t.windowBits > 15 && t.windowBits < 48 && (t.windowBits & 15 || (t.windowBits |= 15)), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new kt(), this.strm.avail_out = 0;
	let n = $.inflateInit2(this.strm, t.windowBits);
	if (n !== hr || (this.header = new dr(), $.inflateGetHeader(this.strm, this.header), t.dictionary && (typeof t.dictionary == "string" ? t.dictionary = Dt.string2buf(t.dictionary) : fr.call(t.dictionary) === "[object ArrayBuffer]" && (t.dictionary = new Uint8Array(t.dictionary)), t.raw && (n = $.inflateSetDictionary(this.strm, t.dictionary), n !== hr)))) throw Error(ye[n]);
}
Cr.prototype.push = function(e, t) {
	let n = this.strm, r = this.options.chunkSize, i = this.options.dictionary, a, o, s;
	if (this.ended) return !1;
	for (o = t === ~~t ? t : t === !0 ? mr : pr, n.input = fr.call(e) === "[object ArrayBuffer]" ? new Uint8Array(e) : e, n.next_in = 0, n.avail_in = n.input.length;;) {
		for (n.avail_out === 0 && (n.output = new Uint8Array(r), n.next_out = 0, n.avail_out = r), a = $.inflate(n, o), a === _r && i && (a = $.inflateSetDictionary(n, i), a === hr ? a = $.inflate(n, o) : a === yr && (a = _r)); n.avail_in > 0 && a === gr && n.state.wrap & 2 && n.state.flags !== 0 && n.input[n.next_in] !== 0;) $.inflateReset(n), a = $.inflate(n, o);
		switch (a) {
			case vr:
			case yr:
			case _r:
			case br: return this.onEnd(a), this.ended = !0, !1;
		}
		if (s = n.avail_out, n.next_out && (n.avail_out === 0 || a === gr || o > 0)) {
			if (this.options.to === "string") {
				let e = Dt.utf8border(n.output, n.next_out), t = n.next_out - e, i = Dt.buf2string(n.output, e);
				n.next_out = t, n.avail_out = r - t, t && n.output.set(n.output.subarray(e, e + t), 0), this.onData(i);
			} else this.onData(n.output.length === n.next_out ? n.output : n.output.subarray(0, n.next_out)), n.avail_out = 0, n.next_out = 0;
		}
		if (a !== hr && a !== xr || s !== 0) {
			if (a === gr) return a = $.inflateEnd(this.strm), this.onEnd(a), this.ended = !0, !0;
			if (n.avail_in === 0) {
				if (o === mr) return a = $.inflateEnd(this.strm), this.onEnd(a === hr ? xr : a), this.ended = !0, !1;
				break;
			}
		}
	}
	return !0;
}, Cr.prototype.onData = function(e) {
	this.chunks.push(e);
}, Cr.prototype.onEnd = function(e) {
	e === hr && (this.result = this.options.to === "string" ? this.chunks.join("") : St.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
function wr(e, t) {
	let n = new Cr(t);
	if (n.push(e, !0), n.err) throw n.msg || ye[n.err];
	return n.result;
}
function Tr(e, t) {
	return t = t || {}, t.raw = !0, wr(e, t);
}
var Er = {
	Inflate: Cr,
	inflate: wr,
	inflateRaw: Tr,
	ungzip: wr,
	constants: be
}, { Deflate: Dr, deflate: Or, deflateRaw: kr, gzip: Ar } = Gt, { Inflate: jr, inflate: Mr, inflateRaw: Nr, ungzip: Pr } = Er, Fr = kr;
// \0@oxc-project+runtime@0.155.0/helpers/esm/typeof.js
function Ir(e) {
	"@babel/helpers - typeof";
	return Ir = typeof Symbol == "function" && typeof Symbol.iterator == "symbol" ? function(e) {
		return typeof e;
	} : function(e) {
		return e && typeof Symbol == "function" && e.constructor === Symbol && e !== Symbol.prototype ? "symbol" : typeof e;
	}, Ir(e);
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/toPrimitive.js
function Lr(e, t) {
	if (Ir(e) != "object" || !e) return e;
	var n = e[Symbol.toPrimitive];
	if (n !== void 0) {
		var r = n.call(e, t || "default");
		if (Ir(r) != "object") return r;
		throw TypeError("@@toPrimitive must return a primitive value.");
	}
	return (t === "string" ? String : Number)(e);
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/toPropertyKey.js
function Rr(e) {
	var t = Lr(e, "string");
	return Ir(t) == "symbol" ? t : t + "";
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/defineProperty.js
function zr(e, t, n) {
	return (t = Rr(t)) in e ? Object.defineProperty(e, t, {
		value: n,
		enumerable: !0,
		configurable: !0,
		writable: !0
	}) : e[t] = n, e;
}
// \0@oxc-project+runtime@0.155.0/helpers/esm/objectSpread2.js
function Br(e, t) {
	var n = Object.keys(e);
	if (Object.getOwnPropertySymbols) {
		var r = Object.getOwnPropertySymbols(e);
		t && (r = r.filter(function(t) {
			return Object.getOwnPropertyDescriptor(e, t).enumerable;
		})), n.push.apply(n, r);
	}
	return n;
}
function Vr(e) {
	for (var t = 1; t < arguments.length; t++) {
		var n = arguments[t] == null ? {} : arguments[t];
		t % 2 ? Br(Object(n), !0).forEach(function(t) {
			zr(e, t, n[t]);
		}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(n)) : Br(Object(n)).forEach(function(t) {
			Object.defineProperty(e, t, Object.getOwnPropertyDescriptor(n, t));
		});
	}
	return e;
}
// src/addons/cherry-code-block-plantuml-plugin.js
function Hr(e) {
	let t = e;
	return t < 10 ? String.fromCharCode(48 + t) : (t -= 10, t < 26 ? String.fromCharCode(65 + t) : (t -= 26, t < 26 ? String.fromCharCode(97 + t) : (t -= 26, t === 0 ? "-" : t === 1 ? "_" : "?")));
}
function Ur(e, t, n) {
	let r = e >> 2, i = (e & 3) << 4 | t >> 4, a = (t & 15) << 2 | n >> 6, o = n & 63;
	return Hr(r & 63) + Hr(i & 63) + Hr(a & 63) + Hr(o & 63);
}
function Wr(e) {
	let t = "", n = e.length;
	for (let r = 0; r < n; r += 3) {
		let i = e[r] & 255, a = r + 1 < n ? e[r + 1] & 255 : 0, o = r + 2 < n ? e[r + 2] & 255 : 0;
		t += Ur(i, a, o);
	}
	return t;
}
function Gr(e) {
	let t = "";
	for (let n = 0; n < e.length; n += 1) {
		let r = (e[n] & 255).toString(16);
		t += r.length === 1 ? `0${r}` : r;
	}
	return t;
}
function Kr(e) {
	if (typeof TextEncoder < "u") return new TextEncoder().encode(e);
	let t = unescape(encodeURIComponent(e)), n = new Uint8Array(t.length);
	for (let e = 0; e < t.length; e += 1) n[e] = t.charCodeAt(e) & 255;
	return n;
}
function qr(e, t) {
	let n = Kr(e);
	if (t) return `~h${Gr(n)}`;
	try {
		return Wr(Fr(n, { level: 9 }));
	} catch (e) {
		return `~h${Gr(n)}`;
	}
}
var Jr = class e {
	static install(t, r) {
		var i;
		n(t, { engine: { syntax: { codeBlock: { customRenderer: { plantuml: new e(Vr(Vr({}, r), (i = t.engine.syntax.plantuml) == null ? {} : i)) } } } } });
	}
	constructor(e = {}) {
		var t, n;
		this.baseUrl = (t = e.baseUrl) == null ? "https://www.plantuml.com/plantuml" : t, this.type = (n = e.type) == null ? "svg" : n, this.useHex = e.useHex === !0;
	}
	getUrl(e) {
		return `${this.baseUrl}/${this.type}/${qr(e, this.useHex)}`;
	}
	render(e, t) {
		let n = t;
		return n || (n = Math.round(Math.random() * 1e8)), `<img id="${`plantuml-${n}-${(/* @__PURE__ */ new Date()).getTime()}`}" src="${this.getUrl(e)}" />`;
	}
};
export { Jr as default };
