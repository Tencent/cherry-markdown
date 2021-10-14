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
const escapeMap = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#x27;',
};

const unescapeMap = {
  lt: '<',
  gt: '>',
  amp: '&',
  quot: '"',
  apos: "'",
};

// refs: https://www.freeformatter.com/html-entities.html
const ASCIICharacters = {
  34: '&quot;',
  38: '&amp;',
  39: '&apos;',
  60: '&lt;',
  62: '&gt;',
};

const ISO88591Characters = {
  192: '&Agrave;',
  193: '&Aacute;',
  194: '&Acirc;',
  195: '&Atilde;',
  196: '&Auml;',
  197: '&Aring;',
  198: '&AElig;',
  199: '&Ccedil;',
  200: '&Egrave;',
  201: '&Eacute;',
  202: '&Ecirc;',
  203: '&Euml;',
  204: '&Igrave;',
  205: '&Iacute;',
  206: '&Icirc;',
  207: '&Iuml;',
  208: '&ETH;',
  209: '&Ntilde;',
  210: '&Ograve;',
  211: '&Oacute;',
  212: '&Ocirc;',
  213: '&Otilde;',
  214: '&Ouml;',
  216: '&Oslash;',
  217: '&Ugrave;',
  218: '&Uacute;',
  219: '&Ucirc;',
  220: '&Uuml;',
  221: '&Yacute;',
  222: '&THORN;',
  223: '&szlig;',
  224: '&agrave;',
  225: '&aacute;',
  226: '&acirc;',
  227: '&atilde;',
  228: '&auml;',
  229: '&aring;',
  230: '&aelig;',
  231: '&ccedil;',
  232: '&egrave;',
  233: '&eacute;',
  234: '&ecirc;',
  235: '&euml;',
  236: '&igrave;',
  237: '&iacute;',
  238: '&icirc;',
  239: '&iuml;',
  240: '&eth;',
  241: '&ntilde;',
  242: '&ograve;',
  243: '&oacute;',
  244: '&ocirc;',
  245: '&otilde;',
  246: '&ouml;',
  248: '&oslash;',
  249: '&ugrave;',
  250: '&uacute;',
  251: '&ucirc;',
  252: '&uuml;',
  253: '&yacute;',
  254: '&thorn;',
  255: '&yuml;',
};

const ISO88591Symbols = {
  160: '&nbsp;',
  161: '&iexcl;',
  162: '&cent;',
  163: '&pound;',
  164: '&curren;',
  165: '&yen;',
  166: '&brvbar;',
  167: '&sect;',
  168: '&uml;',
  169: '&copy;',
  170: '&ordf;',
  171: '&laquo;',
  172: '&not;',
  173: '&shy;',
  174: '&reg;',
  175: '&macr;',
  176: '&deg;',
  177: '&plusmn;',
  178: '&sup2;',
  179: '&sup3;',
  180: '&acute;',
  181: '&micro;',
  182: '&para;',
  184: '&cedil;',
  185: '&sup1;',
  186: '&ordm;',
  187: '&raquo;',
  188: '&frac14;',
  189: '&frac12;',
  190: '&frac34;',
  191: '&iquest;',
  215: '&times;',
  247: '&divide;',
};

const MathSymbols = {
  8704: '&forall;',
  8706: '&part;',
  8707: '&exist;',
  8709: '&empty;',
  8711: '&nabla;',
  8712: '&isin;',
  8713: '&notin;',
  8715: '&ni;',
  8719: '&prod;',
  8721: '&sum;',
  8722: '&minus;',
  8727: '&lowast;',
  8730: '&radic;',
  8733: '&prop;',
  8734: '&infin;',
  8736: '&ang;',
  8743: '&and;',
  8744: '&or;',
  8745: '&cap;',
  8746: '&cup;',
  8747: '&int;',
  8756: '&there4;',
  8764: '&sim;',
  8773: '&cong;',
  8776: '&asymp;',
  8800: '&ne;',
  8801: '&equiv;',
  8804: '&le;',
  8805: '&ge;',
  8834: '&sub;',
  8835: '&sup;',
  8836: '&nsub;',
  8838: '&sube;',
  8839: '&supe;',
  8853: '&oplus;',
  8855: '&otimes;',
  8869: '&perp;',
  8901: '&sdot;',
};

