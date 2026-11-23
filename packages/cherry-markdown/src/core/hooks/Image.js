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
import SyntaxBase from '@/core/SyntaxBase';
import { escapeHTMLSpecialCharOnce as $e, encodeURIOnce } from '@/utils/sanitize';
import imgAltHelper from '@/utils/image';
import { compileRegExp, isLookbehindSupported, NOT_ALL_WHITE_SPACES_INLINE } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';
import UrlCache from '@/UrlCache';

/**
 * alt 跨行（软换行）时把换行连同两侧空白合成一个空格，
 * 否则换行会留在 alt 属性里，之后被段落处理成 `<br>`
 * @param {string} alt
 * @returns {string}
 */
function joinAltLines(alt) {
  return typeof alt === 'string' && alt.indexOf('\n') !== -1 ? alt.replace(/[ \t]*\n[ \t]*/g, ' ') : alt;
}

export default class Image extends SyntaxBase {
  static HOOK_NAME = 'image';

  constructor({ config, globalConfig }) {
    super(null);
    this.config = config;
    // TODO: URL Validator
    this.extendMedia = { tag: ['video', 'audio'] };
    this.RULE = this.rule(this.extendMedia);
  }

  replaceToHtml(type, match, leadingChar, rawAlt, link, title, poster) {
    const alt = joinAltLines(rawAlt);
    const refType = typeof link === 'undefined' ? 'ref' : 'url';
    let attrs = '';
    if (refType === 'ref') {
      // TODO: 全局引用
      return match;
    }

    if (refType === 'url') {
      const extent = imgAltHelper.processExtendAttributesInAlt(alt);
      let { extendStyles: style, extendClasses: classes } = imgAltHelper.processExtendStyleInAlt(alt);
      if (extent || style) {
        style = `style="${extent}${style}"`;
      }
      if (classes) {
        classes = ` class="${classes}" `;
      }
      attrs = title && title.trim() !== '' ? ` title="${$e(title)}"` : '';
      if (poster) {
        attrs += ` poster="${encodeURIOnce(poster)}"`;
      }

      const processedURL = this.$engine.urlProcessor(link, type);
      const defaultWrapper = `<${type} src="${UrlCache.set(
        encodeURIOnce(processedURL),
      )}"${attrs} ${style} ${classes} controls="controls">${$e(alt || '')}</${type}>`;
      return `${leadingChar}${
        this.config.videoWrapper ? this.config.videoWrapper(link, type, defaultWrapper) : defaultWrapper
      }`;
    }
    // should never happen
    return match;
  }

  toHtml(match, leadingChar, rawAlt, link, title, ref, extendAttrs) {
    // console.log(match, alt, link, ref, title);
    const alt = joinAltLines(rawAlt);
    const refType = typeof link === 'undefined' ? 'ref' : 'url';
    let attrs = '';
    if (refType === 'ref') {
      // 全局引用，理应在CommentReference中被替换，没有被替换说明没有定义引用项
      return match;
    }
    if (refType === 'url') {
      const extent = imgAltHelper.processExtendAttributesInAlt(alt);
      let { extendStyles: style, extendClasses: classes } = imgAltHelper.processExtendStyleInAlt(alt);
      if (extent || style) {
        style = `style="${extent}${style}"`;
      }
      if (classes) {
        classes = ` class="${classes}" `;
      }
      attrs = title && title.trim() !== '' ? ` title="${$e(title.replace(/["']/g, ''))}"` : '';
      let srcProp = 'src';
      let srcValue = link;
      const cherryOptions = this.$engine.$cherry.options;
      if (cherryOptions.callback && cherryOptions.callback.beforeImageMounted) {
        const imgAttrs = cherryOptions.callback.beforeImageMounted(srcProp, link);
        srcProp = imgAttrs.srcProp || srcProp;
        srcValue = imgAttrs.src || link;
      }
      const extendAttrStr = extendAttrs
        ? extendAttrs
            .replace(/[{}]/g, '')
            .replace(/([^=\s]+)=([^\s]+)/g, (match, key, value) => `${key}="${$e(value)}"`)
        : '';
      return `${leadingChar}<img ${srcProp}="${UrlCache.set(
        encodeURIOnce(this.$engine.urlProcessor(srcValue, 'image')),
      )}" ${style} ${classes} alt="${$e(alt || '')}"${attrs} ${extendAttrStr}/>`;
    }
    // should never happen
    return match;
  }

  toMediaHtml(match, leadingChar, mediaType, alt, link, title, ref, posterWrap, poster, ...args) {
    if (!/(video|audio)/.test(mediaType)) {
      return match;
    }
    return this.replaceToHtml(mediaType, match, leadingChar, alt, link, title, poster);
  }

  makeHtml(str) {
    let $str = str;
    if (this.test($str)) {
      if (isLookbehindSupported()) {
        $str = $str.replace(this.RULE.reg, this.toHtml.bind(this));
      } else {
        $str = replaceLookbehind($str, this.RULE.reg, this.toHtml.bind(this), true, 1);
      }
    }
    if (this.testMedia($str)) {
      if (isLookbehindSupported()) {
        $str = $str.replace(this.RULE.regExtend, this.toMediaHtml.bind(this));
      } else {
        $str = replaceLookbehind($str, this.RULE.regExtend, this.toMediaHtml.bind(this), true, 1);
      }
    }
    return $str;
  }

  // afterMakeHtml(str) {
  //   return UrlCache.restoreAll(str);
  // }

  testMedia(str) {
    return this.RULE.regExtend && this.RULE.regExtend.test(str);
  }

  rule(extendMedia) {
    const ret = {
      // lookbehind启用分组是为了和不兼容lookbehind的场景共用一个回调
      begin: isLookbehindSupported() ? '((?<!\\\\))!' : '(^|[^\\\\])!',
      content: [
        // ?<alt> 单行时保持原规则；跨行（软换行）时与链接文字相同：最多 3 行、不跨空行、alt 内不能再有 [ ]
        '\\[([^\\n]*?|[^\\[\\]\\n]*(?:\\n(?![ \\t]*\\n)[^\\[\\]\\n]*){1,2})\\]',
        '[ \\t]*', // any spaces
        `${
          '(?:' +
          '\\(' +
          '((?:[^\\s()]*\\([^\\s()]*\\)[^\\s()]*)+|(?:[^"][^\\s]+?))' + // ?<link> url
          '(?:[ \\t]((?:".*?")|(?:\'.*?\')))?' + // ?<title> optional
          '\\)' +
          '|' + // or
          '\\[('
        }${NOT_ALL_WHITE_SPACES_INLINE})\\]` + // ?<ref> global ref
          ')',
      ].join(''),
      end: '({[^{}]+?})?', // extend attrs e.g. {width=50 height=60}
    };
    if (extendMedia) {
      const extend = { ...ret };
      // TODO: 支持Lookbehind
      extend.begin = isLookbehindSupported()
        ? `((?<!\\\\))!(${extendMedia.tag.join('|')})`
        : `(^|[^\\\\])!(${extendMedia.tag.join('|')})`;
      extend.end = '({poster=(.*)})?';
      ret.regExtend = compileRegExp(extend, 'g');
    }
    ret.reg = compileRegExp(ret, 'g');
    return ret;
  }
}
