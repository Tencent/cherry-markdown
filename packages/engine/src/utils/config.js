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
 * 用于 mergeWith 的 customizer
 * @param {any} objValue
 * @param {any} srcValue
 * @returns
 */
export function customizer(objValue, srcValue) {
  if (Array.isArray(srcValue)) {
    return srcValue;
  }
}

/**
 * 检查本地有没有值
 * @param {string} key
 */
export function testKeyInLocal(key) {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(`cherry-${key}`) !== null;
  }
  return false;
}

/**
 * 保存是否经典换行
 * @param {boolean} isClassicBr
 */
export function saveIsClassicBrToLocal(isClassicBr) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cherry-classicBr', isClassicBr ? 'true' : 'false');
  }
}

/**
 * 是否经典换行
 */
export function getIsClassicBrFromLocal() {
  let ret = 'false';
  if (typeof localStorage !== 'undefined') {
    ret = localStorage.getItem('cherry-classicBr');
  }
  return ret === 'true';
}
