// @ts-nocheck
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
import mergeWith from '@/utils/toolkit/mergeWith';
import { deflateRaw } from 'pako';

/**
 * PlantUML text encoding
 * @see https://plantuml.com/zh/text-encoding
 *
 * Prefix table (verified against the live PlantUML server):
 *   - (no prefix) -> DEFLATE (canonical format used by this plugin)
 *   - `~1`        -> HUFFMAN (legacy; the server will REJECT a DEFLATE
 *                   payload prefixed with ~1 — do not add it even if the
 *                   error page suggests to)
 *   - `~h`        -> HEX (no compression; used here as a safety fallback)
 *
 * Compression is powered by `pako` (industry-standard zlib port). It outputs a
 * canonical raw DEFLATE byte stream that the PlantUML server reliably
 * recognises.
 */

/** PlantUML's 6-bit character map, differs from standard base64 in order. */
function encode6bit(b) {
  let v = b;
  if (v < 10) {
    // 0-9
    return String.fromCharCode(48 + v);
  }
  v -= 10;
  if (v < 26) {
    // A-Z
    return String.fromCharCode(65 + v);
  }
  v -= 26;
  if (v < 26) {
    // a-z
    return String.fromCharCode(97 + v);
  }
  v -= 26;
  if (v === 0) {
    return '-';
  }
  if (v === 1) {
    return '_';
  }
  return '?';
}

function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;
  return encode6bit(c1 & 0x3f) + encode6bit(c2 & 0x3f) + encode6bit(c3 & 0x3f) + encode6bit(c4 & 0x3f);
}

/**
 * Encode a byte sequence (Uint8Array or array-like of 0-255 numbers)
 * using PlantUML's base64-like alphabet.
 */
function encode64(bytes) {
  let r = '';
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i] & 0xff;
    const b2 = i + 1 < len ? bytes[i + 1] & 0xff : 0;
    const b3 = i + 2 < len ? bytes[i + 2] & 0xff : 0;
    r += append3bytes(b1, b2, b3);
  }
  return r;
}

/** HEX encode a byte sequence, used with the `~h` prefix. */
function hexEncode(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    const h = (bytes[i] & 0xff).toString(16);
    out += h.length === 1 ? `0${h}` : h;
  }
  return out;
}

/** Convert any string to its UTF-8 byte sequence as a Uint8Array. */
function toUtf8Bytes(str) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  // Fallback for very old environments.
  const bin = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/**
 * Build the encoded path segment following PlantUML's text encoding spec.
 *
 * Encoding selection:
 *   - DEFLATE (default): raw DEFLATE + PlantUML's base64-like alphabet,
 *     NO prefix. This is what the PlantUML server treats as the canonical
 *     format. Confirmed against the live server with a 200 OK SVG response.
 *   - HEX (`~h`): no compression, used only as a safety fallback when
 *     deflate throws, or when the caller sets `useHex: true`.
 *
 * NOTE: The server occasionally emits a "please add header ~1 to your data"
 * hint — do NOT follow it. The `~1` prefix means HUFFMAN (a legacy format)
 * and will make the server reject the payload with "bad URL / does not look
 * like HUFFMAN data".
 *
 * @param {string} src diagram source text
 * @param {boolean} useHex whether to force the simple HEX encoding (`~h`)
 * @returns {string} encoded string ready to be appended after `/<format>/`
 */
function encodePlantUML(src, useHex) {
  const utf8 = toUtf8Bytes(src);
  if (useHex) {
    return `~h${hexEncode(utf8)}`;
  }
  try {
    const compressed = deflateRaw(utf8, { level: 9 });
    return encode64(compressed);
  } catch (e) {
    // Deflate failed for some reason, fall back to HEX so the diagram still renders.
    return `~h${hexEncode(utf8)}`;
  }
}

export default class PlantUMLCodeEngine {
  static install(cherryOptions, args) {
    mergeWith(cherryOptions, {
      engine: {
        syntax: {
          codeBlock: {
            customRenderer: {
              plantuml: new PlantUMLCodeEngine({
                ...args,
                ...(cherryOptions.engine.syntax.plantuml ?? {}),
              }),
            },
          },
        },
      },
    });
  }

  /**
   * @param {object} plantUMLOptions
   * @param {string} [plantUMLOptions.baseUrl] PlantUML server base URL, e.g. `https://www.plantuml.com/plantuml`
   * @param {('svg'|'png'|'txt'|'uml')} [plantUMLOptions.type] output format path segment, defaults to `svg`
   * @param {boolean} [plantUMLOptions.useHex] force the simple HEX (`~h`) encoding instead of deflate
   */
  constructor(plantUMLOptions = {}) {
    const defaultUrl = 'https://www.plantuml.com/plantuml';
    this.baseUrl = plantUMLOptions.baseUrl ?? defaultUrl;
    this.type = plantUMLOptions.type ?? 'svg';
    this.useHex = plantUMLOptions.useHex === true;
  }

  /**
   * Compose the full image URL from the diagram source.
   * @param {string} src diagram source text
   * @returns {string} full URL to the rendered diagram
   */
  getUrl(src) {
    return `${this.baseUrl}/${this.type}/${encodePlantUML(src, this.useHex)}`;
  }

  render(src, sign) {
    let $sign = sign;
    if (!$sign) {
      $sign = Math.round(Math.random() * 100000000);
    }
    const graphId = `plantuml-${$sign}-${new Date().getTime()}`;
    return `<img id="${graphId}" src="${this.getUrl(src)}" />`;
  }
}
