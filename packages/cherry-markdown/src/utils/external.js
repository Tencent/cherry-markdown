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
import { isBrowser } from './env';

/**
 * 安全获取 window 上的外部依赖（如 echarts、katex、MathJax、mermaid）
 *
 * 解决的问题：
 * 1. SSR / 非浏览器环境安全：内部已做 isBrowser 守卫，调用方无需重复判断
 * 2. 统一获取逻辑：避免各处散落 `window.xxx ?? externals?.xxx` 的重复代码
 * 3. 类型安全：返回值带有正确的类型标注
 *
 * @template T - 依赖的类型
 * @param {string} name - window 上的属性名，如 'echarts'、'katex'
 * @param {T} [externalsValue] - 外部注入的备选值（优先使用）
 * @returns {T | undefined} 找到的依赖实例，或 undefined
 */
export function getExternal(name, externalsValue) {
  // 优先使用外部注入的值（通过 CherryMarkdown options.externals 传入）
  if (externalsValue !== undefined) {
    return externalsValue;
  }
  // 其次从 window 全局对象获取（SSR 安全）
  if (!isBrowser()) {
    return undefined;
  }
  return window[name];
}

export default {};
