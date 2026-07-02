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

/**
 * @typedef {(...args: unknown[]) => unknown} DebouncedFunction
 * @typedef {DebouncedFunction & { cancel: () => void }} Debounced
 */

/**
 * 防抖：延迟 wait 毫秒后执行，期间重复调用会重置计时（trailing）。
 * @template {(...args: unknown[]) => unknown} T
 * @param {T} func 原函数
 * @param {number} [wait=0] 延迟毫秒数
 * @returns {Debounced}
 */
export default function debounce(func, wait = 0) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timerId;

  /** @type {Debounced} */
  const debounced = function (...args) {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = undefined;
      func.apply(this, args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
      timerId = undefined;
    }
  };

  return debounced;
}
