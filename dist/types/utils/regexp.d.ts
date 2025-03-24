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
export function getListFromStr(selection: any, type: ('ol' | 'ul' | 'checklist')): string;
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
export const CHINESE_PUNCTUATION: "[！“”¥‘’（），。—：；《》？【】「」·～｜]";
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
export const imgDrawioXmlReg: RegExp;
/**
 * 匹配draw.io的图片语法
 * 图片的语法为 ![alt](${base64}){data-type=drawio data-xml=${xml}}
 */
export const imgDrawioReg: RegExp;
export function getValueWithoutCode(value?: string): string;
