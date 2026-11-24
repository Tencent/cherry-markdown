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
export function compileRegExp(obj: any, flags: any, allowExtendedFlags: any): RegExp;
export function isLookbehindSupported(): boolean;
export function getTableRule(merge?: boolean): RegExp | {
    strict: {
        begin: string;
        content: string;
        end: string;
    };
    loose: {
        begin: string;
        content: string;
        end: string;
    };
};
export function getCodeBlockRule(): {
    begin: string;
    content: string;
    end: string;
    reg: RegExp;
};
/**
 * 从selection里获取列表语法
 * @param {*} selection
 * @param {('ol'|'ul'|'checklist')} type  列表类型
 * @returns {String}
 */
export function getListFromStr(selection: any, type: ("ol" | "ul" | "checklist")): string;
/**
 * 信息面板的识别正则
 * @returns {object}
 */
export function getPanelRule(): object;
/**
 * 手风琴/detail语法的识别正则
 * 例：
 * +++(-) 点击查看详情
 * body
 * body
 * ++ 标题（默认收起内容）
 * 内容
 * ++- 标题（默认展开内容）
 * 内容2
 * +++
 * @returns {object}
 */
export function getDetailRule(): object;
/**
 * detail Html标签语法的识别正则
 * 例：
 * <details open>
 *   <summary>标题</summary>
 *   内容
 * </details>
 * @returns {object}
 */
export function getDetailHtmlRule(): object;
/**
 * 超链接语法的识别规则
 * 由 Link 与 LinkFormatter 共享，避免多处重复定义链接正则
 * 分组：
 *   1. leadingChar     链接前的字符（非反斜杠）
 *   2. text            方括号内的链接文字
 *   3. link            括号内的URL
 *   4. title           可选的标题（含引号）
 *   5. target          {target=...} 段
 *   6. targetValue     target 具体值
 */
export function getLinkRule(): {
    begin: string;
    content: string;
    end: string;
};
/**
 * 超长行熔断工具：防止 getLinkRule() 等正则对单行过长的异常输入触发 ReDoS 回溯放大。
 *
 * 背景：
 *   getLinkRule() 的分支内部虽然已经消除了交替歧义，但外层 text 分支的二选一结构 +
 *   `g` 标志下的多起点匹配，在面对 `[a](b "[a](b "...` 这类单行内大量未闭合链接开头
 *   的攻击载荷时，仍会在正则引擎的"反复失败回溯"阶段消耗 O(n²)~O(n³) 的 CPU。
 *   这个开销发生在 `.replace()` 调用内部、回调函数还未被触发时，所以无法在回调里熔断，
 *   必须在 `.replace()` 调用之前介入。
 *
 * 方案：
 *   1. 调用方在 `.replace(linkRule, ...)` 之前先调 `protectLongLines(str)` 得到
 *      `{ safeStr, restore }`；
 *   2. 将原字符串中每一条长度超过 `maxLineLength` 的行替换成一个占位符（`~__LL${idx}__~`）
 *      存入 stash，返回"已挖洞"的 safeStr；
 *   3. 调用方对 safeStr 跑正则（超长行被占位符保护在外，正则接触不到攻击载荷）；
 *   4. 处理完毕后调用 `restore(processed)` 把占位符替换回原超长行。
 *
 * 性能：
 *   - 快速路径：若整段字符串长度小于 maxLineLength，直接返回原串与恒等 restore，
 *     对正常文档几乎零额外开销；
 *   - 命中路径：一次 O(n) 的扫描 + 替换，开销相对正则本身而言可忽略；
 *   - 攻击路径：把 O(n³) 的正则回溯降为 O(n) 的字符串替换。
 *
 * 占位符命名：
 *   `~__LL${idx}__~` 采用 Cherry 内部统一的 `~` 系前缀，与 LinkFormatter 的
 *   `~1D` / `~1LB` 等占位符处于同一命名空间但不会冲突；且绝不会被 getLinkRule()
 *   命中（内部不含 `[` `]` `(` `)`），对正则完全透明。
 *
 * 注意：占位符的挖/贴必须在同一个函数调用内闭合，不要跨越多个 hook 的生命周期，
 *       否则占位符可能漏到最终 HTML。
 *
 * @param {string} str 原字符串
 * @param {number} [maxLineLength=10000] 单行长度阈值；超过即视为疑似 ReDoS 载荷
 * @returns {{ safeStr: string, restore: (processed: string) => string }}
 */
export function protectLongLines(str: string, maxLineLength?: number): {
    safeStr: string;
    restore: (processed: string) => string;
};
export const mathBlockReg: RegExp;
export const HORIZONTAL_WHITESPACE: "[ \\t\\u00a0]";
export const ALLOW_WHITESPACE_MULTILINE: "(?:.*?)(?:(?:\\n.*?)*?)";
export const DO_NOT_STARTS_AND_END_WITH_SPACES: "(?:\\S|(?:\\S.*?\\S))";
export const DO_NOT_STARTS_AND_END_WITH_SPACES_MULTILINE: "(?:(?:\\S|(?:\\S[^\\n]*?\\S))(?:\\n(?:\\S|(?:\\S[^\\n]*?\\S)))*?)";
/**
 * @deprecated
 *
 * 存在严重性能问题，应弃用
 */
export const DO_NOT_STARTS_AND_END_WITH_SPACES_MULTILINE_ALLOW_EMPTY: "(?:(?:\\S|(?:\\S.*?\\S))(?:[ \\t]*\\n.*?)*?)";
export const NOT_ALL_WHITE_SPACES_INLINE: "(?:[^\\n]*?\\S[^\\n]*?)";
export const NORMAL_INDENT: "[ ]{0, 3}|\\t";
export const NO_BACKSLASH_BEFORE_CAPTURE: "[^\\\\]";
export const PUNCTUATION: "[\\u0021-\\u002F\\u003a-\\u0040\\u005b-\\u0060\\u007b-\\u007e]";
export const CHINESE_PUNCTUATION: "[\uFF01\u201C\u201D\u00A5\u2018\u2019\uFF08\uFF09\uFF0C\u3002\u2014\uFF1A\uFF1B\u300A\u300B\uFF1F\u3010\u3011\u300C\u300D\u00B7\uFF5E\uFF5C]";
export const UNDERSCORE_EMPHASIS_BOUNDARY: string;
export const EMAIL_INLINE: RegExp;
export const EMAIL: RegExp;
export const URL_INLINE_NO_SLASH: RegExp;
export const URL_INLINE: RegExp;
export const URL_NO_SLASH: RegExp;
export const URL: RegExp;
export const LIST_CONTENT: RegExp;
export const imgBase64Reg: RegExp;
export const base64Reg: RegExp;
export const longTextReg: RegExp;
export function createUrlReg(minLength: number): [RegExp, RegExp];
export const imgDrawioXmlReg: RegExp;
/**
 * 匹配draw.io的图片语法
 * 图片的语法为 ![alt](${base64}){data-type=drawio data-xml=${xml}}
 */
export const imgDrawioReg: RegExp;
export function getValueWithoutCode(value?: string): string;
