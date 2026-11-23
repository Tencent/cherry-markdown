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
export function compileRegExp(obj, flags, allowExtendedFlags) {
  let source = obj.begin + obj.content + obj.end;
  if (allowExtendedFlags) {
    // Extend \h for horizontal whitespace
    source = source.replace(/\[\\h\]/g, HORIZONTAL_WHITESPACE).replace(/\\h/g, HORIZONTAL_WHITESPACE);
  }
  return new RegExp(source, flags || 'g');
}

export const mathBlockReg = isLookbehindSupported()
  ? /(\s*)((?<!\\))~D~D\s*([\w\W]*?)(\s*)~D~D(?:\s{0,1})/g
  : /(\s*)(^|[^\\])~D~D\s*([\w\W]*?)(\s*)~D~D(?:\s{0,1})/g;

export function isLookbehindSupported() {
  try {
    new RegExp('(?<=.)');
    return true;
  } catch {}
  return false;
}

export const HORIZONTAL_WHITESPACE = '[ \\t\\u00a0]';

// 仅适用非多行模式的正则
export const ALLOW_WHITESPACE_MULTILINE = '(?:.*?)(?:(?:\\n.*?)*?)';
export const DO_NOT_STARTS_AND_END_WITH_SPACES = '(?:\\S|(?:\\S.*?\\S))';
export const DO_NOT_STARTS_AND_END_WITH_SPACES_MULTILINE =
  '(?:(?:\\S|(?:\\S[^\\n]*?\\S))(?:\\n(?:\\S|(?:\\S[^\\n]*?\\S)))*?)';

/**
 * @deprecated
 *
 * 存在严重性能问题，应弃用
 */
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

// 正则结果[全部, 判定符之前的空格或者tab, 判定符, checkbox内容(没有就是undefined), 列表内容]
export const LIST_CONTENT =
  /^([ \t]*)([*+-][ ](\[[ x]\])?|[0-9一二三四五六七八九十零]+\.|[a-z]\.|\b(?:M{0,3}(?:CM|CD|D?C{0,3})(?:XC|XL|L?X{0,3})(?:IX|IV|V?I{0,3}))\b\.)([^\r\n]*)/;

// 表格规则的模块级缓存：
// - TABLE_RULE_SPLIT 缓存 merge=false 的返回值（{ strict, loose } 结构体，内部各含 reg）
// - TABLE_RULE_MERGED 缓存 merge=true 的返回值（合并后的单个 RegExp）
/** @type {ReturnType<typeof buildTableRuleSplit> | null} */
let TABLE_RULE_SPLIT = null;
/** @type {RegExp | null} */
let TABLE_RULE_MERGED = null;

function buildTableRuleSplit() {
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

  return { strict, loose };
}

export function getTableRule(merge = false) {
  if (merge === false) {
    if (TABLE_RULE_SPLIT === null) {
      TABLE_RULE_SPLIT = buildTableRuleSplit();
    }
    return TABLE_RULE_SPLIT;
  }
  if (TABLE_RULE_MERGED === null) {
    const { strict, loose } = TABLE_RULE_SPLIT ?? buildTableRuleSplit();
    const regStr = `(?:${strict.begin + strict.content + strict.end}|${loose.begin + loose.content + loose.end})`;
    TABLE_RULE_MERGED = compileRegExp({ begin: '', content: regStr, end: '' }, 'g', true);
  }
  return TABLE_RULE_MERGED;
}