const GreekLetters = {
  913: '&Alpha;',
  914: '&Beta;',
  915: '&Gamma;',
  916: '&Delta;',
  917: '&Epsilon;',
  918: '&Zeta;',
  919: '&Eta;',
  920: '&Theta;',
  921: '&Iota;',
  922: '&Kappa;',
  923: '&Lambda;',
  924: '&Mu;',
  925: '&Nu;',
  926: '&Xi;',
  927: '&Omicron;',
  928: '&Pi;',
  929: '&Rho;',
  931: '&Sigma;',
  932: '&Tau;',
  933: '&Upsilon;',
  934: '&Phi;',
  935: '&Chi;',
  936: '&Psi;',
  937: '&Omega;',
  945: '&alpha;',
  946: '&beta;',
  947: '&gamma;',
  948: '&delta;',
  949: '&epsilon;',
  950: '&zeta;',
  951: '&eta;',
  952: '&theta;',
  953: '&iota;',
  954: '&kappa;',
  955: '&lambda;',
  956: '&mu;',
  957: '&nu;',
  958: '&xi;',
  959: '&omicron;',
  960: '&pi;',
  961: '&rho;',
  962: '&sigmaf;',
  963: '&sigma;',
  964: '&tau;',
  965: '&upsilon;',
  966: '&phi;',
  967: '&chi;',
  968: '&psi;',
  969: '&omega;',
  977: '&thetasym;',
  978: '&upsih;',
  982: '&piv;',
};

const MiscellaneousHTMLEntities = {
  338: '&OElig;',
  339: '&oelig;',
  352: '&Scaron;',
  353: '&scaron;',
  376: '&Yuml;',
  402: '&fnof;',
  710: '&circ;',
  732: '&tilde;',
  8194: '&ensp;',
  8195: '&emsp;',
  8201: '&thinsp;',
  8204: '&zwnj;',
  8205: '&zwj;',
  8206: '&lrm;',
  8207: '&rlm;',
  8211: '&ndash;',
  8212: '&mdash;',
  8216: '&lsquo;',
  8217: '&rsquo;',
  8218: '&sbquo;',
  8220: '&ldquo;',
  8221: '&rdquo;',
  8222: '&bdquo;',
  8224: '&dagger;',
  8225: '&Dagger;',
  8226: '&bull;',
  8230: '&hellip;',
  8240: '&permil;',
  8242: '&prime;',
  8243: '&Prime;',
  8249: '&lsaquo;',
  8250: '&rsaquo;',
  8254: '&oline;',
  8364: '&euro;',
  8482: '&trade;',
  8592: '&larr;',
  8593: '&uarr;',
  8594: '&rarr;',
  8595: '&darr;',
  8596: '&harr;',
  8629: '&crarr;',
  8968: '&lceil;',
  8969: '&rceil;',
  8970: '&lfloor;',
  8971: '&rfloor;',
  9674: '&loz;',
  9824: '&spades;',
  9827: '&clubs;',
  9829: '&hearts;',
  9830: '&diams;',
};

// TODO: 使用whatwg的entities.json
const htmlEntitiesMap = {
  ...ASCIICharacters,
  ...ISO88591Characters,
  ...ISO88591Symbols,
  ...MathSymbols,
  ...GreekLetters,
  ...MiscellaneousHTMLEntities,
};

const htmlEntitiesCodePoint = Object.keys(htmlEntitiesMap);

const htmlEntitiesWithoutSemicolon = htmlEntitiesCodePoint.map((code) =>
  htmlEntitiesMap[code].replace(/^&(\w+);$/g, (match, name) => name.toLowerCase()),
);

/**
 * 非字符串类型与长度为0的字符串都认为是空串
 * @param {any} str 需要判断的字符串
 * @returns {boolean}
 */
const isEmptyString = (str) => typeof str !== 'string' || str.length <= 0;

const isValidStringCodePoint = (codePoint) => {
  try {
    const string = String.fromCodePoint(codePoint);
    return !isEmptyString(string); // 如果转换的为空串，说明CodePoint不合法
  } catch (e) {
    // 转换出错，也是不合法的CodePoint
    return false;
  }
};

