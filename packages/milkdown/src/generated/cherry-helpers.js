// Generated from Tencent Cherry Markdown (Apache-2.0) by sync-cherry-helpers.mjs. Do not edit.
/* eslint-disable no-unused-vars, no-control-regex -- Generated upstream Cherry code. */
// ../cherry-markdown/src/utils/image.js
var imgAltHelper = {
  /**
   * 提取alt部分的扩展属性
   * @param {string} alt 图片引用中的alt部分
   * @returns
   */
  processExtendAttributesInAlt(alt) {
    const attrRegex = /#([0-9]+(px|em|pt|pc|in|mm|cm|ex|%)|auto)/g;
    const info = alt.match(attrRegex);
    if (!info) {
      return '';
    }
    let extendAttrs = '';
    const [width, height] = info;
    if (width) {
      extendAttrs = `width:${width.replace(/[ #]*/g, '')};`;
    }
    if (height) {
      extendAttrs += `height:${height.replace(/[ #]*/g, '')};`;
    }
    return extendAttrs;
  },
  /**
   * 提取alt部分的扩展样式
   * @param {string} alt 图片引用中的alt部分
   * @returns {{extendStyles:string, extendClasses:string}}
   */
  processExtendStyleInAlt(alt) {
    const result = {
      extendStyles: '',
      extendClasses: '',
    };
    this.$addDecorationStyle(result, alt);
    this.$addAlignmentStyle(result, alt);
    return result;
  },
  /**
   * 从alt中提取装饰样式信息添加到 result 中
   * @param result 返回结果
   * @param alt
   */
  $addDecorationStyle(result, alt) {
    const info = alt.match(/#(border|shadow|radius|B|S|R)/g);
    if (info) {
      for (let i = 0; i < info.length; i++) {
        switch (info[i]) {
          case '#border':
          case '#B':
            result.extendStyles += 'border:1px solid #888888;padding: 2px;box-sizing: border-box;';
            result.extendClasses += ' cherry-img-deco-border';
            break;
          case '#shadow':
          case '#S':
            result.extendStyles += 'box-shadow:0 2px 15px -5px rgb(0 0 0 / 50%);';
            result.extendClasses += ' cherry-img-deco-shadow';
            break;
          case '#radius':
          case '#R':
            result.extendStyles += 'border-radius: 15px;';
            result.extendClasses += ' cherry-img-deco-radius';
            break;
        }
      }
    }
  },
  /**
   * 从alt中提取对齐方式名称
   * @param {string} alt
   * @returns {string}
   */
  $getAlignment(alt) {
    const styleRegex = /#(center|right|left|float-right|float-left)/i;
    const match = alt.match(styleRegex);
    return match ? match[1] : '';
  },
  /**
   * 从alt中提取对齐方式样式信息添加到 result 中
   * @param result 返回对象
   * @param {string} alt
   */
  $addAlignmentStyle(result, alt) {
    const alignment = this.$getAlignment(alt);
    if (!alignment) {
      return;
    }
    switch (alignment) {
      case 'center':
        result.extendStyles += 'transform:translateX(-50%);margin-left:50%;display:block;';
        result.extendClasses += ' cherry-img-align-center';
        return;
      case 'right':
        result.extendStyles +=
          'transform:translateX(-100%);margin-left:100%;margin-right:-100%;display:block;';
        result.extendClasses += ' cherry-img-align-right';
        return;
      case 'left':
        result.extendStyles += 'transform:translateX(0);margin-left:0;display:block;';
        result.extendClasses += ' cherry-img-align-left';
        return;
      case 'float-right':
        result.extendStyles += 'float:right;transform:translateX(0);margin-left:0;display:block;';
        result.extendClasses += ' cherry-img-align-float-left';
        return;
      case 'float-left':
        result.extendStyles += 'float:left;transform:translateX(0);margin-left:0;display:block;';
        result.extendClasses += ' cherry-img-align-float-right';
        return;
      default:
        return;
    }
  },
};
var image_default = imgAltHelper;

// ../cherry-markdown/src/utils/sanitize.js
var ASCIICharacters = {
  34: '&quot;',
  38: '&amp;',
  39: '&apos;',
  60: '&lt;',
  62: '&gt;',
};
var ISO88591Characters = {
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
var ISO88591Symbols = {
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
var MathSymbols = {
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
var GreekLetters = {
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
var MiscellaneousHTMLEntities = {
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
var htmlEntitiesMap = {
  ...ASCIICharacters,
  ...ISO88591Characters,
  ...ISO88591Symbols,
  ...MathSymbols,
  ...GreekLetters,
  ...MiscellaneousHTMLEntities,
};
var htmlEntitiesCodePoint = Object.keys(htmlEntitiesMap);
var htmlEntitiesWithoutSemicolon = htmlEntitiesCodePoint.map((code) =>
  htmlEntitiesMap[code].replace(/^&(\w+);$/g, (match, name) => name.toLowerCase()),
);
var blockNames = [
  'h1|h2|h3|h4|h5|h6',
  'ul|ol|li|dd|dl|dt',
  'table|thead|tbody|tfoot|col|colgroup|th|td|tr',
  'div|article|section|footer|aside|details|summary|code|audio|video|canvas|figure',
  'address|center|cite|p|pre|blockquote|marquee|caption|figcaption|track|source|output|svg',
].join('|');
var inlineNames = [
  'span|a|link|b|s|i|del|u|em|strong|sup|sub|kbd',
  'nav|font|bdi|samp|map|area|small|time|bdo|var|wbr|meter|dfn',
  'ruby|rt|rp|mark|q|progress|input|textarea|select|ins',
].join('|');
var inlineBlock = 'br|img|hr';
var whiteList = new RegExp(`^(${blockNames}|${inlineNames}|${inlineBlock})( |$|/)`, 'i');
function unescapeHTMLNumberEntities(html) {
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
function unescapeHTMLHexEntities(html) {
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
function isValidScheme(url) {
  const regex = /^\s*([\w\W]+?)(?=:)/i;
  const match = unescapeHTMLHexEntities(unescapeHTMLNumberEntities(url)).match(regex);
  if (!match) {
    return true;
  }
  const SCHEME_BLACKLIST = ['javascript', 'vbscript', 'data'];
  const scheme = match[1].replace(/[\s\x00-\x1f]/g, '');
  if (SCHEME_BLACKLIST.indexOf(scheme.toLowerCase()) !== -1) {
    return false;
  }
  return true;
}
function encodeURIOnce(str) {
  return encodeURI(str).replace(/%25/g, '%');
}

// ../cherry-markdown/src/utils/env.js
function isBrowser() {
  return typeof window === 'object';
}

// ../cherry-markdown/src/utils/copy.js
async function copyToClip(text, html) {
  if (!text && !html) {
    throw new Error('\u6CA1\u6709\u63D0\u4F9B\u4EFB\u4F55\u5185\u5BB9\u8FDB\u884C\u590D\u5236');
  }
  if (isBrowser() && navigator.clipboard && window.ClipboardItem) {
    try {
      const clipboardItems = {};
      if (text) {
        clipboardItems['text/plain'] = new Blob([text], { type: 'text/plain' });
      }
      if (html) {
        clipboardItems['text/html'] = new Blob([html], { type: 'text/html' });
      }
      await navigator.clipboard.write([new ClipboardItem(clipboardItems)]);
      return;
    } catch (err) {
      console.warn('Clipboard API failed, falling back to execCommand:', err);
    }
  }
  function listener(e) {
    if (text) {
      e.clipboardData.setData('text/plain', text);
    }
    if (html) {
      e.clipboardData.setData('text/html', html);
    }
    e.preventDefault();
  }
  document.addEventListener('copy', listener);
  try {
    const success = document.execCommand('copy');
    if (!success) {
      throw new Error('Copy command was unsuccessful');
    }
  } finally {
    document.removeEventListener('copy', listener);
  }
}
export { copyToClip, encodeURIOnce, image_default as image, isValidScheme };