export function getCodeBlockRule() {
  // 使用字符串定义各部分，避免 TypeScript 对单独的正则表达式进行反向引用检查
  const beginSource = '(?:^|\\n)(\\n*((?:>[\\t ]*)*)(?:[^\\S\\n]*))(`{3,})([^`]*?)\\n';
  const contentSource = '([\\w\\W]*?)';
  const endSource = '[^\\S\\n]*\\3[ \\t]*(?=$|\\n+)'; // \3 反向引用第3个捕获组（反引号数量）

  const codeBlock = {
    /**
     * (?:^|\n)是区块的通用开头
     * (\n*)捕获区块前的所有换行
     * ((?:>\s*)*) 捕获代码块前面的引用（"> > > " 这种东西）
     * (?:[^\S\n]*)捕获```前置的空格字符
     * 只要有连续3个及以上`并且前后`的数量相等，则认为是代码快语法
     */
    begin: new RegExp(beginSource),
    content: new RegExp(contentSource),
    end: new RegExp(endSource),
    reg: new RegExp(beginSource + contentSource + endSource, 'g'),
  };
  return {
    ...codeBlock,
    begin: beginSource,
    content: contentSource,
    end: endSource,
  };
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

/**
 * detail Html标签语法的识别正则
 * 例：
 * <details open>
 *   <summary>标题</summary>
 *   内容
 * </details>
 * @returns {object}
 */
export function getDetailHtmlRule() {
  const reg = /(?:^|\n)(\n*(?:[^\S\n]*))<details[ ]*(open)?>[\s]*<summary>([\w\W]*?)<\/summary>([\w\W]*?)<\/details>/g;
  return reg;
}

// 匹配图片URL里的base64，[name](data:image/png;base64,xxx) 和 ![alt](data:image/png;base64,xxx) 这两种形式的都处理
export const imgBase64Reg = /(\[[^\n]*?\]\(data:image\/[a-z]{1,10};base64,)([^)]+)\)/g;

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
export function getLinkRule() {
  const ret = {
    // lookbehind启用分组是为了和不兼容lookbehind的场景共用一个回调
    begin: isLookbehindSupported() ? '((?<!\\\\))' : '(^|[^\\\\])',
    content: [
      // ?<text> 单行时保持原规则；跨行（软换行）时最多 3 行、不跨空行，且文字内不能再有 [ ]，
      // 避免从前几行的 `[`（如 a[i]、[0, 1)）开始匹配，导致 LinkFormatter 把中间的公式也转义掉；
      // 跨行时也不匹配 `![`，图片 alt 跨行的情况保持原样，不渲染成 `!` + 链接
      `\\[([^\\n]*?|${isLookbehindSupported() ? '(?<!!\\[)' : ''}[^\\[\\]\\n]*(?:\\n(?![ \\t]*\\n)[^\\[\\]\\n]*){1,2})\\]`,
      '[ \\t]*', // any spaces
      '\\(',
      /**
       * URL 分支：对齐 CommonMark 规范，并消除分支内部的交替歧义
       *
       * 原规则 `((?:[^\s()]*\([^\s()]*\)[^\s()]*)+|[^\s)]+)` 存在两个问题：
       *   - 两个顶层分支的字符集高度重叠（都能吃到普通字符），匹配普通 URL 时等价，
       *     属于经典的 `(a+)+` 式交替歧义，会放大外层回溯开销；
       *   - 括号分支是「单层嵌套」`[^\s()]*\([^\s()]*\)[^\s()]*`，只认一层括号，
       *     不支持 CommonMark 496 的双层嵌套 `foo(and(bar))`；
       *   - 两个分支都没有处理 `\(` `\)` 转义（CommonMark 498），也没有处理
       *     angle-bracketed 形式 `<...>`（CommonMark 499）。
       *
       * 新设计将 URL 拆为两条「首字符互斥」的顶层分支，普通分支内部由若干互斥原子
       * 组成，彼此之间没有重叠，分支内部不再产生回溯空间：
       *   1) angle-bracketed 形式 `<...>`：首字符为 `<`，内部任意非 `<>` 非换行字符。
       *   2) 普通形式：由若干「URL 原子」构成，首字符互斥的三条路径：
       *        a. 反斜杠转义 `\.` —— 以 `\` 开头，吃掉下一个字符，支持 `\(` `\)` 字面量；
       *        b. 成对括号 `( ... )` —— 以 `(` 开头，内部允许「普通字符 | 反斜杠转义 |
       *           再一层成对括号」，覆盖 CommonMark 496 的双层嵌套；
       *        c. 单个普通字符 —— 非空白、非 `\`、非 `()`。
       *
       * 覆盖的 CommonMark 用例：
       *   - 496  `[link](foo(and(bar)))`      能正确解析嵌套括号
       *   - 497  `[link](foo(and(bar))`       括号不平衡时按规范不渲染
       *   - 498  `[link](foo\(and\(bar\))`    支持反斜杠转义括号
       *   - 499  `[link](<foo(and(bar)>)`     走 angle-bracketed 分支的 fallback
       *
       * 说明：本次改动「减少」了 URL 分支内部的回溯空间，但 ReDoS 并未被彻底根除——
       * 外层 text 分支的二选一结构 + `g` 标志下的多起点匹配仍可能被恶意构造输入触发
       * 回溯放大，参见本函数所在 issue 的后续熔断/预检方案。
       */
      '(' +
        // 分支 1：<...>
        '<[^<>\\n]*>' +
        '|' +
        // 分支 2：普通 URL，由互斥的原子组成
        '(?:' +
        '\\\\.' + // 反斜杠转义
        '|' +
        // 成对括号（允许内部再嵌一层成对括号，支持 CommonMark 双层嵌套）
        '\\((?:\\\\.|\\((?:\\\\.|[^\\s\\\\()])*\\)|[^\\s\\\\()])*\\)' +
        '|' +
        '[^\\s\\\\()]' + // 普通字符
        ')+' +
        ')', // ?<link> url
      /**
       * title 分支：对齐 CommonMark 规范，并消除分支内部的交替歧义
       *
       * 原规则 `("..*?"|'.*?')` 的 `.*?` 懒惰匹配在引号未闭合时会沿行扩张、反复试探
       * 下游 `\)` 的位置，产生 O(n) 的分支内回溯；且 `.*?` 不认 `\"` `\'` 转义，
       * CommonMark 506 的 `[link](/url "title \"&quot;")` 会被错误地截断在首个
       * 未转义 `"` 处而无法完整识别 title。
       *
       * 新规则将 title 内部拆为两个首字符互斥的原子：
       *   a. 反斜杠转义 `\.` —— 以 `\` 开头，吃掉下一个字符，支持 `\"` / `\'` 字面量；
       *   b. 普通字符 —— 非 `"`（或 `'`）、非 `\`、非 `\n`。
       * 两个原子不重叠；结构一旦无法成立即失败，分支内部不再有回溯空间。
       *
       * 覆盖的 CommonMark 用例：
       *   - 506  `[link](/url "title \"&quot;")`   支持 title 内 `\"` 转义
       *   - 508  `[link](/url "title "and" title")` title 含未转义 `"` 时按规范不渲染
       *
       * 说明：同 URL 分支的说明——此改动只消除了 title 分支内部的歧义/回溯，
       * 对由外层 text 分支与多起点匹配叠加触发的 ReDoS 仍无能为力。
       */
      '(?:[ \\t](' + '"(?:\\\\.|[^"\\\\\\n])*"' + '|' + "'(?:\\\\.|[^'\\\\\\n])*'" + '))?', // ?<title> optional
      '\\)',
      '(\\{target\\s*=\\s*(_blank|parent|self|top)\\})?',
    ].join(''),
    end: '',
  };
  ret.reg = compileRegExp(ret, 'g');
  return ret;
}

