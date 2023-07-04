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

/**
 * 用于lodash.mergeWith的customizer
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

/**
 * 保存当前主题
 * @param {string} theme
 */
function saveThemeToLocal(theme) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('cherry-theme', theme);
  }
}

/**
 * 获取当前主题
 * @returns {string} 主题名
 */
export function getThemeFromLocal(fullClass = false) {
  let ret = 'default';
  if (typeof localStorage !== 'undefined') {
    const localTheme = localStorage.getItem('cherry-theme');
    if (localTheme) {
      ret = localTheme;
    }
  }
  return fullClass ? `theme__${ret}` : ret;
}

/**
 * 修改主题
 * @param {object} $cherry
 * @param {string} theme 如果没有传theme，则从本地缓存里取
 */
export function changeTheme($cherry, theme = '') {
  const newTheme = (theme ? theme : getThemeFromLocal()).replace(/^.*theme__/, '');
  const newClass = ` theme__${newTheme}`;
  $cherry.wrapperDom.className = $cherry.wrapperDom.className.replace(/ theme__[^ $]+?( |$)/g, '') + newClass;
  $cherry.previewer.getDomContainer().className =
    $cherry.previewer.getDomContainer().className.replace(/ theme__[^ $]+?( |$)/g, '') + newClass;
  saveThemeToLocal(newTheme);
}
