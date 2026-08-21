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
import isPlainObject from './isPlainObject';

/**
 * @typedef {(objValue: unknown, srcValue: unknown, key?: string, object?: object, source?: object) => unknown} MergeCustomizer
 */

/**
 * 递归深合并 source 到 target
 * @param {object} target
 * @param {object} source
 * @param {MergeCustomizer} [customizer]
 */
function mergeWithDeep(target, source, customizer) {
  if (source === null || source === undefined || typeof source !== 'object') {
    return;
  }

  const keys = Object.keys(source);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const srcValue = source[key];
    const objValue = target[key];

    if (customizer) {
      const customized = customizer(objValue, srcValue, key, target, source);
      if (customized !== undefined) {
        target[key] = customized;
        continue;
      }
    }

    if (srcValue === undefined) {
      continue;
    }

    if (isPlainObject(objValue) && isPlainObject(srcValue)) {
      mergeWithDeep(objValue, srcValue, customizer);
    } else if (Array.isArray(objValue) && Array.isArray(srcValue)) {
      mergeWithDeep(objValue, srcValue, customizer);
    } else {
      target[key] = srcValue;
    }
  }
}

/**
 * 深合并对象。末参为函数时视为 customizer（lodash 兼容），否则全部为 source。
 * @param {object} object 目标对象（会被修改）
 * @param {...object|MergeCustomizer} args 一个或多个 source，或 sources + customizer
 * @returns {object} 合并后的目标对象
 */
export default function mergeWith(object, ...args) {
  /** @type {MergeCustomizer | undefined} */
  let customizer;
  if (typeof args[args.length - 1] === 'function') {
    customizer = /** @type {MergeCustomizer} */ (args.pop());
  }

  for (let i = 0; i < args.length; i++) {
    const source = args[i];
    if (source !== null && source !== undefined && typeof source === 'object') {
      mergeWithDeep(object, source, customizer);
    }
  }

  return object;
}