// 匹配base64数据
export const base64Reg = /(data:image\/[a-z]{1,10};base64,)([0-9a-zA-Z+/=]+)/g;

// 匹配内容非常多的单行文本，为了避免表格的场景，所以特意避免表格的识别
export const longTextReg = /[^\n|`\s]{6000,}/g;

/**
 * 创建匹配markdown中URL链接的正则表达式
 * @param {number} minLength 最小URL长度，超过此长度才会被缩略
 * @returns {[RegExp, RegExp]} 正则表达式对象
 */
export const createUrlReg = (minLength) => {
  // 匹配普通URL链接（包括http、https、ftp等协议）
  const protocolUrlPattern = `(\\]\\()([a-z][a-z0-9+.-]{1,31}:(?:\\/\\/)?[^\\s)]{${minLength - 10},})\\)`;

  // 匹配无协议头但以www开头的URL
  const wwwUrlPattern = `(\\]\\()(www\\.[^\\s)]{${minLength - 4},})\\)`;

  return [new RegExp(protocolUrlPattern, 'g'), new RegExp(wwwUrlPattern, 'g')];
};

// 匹配图片{}里的data-xml属性
export const imgDrawioXmlReg = /(!\[[^\n]*?\]\([^)]+\)\{[^}]* data-xml=)([^}]+)\}/g;

/**
 * 匹配draw.io的图片语法
 * 图片的语法为 ![alt](${base64}){data-type=drawio data-xml=${xml}}
 */
export const imgDrawioReg =
  /(!\[[^\n]*?\]\(data:image\/[a-z]{1,10};base64,[^)]+\)\{data-type=drawio data-xml=[^}]+\})/g;

/**
 * 从编辑器里的内容中获取没有代码块的内容
 * @param {string} value
 * @returns {string}
 */
export const getValueWithoutCode = (value = '') =>
  value
    .replace(getCodeBlockRule().reg, (whole) => {
      // 把代码块里的内容干掉
      return whole.replace(/^.*$/gm, '/n');
    })
    .replace(/(`+)(.+?(?:\n.+?)*?)\1/g, (whole) => {
      // 把行内代码的符号去掉
      return whole.replace(/[![\]()]/g, '.');
    });

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
export function protectLongLines(str, maxLineLength = 10000) {
  if (!str || str.length <= maxLineLength) {
    return { safeStr: str, restore: (x) => x };
  }
  const stash = [];
  const safeStr = str.replace(/[^\n]+/g, (line) => {
    if (line.length <= maxLineLength) return line;
    const idx = stash.push(line) - 1;
    return `~__LL${idx}__~`;
  });
  if (stash.length === 0) {
    return { safeStr: str, restore: (x) => x };
  }
  const restore = (processed) => processed.replace(/~__LL(\d+)__~/g, (_, i) => stash[+i]);
  return { safeStr, restore };
}
