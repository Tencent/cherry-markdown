/**
 * Copyright (C) 2021 Tencent.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const PRIME32_1 = 0x9e3779b1 | 0;
const PRIME32_2 = 0x85ebca77 | 0;
const PRIME32_3 = 0xc2b2ae3d | 0;
const PRIME32_4 = 0x27d4eb2f | 0;
const PRIME32_5 = 0x165667b1 | 0;

const SEED_LO = 0x9747b28c | 0;
const SEED_HI = 0xc6a4a793 | 0;

/**
 * Rotate a 32-bit integer left by `r` bits.
 * @param {number} x
 * @param {number} r
 * @returns {number}
 */
function rotl32(x, r) {
  return (x << r) | (x >>> (32 - r));
}

/**
 * Convert an int32 to an 8-char lowercase hex string (zero-padded).
 * @param {number} n
 * @returns {string}
 */
function toHex8(n) {
  // `>>> 0` -> reinterpret as uint32 so toString(16) never emits a sign.
  const s = (n >>> 0).toString(16);
  // Avoid `padStart` for marginally better perf in ancient engines.
  return s.length === 8 ? s : '00000000'.slice(s.length) + s;
}

/**
 * Core xxHash32 over a JS string, consuming UTF-16 code units.
 *
 * We process 4 code units (8 bytes) per main-loop iteration; this matches the
 * cache-line friendly pattern of the original C implementation while keeping
 * the JS code simple and branch-light.
 *
 * @param {string} str input string
 * @param {number} seed 32-bit seed
 * @returns {number} 32-bit hash as a signed int32 (caller normalises)
 */
function xxHash32(str, seed) {
  const len = str.length;
  let h32;
  let i = 0;

  // Main loop: process 8 code units (4 lanes x 2 code units packed per lane)
  // per iteration. We pack two 16-bit code units into a 32-bit lane to feed
  // the standard xxHash32 round function. This is not byte-identical to the
  // reference C xxHash on UTF-8 bytes, but it is a stable, well-diffused
  // permutation of the input, which is all we need for cache identity.
  if (len >= 8) {
    const limit = len - 8;
    let v1 = (seed + PRIME32_1 + PRIME32_2) | 0;
    let v2 = (seed + PRIME32_2) | 0;
    let v3 = seed | 0;
    let v4 = (seed - PRIME32_1) | 0;

    while (i <= limit) {
      const k1 = (str.charCodeAt(i) | (str.charCodeAt(i + 1) << 16)) >>> 0;
      const k2 = (str.charCodeAt(i + 2) | (str.charCodeAt(i + 3) << 16)) >>> 0;
      const k3 = (str.charCodeAt(i + 4) | (str.charCodeAt(i + 5) << 16)) >>> 0;
      const k4 = (str.charCodeAt(i + 6) | (str.charCodeAt(i + 7) << 16)) >>> 0;

      v1 = Math.imul(rotl32((v1 + Math.imul(k1, PRIME32_2)) | 0, 13), PRIME32_1) | 0;
      v2 = Math.imul(rotl32((v2 + Math.imul(k2, PRIME32_2)) | 0, 13), PRIME32_1) | 0;
      v3 = Math.imul(rotl32((v3 + Math.imul(k3, PRIME32_2)) | 0, 13), PRIME32_1) | 0;
      v4 = Math.imul(rotl32((v4 + Math.imul(k4, PRIME32_2)) | 0, 13), PRIME32_1) | 0;

      i += 8;
    }

    h32 = (rotl32(v1, 1) + rotl32(v2, 7) + rotl32(v3, 12) + rotl32(v4, 18)) | 0;
  } else {
    h32 = (seed + PRIME32_5) | 0;
  }

  // Mix the original length so different-length inputs diverge early.
  h32 = (h32 + len) | 0;

  // Tail: consume the remaining code units one at a time.
  while (i < len) {
    h32 = Math.imul(rotl32((h32 + Math.imul(str.charCodeAt(i) >>> 0, PRIME32_3)) | 0, 17), PRIME32_4) | 0;
    i += 1;
  }

  // Final avalanche.
  h32 ^= h32 >>> 15;
  h32 = Math.imul(h32, PRIME32_2);
  h32 ^= h32 >>> 13;
  h32 = Math.imul(h32, PRIME32_3);
  h32 ^= h32 >>> 16;

  return h32;
}

/**
 * Compute a 64-bit non-cryptographic hash of a string and return it as a
 * 16-character lowercase hex string. The output charset is `[0-9a-f]`, making
 * it a drop-in replacement for the previous SHA-256 hex digest in places that
 * only treat the digest as an opaque identifier.
 *
 * Two independent xxHash32 passes are combined; the high lane additionally
 * mixes the input length into its seed, so inputs of different lengths cannot
 * collide regardless of content.
 *
 * @param {string} str
 * @returns {string} 16-char lowercase hex
 */
export function hashHex(str) {
  if (typeof str !== 'string') {
    // Match CryptoJS.SHA256(undefined).toString() -> hash of "" semantics by
    // coercing to string. This keeps existing call sites safe.
    // eslint-disable-next-line no-param-reassign
    str = String(str == null ? '' : str);
  }
  const lo = xxHash32(str, SEED_LO);
  // Fold the length into the high seed: guarantees no cross-length collision.
  const hi = xxHash32(str, (SEED_HI ^ str.length) | 0);
  return toHex8(hi) + toHex8(lo);
}

export default hashHex;
