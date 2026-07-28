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
 * 深拷贝值。支持纯对象、数组、Date、RegExp；函数与原始类型按引用/值复制。
 * 不支持 Map、Set、TypedArray（Cherry 配置场景未用到）。
 * @template T
 * @param {T} value 待拷贝的值
 * @param {WeakMap<object, unknown>} [stack] 循环引用栈（内部使用）
 * @returns {T} 深拷贝结果
 */
export default function cloneDeep(value, stack = new WeakMap()) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (typeof value === 'function') {
    return value;
  }

  if (stack.has(value)) {
    return /** @type {T} */ (stack.get(value));
  }

  if (value instanceof Date) {
    return /** @type {T} */ (new Date(value.getTime()));
  }

  if (value instanceof RegExp) {
    return /** @type {T} */ (new RegExp(value.source, value.flags));
  }

  if (Array.isArray(value)) {
    const result = [];
    stack.set(value, result);
    for (let i = 0; i < value.length; i++) {
      result[i] = cloneDeep(value[i], stack);
    }
    return /** @type {T} */ (result);
  }

  if (isPlainObject(value)) {
    const result = {};
    stack.set(value, result);
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      result[key] = cloneDeep(value[key], stack);
    }
    return /** @type {T} */ (result);
  }

  return value;
}
