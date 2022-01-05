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
export function compileRegExp(obj, flags, allowExtendedFlags) {
  let source = obj.begin + obj.content + obj.end;
  if (allowExtendedFlags) {
    // Extend \h for horizontal whitespace
    source = source.replace(/\[\\h\]/g, HORIZONTAL_WHITESPACE).replace(/\\h/g, HORIZONTAL_WHITESPACE);
  }
  return new RegExp(source, flags || 'g');
}

export function isLookbehindSupported() {
  try {
    new RegExp('(?<=.)');
    return true;
  } catch (ignore) {}
  return false;
}

export const HORIZONTAL_WHITESPACE = '[ \\t ]';

// 仅适用非多行模式的正则
export const ALLOW_WHITESPACE_MULTILINE = '(?:.*?)(?:(?:\\n.*?)*?)';
export const DO_NOT_STARTS_AND_END_WITH_SPACES = '(?:\\S|(?:\\S.*?\\S))';
export const DO_NOT_STARTS_AND_END_WITH_SPACES_MULTILINE =
  '(?:(?:\\S|(?:\\S[^\\n]*?\\S))(?:\\n(?:\\S|(?:\\S[^\\n]*?\\S)))*?)';
export const DO_NOT_STARTS_AND_END_WITH_SPACES_MULTILINE_ALLOW_EMPTY = '(?:(?:\\S|(?:\\S.*?\\S))(?:[ \\t]*\\n.*?)*?)';

export const NOT_ALL_WHITE_SPACES_INLINE = '(?:[^\\n]*?\\S[^\\n]*?)';

export const NORMAL_INDENT = '[ ]{0, 3}|\\t';
export const NO_BACKSLASH_BEFORE_CAPTURE = '[^\\\\]';
// https://spec.commonmark.org/0.29/#ascii-punctuation-character
// !, ", #, $, %, &, ', (, ), *, +, ,, -, ., / (U+0021–2F),
// :, ;, <, =, >, ?, @ (U+003A–0040),
// [, \, ], ^, _, ` (U+005B–0060),
// {, |, }, or ~ (U+007B–007E).
export const PUNCTUATION = '[\\u0021-\\u002F\\u003a-\\u0040\\u005b-\\u0060\\u007b-\\u007e]';

// 下划线强调语法允许的边界符号
export const UNDERSCORE_EMPHASIS_BORDER =
  '[\\u0021-\\u002F\\u003a-\\u0040\\u005b\\u005d\\u005e\\u0060\\u007b-\\u007e \\t\\n]';

// https://html.spec.whatwg.org/multipage/input.html#e-mail-state-(type%3Demail)
export const EMAIL_INLINE = new RegExp(
  [
    /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+/.source,
    '@',
    /[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*/.source,
  ].join(''),
);
export const EMAIL = new RegExp(`^${EMAIL_INLINE.source}$`);

// https://gist.github.com/dperini/729294
// [USERNAME[:PASSWORD]@](IP|HOST)[:PORT][/SOURCE_PATH?QUERY_PARAMS#HASH]
export const URL_INLINE_NO_SLASH = new RegExp(
  '' + // 针对eslint的特殊处理
    '(?:\\S+(?::\\S*)?@)?' +
    '(?:' +
    // IP address exclusion
    // IP address dotted notation octets
    // excludes loopback network 0.0.0.0
    // excludes reserved space >= 224.0.0.0
    // excludes network & broadcast addresses
    // (first & last IP address of each class)
    '(?:1\\d\\d|2[01]\\d|22[0-3]|[1-9]\\d?)' +
    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
    '(?:\\.(?:1\\d\\d|2[0-4]\\d|25[0-4]|[1-9]\\d?))' +
    '|' +
    // host & domain names, may end with dot
    '(?![-_])(?:[-\\w\\xa1-\\xff]{0,63}[^-_]\\.)+' +
    // TLD identifier name, may end with dot
    '(?:[a-zA-Z\\xa1-\\xff]{2,}\\.?)' +
    ')' +
    // port number (optional)
    '(?::\\d{2,5})?' +
    // resource path (optional)
    '(?:[/?#][^\\s<>\\x00-\\x1f"\\(\\)]*)?',
);
export const URL_INLINE = new RegExp(
  // eslint特殊处理
  // protocol identifier (optional)
  // short syntax // still required
  // '(?:(?:(?:https?|ftp):)?\\/\\/)' +
  `(?:\\/\\/)${URL_INLINE_NO_SLASH.source}`,
);

export const URL_NO_SLASH = new RegExp(`^${URL_INLINE_NO_SLASH.source}$`);

export const URL = new RegExp(`^${URL_INLINE.source}$`);
