// @ts-nocheck
/**
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.
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
import mergeWith from 'lodash/mergeWith';
import deflate from '@/libs/rawdeflate';

function encode64(data) {
  let r = '';
  for (let i = 0; i < data.length; i += 3) {
    if (i + 2 === data.length) {
      r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), 0);
    } else if (i + 1 === data.length) {
      r += append3bytes(data.charCodeAt(i), 0, 0);
    } else {
      r += append3bytes(data.charCodeAt(i), data.charCodeAt(i + 1), data.charCodeAt(i + 2));
    }
  }
  return r;
}

function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;
  let r = '';
  r += encode6bit(c1 & 0x3f);
  r += encode6bit(c2 & 0x3f);
  r += encode6bit(c3 & 0x3f);
  r += encode6bit(c4 & 0x3f);
  return r;
}

function encode6bit(b1) {
  let b = b1;
  if (b < 10) {
    return String.fromCharCode(48 + b);
  }
  b -= 10;
  if (b < 26) {
    return String.fromCharCode(65 + b);
  }
  b -= 26;
  if (b < 26) {
    return String.fromCharCode(97 + b);
  }
  b -= 26;
  if (b === 0) {
    return '-';
  }
  if (b === 1) {
    return '_';
  }
  return '?';
}

function compress(s1, url) {
  const s = unescape(encodeURIComponent(s1));
  return `${url}/svg/${encode64(deflate(s, 9))}`;
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

  constructor(plantUMLOptions = {}) {
    const defaultUrl = 'http://www.plantuml.com/plantuml';
    this.baseUrl = plantUMLOptions.baseUrl ?? defaultUrl;
  }

  render(src, sign) {
    let $sign = sign;
    if (!$sign) {
      $sign = Math.round(Math.random() * 100000000);
    }
    const graphId = `plantuml-${$sign}-${new Date().getTime()}`;
    return `<img id="${graphId}" src="${compress(src, this.baseUrl)}" />`;
  }
}
