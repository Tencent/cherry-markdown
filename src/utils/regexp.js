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

export const HORIZONTAL_WHITESPACE = '[ \\t\\u00a0]';

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

// extra punctuations
export const CHINESE_PUNCTUATION = '[！“”¥‘’（），。—：；《》？【】「」·～｜]';

// 下划线强调语法允许的边界符号
export const UNDERSCORE_EMPHASIS_BOUNDARY =
  '[' +
  '\\u0021-\\u002F\\u003a-\\u0040\\u005b\\u005d\\u005e\\u0060\\u007b-\\u007e' + // punctuations defined in commonmark
  ' ' +
  '\\t\\n' +
  '！“”¥‘’（），。—：；《》？【】「」·～｜' + // chinese punctuations
  ']';

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

export function getTableRule(merge = false) {
  // ^(\|[^\n]+\|\r?\n)((?:\|:?[-]+:?)+\|)(\n(?:\|[^\n]+\|\r?\n?)*)?$
  // (\\|?[^\\n|]+\\|?\\n)(?:\\|?[\\s]*:?[-]{2,}:?[\\s]*
  // (?:\\|[\\s]*:?[-]{2,}:?[\\s]*)+\\|?)(\\n\\|?(\\|[^\\n|]+)*\\|?)?
  /**
   * (\|[^\n]+\|\n)     Headers
   * ((\|[\s]*:?[-]{2,}:?[\s]*)+\|)      Column Options
   * ((?:\n\|[^\n]+\|)*)  Rows
   */
  const strict = {
    begin: '(?:^|\\n)(\\n*)',
    content: [
      '(\\h*\\|[^\\n]+\\|?\\h*)', // Header
      '\\n',
      '(?:(?:\\h*\\|\\h*:?[-]{1,}:?\\h*)+\\|?\\h*)', // Column Options
      '((\\n\\h*\\|[^\\n]+\\|?\\h*)*)', // Rows
    ].join(''),
    end: '(?=$|\\n)',
  };

  strict.reg = compileRegExp(strict, 'g', true);

  const loose = {
    begin: '(?:^|\\n)(\\n*)',
    content: [
      '(\\|?[^\\n|]+(\\|[^\\n|]+)+\\|?)', // Header
      '\\n',
      '(?:\\|?\\h*:?[-]{1,}:?[\\h]*(?:\\|[\\h]*:?[-]{1,}:?\\h*)+\\|?)', // Column Options
      '((\\n\\|?([^\\n|]+(\\|[^\\n|]*)+)\\|?)*)', // Rows
    ].join(''),
    end: '(?=$|\\n)',
  };

  loose.reg = compileRegExp(loose, 'g', true);

  if (merge === false) {
    return { strict, loose };
  }
  const regStr = `(?:${strict.begin + strict.content + strict.end}|${loose.begin + loose.content + loose.end})`;
  return compileRegExp({ begin: '', content: regStr, end: '' }, 'g', true);
}

export function getCodeBlockRule() {
  const codeBlock = {
    /**
     * (?:^|\n)是区块的通用开头
     * (\n*)捕获区块前的所有换行
     * ((?:>\s*)*) 捕获代码块前面的引用（"> > > " 这种东西）
     * (?:[^\S\n]*)捕获```前置的空格字符
     * 只要有连续3个及以上`并且前后`的数量相等，则认为是代码快语法
     */
    begin: /(?:^|\n)(\n*((?:>[\t ]*)*)(?:[^\S\n]*))(`{3,})([^`]*?)\n/,
    content: /([\w\W]*?)/, // '([\\w\\W]*?)',
    end: /[^\S\n]*\3[ \t]*(?=$|\n+)/, // '\\s*```[ \\t]*(?=$|\\n+)',
  };
  codeBlock.reg = new RegExp(codeBlock.begin.source + codeBlock.content.source + codeBlock.end.source, 'g');
  return codeBlock;
}

/**
 * 从selection里获取列表语法
 * @param {*} selection
 * @param {('ol'|'ul'|'checklist')} type  列表类型
 * @returns {String}
 */
export function getListFromStr(selection, type) {
  let $selection = selection ? selection : 'Item 1\n    Item 1.1\nItem 2';
  $selection = $selection.replace(/^\n+/, '').replace(/\n+$/, '');
  let pre = '1.';
  switch (type) {
    case 'ol':
      pre = '1.';
      break;
    case 'ul':
      pre = '-';
      break;
    case 'checklist':
      pre = '- [x]';
      break;
  }
  $selection = $selection.replace(/^(\s*)([0-9a-zA-Z]+\.|- \[x\]|- \[ \]|-) /gm, '$1');
  // 对有序列表进行序号自增处理
  if (pre === '1.') {
    const listNum = {};
    $selection = $selection.replace(/^(\s*)(\S[\s\S]*?)$/gm, (match, p1, p2) => {
      const space = p1.match(/[ \t]/g)?.length || 0;
      listNum[space] = listNum[space] ? listNum[space] + 1 : 1;
      return `${p1}${listNum[space]}. ${p2}`;
    });
  } else {
    $selection = $selection.replace(/^(\s*)(\S[\s\S]*?)$/gm, `$1${pre} $2`);
  }
  return $selection;
}

/**
 * 信息面板的识别正则
 * @returns {object}
 */
export function getPanelRule() {
  const ret = {
    begin: /(?:^|\n)(\n*(?:[^\S\n]*)):::([^:][^\n]+?)\s*\n/,
    content: /([\w\W]*?)/,
    end: /\n[ \t]*:::[ \t]*(?=$|\n+)/,
  };
  ret.reg = new RegExp(ret.begin.source + ret.content.source + ret.end.source, 'g');
  return ret;
}

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
export function getDetailRule() {
  const ret = {
    begin: /(?:^|\n)(\n*(?:[^\S\n]*))\+\+\+([-]{0,1})\s+([^\n]+)\n/,
    content: /([\w\W]+?)/,
    end: /\n[ \t]*\+\+\+[ \t]*(?=$|\n+)/,
  };
  ret.reg = new RegExp(ret.begin.source + ret.content.source + ret.end.source, 'g');
  return ret;
}

// 匹配图片URL里的base64
export const imgBase64Reg = /(!\[[^\n]*?\]\(data:image\/png;base64,)([^)]+)\)/g;

// 匹配图片{}里的data-xml属性
export const imgDrawioXmlReg = /(!\[[^\n]*?\]\([^)]+\)\{[^}]* data-xml=)([^}]+)\}/g;

/**
 * 匹配draw.io的图片语法
 * 图片的语法为 ![alt](${base64}){data-type=drawio data-xml=${xml}}
 */
export const imgDrawioReg = /(!\[[^\n]*?\]\(data:image\/png;base64,[^)]+\)\{data-type=drawio data-xml=[^}]+\})/g;