export function escapeHTMLEntitiesWithoutSemicolon(content) {
  if (typeof content !== 'string') {
    return '';
  }
  // 先处理字符实体
  const namedRegex = /&(\w+);?/g;
  let escaped = content.replace(namedRegex, (match, name) => {
    // 不在合法列表里的全部转义，无分号的情况也转义
    if (match.indexOf(';') === -1 || htmlEntitiesWithoutSemicolon.indexOf(name.toLowerCase()) === -1) {
      return match.replace(/&/g, '&amp;');
    }
    return match;
  });
  // 处理十进制数字实体，需要防止误匹配16进制
  const numericRegex = /&#(?!x)(\d*);?/gi;
  escaped = escaped.replace(numericRegex, (match, decimalCodePoint) => {
    // 不在合法列表里的全部转义，无分号的情况也转义
    // 且位数不能大于7，否则可能导致溢出: https://spec.commonmark.org/0.29/#decimal-numeric-character
    if (
      isEmptyString(decimalCodePoint) ||
      match.indexOf(';') === -1 ||
      decimalCodePoint.lenth > 7 ||
      // Object.keys(htmlEntitiesMap).indexOf(+decimalCodePoint) === -1 ||
      !isValidStringCodePoint(decimalCodePoint)
    ) {
      return match.replace(/&/g, '&amp;');
    }
    return match;
  });
  // 处理十六进制数字实体
  const hexRegex = /&#x([0-9a-f]*);?/gi;
  escaped = escaped.replace(hexRegex, (match, hexCodePoint) => {
    if (isEmptyString(hexCodePoint)) {
      return match.replace(/&/g, '&amp;');
    }
    const hexCode = `0x${hexCodePoint}`;
    const decimalCodePoint = parseInt(hexCode, 16);
    // parseInt非数字、不在合法列表里、无分号的情况全部转义
    // 且位数不能大于6: https://spec.commonmark.org/0.29/#hexadecimal-numeric-character
    if (
      isNaN(decimalCodePoint) ||
      match.indexOf(';') === -1 ||
      hexCodePoint.lenth > 6 ||
      // Object.keys(htmlEntitiesMap).indexOf(decimalCodePoint) === -1
      !isValidStringCodePoint(hexCode)
    ) {
      return match.replace(/&/g, '&amp;');
    }
    return match;
  });
  return escaped;
}

export const blockNames = [
  'h1|h2|h3|h4|h5|h6',
  'ul|ol|li|dd|dl|dt',
  'table|thead|tbody|tfoot|col|colgroup|th|td|tr',
  'div|article|section|footer|aside|details|summary|code|audio|video|canvas|figure',
  'address|center|cite|p|pre|blockquote|marquee|caption|figcaption|track|source|output|svg',
].join('|');
export const inlineNames = [
  'span|a|link|b|s|i|del|u|em|strong|sup|sub|kbd',
  'nav|font|bdi|samp|map|area|small|time|bdo|var|wbr|meter|dfn',
  'ruby|rt|rp|mark|q|progress|input|textarea|select|ins',
].join('|');
export const inlineBlock = 'br|img|hr';
export const whiteList = new RegExp(`^(${blockNames}|${inlineNames}|${inlineBlock})( |$|/)`, 'i');

export function escapeHTMLSpecialChar(content, enableQuote) {
  if (typeof content !== 'string') {
    return '';
  }
  if (enableQuote) {
    return content.replace(/[<>&]/g, (char) => escapeMap[char] || char);
  }
  return content.replace(/[<>&"']/g, (char) => escapeMap[char] || char);
}

export function unescapeHTMLSpecialChar(content) {
  if (typeof content !== 'string') {
    return '';
  }
  return content.replace(/&(\w+);?/g, (escaped, name) => unescapeMap[name] || escaped);
}

export function escapeHTMLSpecialCharOnce(content, enableQuote) {
  if (typeof content !== 'string') {
    return '';
  }
  let str = convertHTMLNumberToName(content);
  str = unescapeHTMLSpecialChar(str);
  return escapeHTMLSpecialChar(str, enableQuote);
}

export function convertHTMLNumberToName(html) {
  const entities = /&#(\d+);?/g;
  return html.replace(entities, (match, codePoint) => htmlEntitiesMap[codePoint] || match);
}

export function unescapeHTMLNumberEntities(html) {
  const entities = /&#(\d+);?/g;
  return html.replace(entities, (match, codePoint) => {
    try {
      const escaped = String.fromCodePoint(codePoint);
      return escaped;
    } catch (e) {
      return match;
    }
  });
}

export function unescapeHTMLHexEntities(html) {
  const entities = /&#x([0-9a-f]+);?/gi;
  return html.replace(entities, (match, codePoint) => {
    const hexCode = parseInt(`0x${codePoint}`, 16);
    try {
      const escaped = String.fromCodePoint(hexCode);
      return escaped;
    } catch (e) {
      return match;
    }
  });
}

export function isValidScheme(url) {
  const regex = /^\s*([\w\W]+?)(?=:)/i;
  const match = unescapeHTMLHexEntities(unescapeHTMLNumberEntities(url)).match(regex);
  if (!match) {
    return true;
  }
  const SCHEME_BLACKLIST = ['javascript', 'data'];
  const scheme = match[1].replace(/[\s]/g, ''); // 协议中间可能会出现空白字符绕过检查
  if (SCHEME_BLACKLIST.indexOf(scheme.toLowerCase()) !== -1) {
    return false;
  }
  return true;
}

/**
 * ref: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
 * RFC3986 encodeURIComponent
 * @param {string} str
 */
export function encodeURIComponentRFC3986(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`);
}

/**
 * ref: https://stackoverflow.com/questions/9245333/should-encodeuri-ever-be-used
 * @param {string} str
 */
export function encodeURIOnce(str) {
  return encodeURI(str)
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16)}`)
    .replace(/%25/g, '%');
}
