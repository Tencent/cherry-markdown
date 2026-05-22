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
export function hashHex(str: string): string;
export default hashHex;
