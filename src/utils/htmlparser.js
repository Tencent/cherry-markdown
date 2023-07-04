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
// @ts-nocheck
/**
 * 将html内容转换成md内容的工具
 * 调用方式为：htmlParser.run(htmlStr)
 * 主要流程为：
 *    1、接收html字符串
 *    2、根据html字符串生成html语法树
 *    3、递归遍历语法树，将标签替换为对应的markdown语法
 **/
const htmlParser = {
  /**
   * 入口函数，负责将传入的html字符串转成对应的markdown源码
   * @param {string} htmlStr
   * @returns {string} 对应的markdown源码
   */
  run(htmlStr) {
    let $htmlStr = `<div>${htmlStr}</div>`;
    // 挂载对应的格式化引擎，这里挂载的是markdown逆向引擎，后续可以扩展支持其他标记语言
    this.tagParser.formatEngine = this.mdFormatEngine;
    // 去掉注释
    $htmlStr = $htmlStr.replace(/<!--[\s\S]*?-->/g, '');
    // 将html字符串解析成html语法树
    let htmlparsedArrays = this.htmlParser.parseHtml($htmlStr);
    // 预处理，去掉一些不需要的样式、属性
    htmlparsedArrays = this.paragraphStyleClear(htmlparsedArrays);
    // 核心逻辑，遍历html语法树，生成对应的markdown源码
    return this.$dealHtml(htmlparsedArrays)
      .replace(/\n{3,}/g, '\n\n\n')
      .replace(/&gt;/g, '>')
      .replace(/&lt;/g, '<')
      .replace(/&amp;/g, '&')
      .trim('\n');
  },
  /**
   * 解析html语法树
   * @param {Array} arr
   * @returns {string} 对应的markdown源码
   */
  $dealHtml(arr) {
    let ret = '';
    for (let i = 0; i < arr.length; i++) {
      const temObj = arr[i];
      if (temObj.type === 'tag') ret = this.$handleTagObject(temObj, ret);
      else if (temObj.type === 'text' && temObj.content.length > 0) {
        ret += temObj.content
          .replace(/&nbsp;/g, ' ')
          .replace(/[\n]+/g, '\n')
          .replace(/^[ \t\n]+\n\s*$/, '\n');
      }
    }
    return ret;
  },
  /**
   * 处理html标签内容
   * @param {object} temObj
   * @param {string} returnString
   */
  $handleTagObject(temObj, returnString) {
    let ret = returnString;
    if (temObj.attrs.class && /(ch-icon-square|ch-icon-check)/.test(temObj.attrs.class)) {
      // 针对checklist
      if (temObj.attrs.class.indexOf('ch-icon-check') >= 0) {
        ret += '[x]';
      } else {
        ret += '[ ]';
      }
    } else if (temObj.attrs.class && /cherry-code-preview-lang-select/.test(temObj.attrs.class)) {
      // 如果是代码块的选择语言标签，则不做任何处理
      ret += '';
    } else {
      // 如果是标签
      ret += this.$dealTag(temObj);
    }
    return ret;
  },
  /**
   * 解析具体的html标签
   * @param {HTMLElement} obj
   * @returns {string} 对应的markdown源码
   */
  $dealTag(obj) {
    const self = this;
    let tmpText = '';
    if (obj.children) {
      // 递归每一个子元素
      tmpText = self.$dealHtml(obj.children);
    }
    if (obj.name === 'style') {
      // 不解析样式属性，只处理行内样式
      return '';
    }
    if (obj.name === 'code' || obj.name === 'pre') {
      // 解析代码块 或 行内代码
      // pre时，强制转成代码块
      return self.tagParser.codeParser(obj, self.$dealCodeTag(obj), obj.name === 'pre');
    }
    if (typeof self.tagParser[`${obj.name}Parser`] === 'function') {
      // 解析对应的具体标签
      return self.tagParser[`${obj.name}Parser`](obj, tmpText);
    }
    return tmpText;
  },
  /**
   * 解析代码块
   * 本函数认为代码块是由text标签和li标签组成的
   * @param {HTMLElement} obj
   * @returns {string} 对应的markdown源码
   */
  $dealCodeTag(obj) {
    const self = this;
    if (obj.children.length < 0) {
      return '';
    }
    let ret = '';
    for (let i = 0; i < obj.children.length; i++) {
      const temObj = obj.children[i];
      if (temObj.type !== 'text') {
        // 如果是非text标签，则需要处理换行逻辑
        if (temObj.name === 'li') {
          ret += '\n';
        }
        if (temObj.name === 'br') {
          ret += '\n';
        }
        // 递归找到对应的代码文本
        ret += self.$dealCodeTag(temObj);
      } else {
        ret += temObj.content;
      }
    }
    return ret;
  },

  /** **
   * html解析器
   * 将html解析成对象数组
   * https://github.com/HenrikJoreteg/html-parse-stringify
   **/
  htmlParser: {
    attrRE: /([\w-]+)|['"]{1}([^'"]*)['"]{1}/g,
    lookup: {
      area: true,
      base: true,
      br: true,
      col: true,
      embed: true,
      hr: true,
      img: true,
      video: true,
      input: true,
      keygen: true,
      link: true,
      menuitem: true,
      meta: true,
      param: true,
      source: true,
      track: true,
      wbr: true,
    },
    tagRE: /<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g,
    empty: Object.create ? Object.create(null) : {},
    parseTags(tag) {
      const self = this;
      let i = 0;
      let key;
      const res = {
        type: 'tag',
        name: '',
        voidElement: false,
        attrs: {},
        children: [],
      };

      tag.replace(this.attrRE, (match) => {
        if (i % 2) {
          key = match;
        } else {
          if (i === 0) {
            if (self.lookup[match] || tag.charAt(tag.length - 2) === '/') {
              res.voidElement = true;
            }
            res.name = match;
          } else {
            res.attrs[key] = match.replace(/['"]/g, '');
          }
        }
        i += 1;
      });

      return res;
    },
    parseHtml(html, options) {
      const self = this;
      const $options = options || {};
      $options.components || ($options.components = this.empty);
      const result = [];
      let current;
      let level = -1;
      const arr = [];
      const byTag = {};
      let inComponent = false;

      html.replace(this.tagRE, (tag, index) => {
        if (inComponent) {
          if (tag !== `</${current.name}>`) {
            return;
          }
          inComponent = false;
        }
        const isOpen = tag.charAt(1) !== '/';
        const start = index + tag.length;
        const nextChar = html.charAt(start);
        let parent;

        if (isOpen) {
          level += 1;

          current = self.parseTags(tag);
          if (current.type === 'tag' && $options.components[current.name]) {
            current.type = 'component';
            inComponent = true;
          }

          if (!current.voidElement && !inComponent && nextChar && nextChar !== '<') {
            current.children.push({
              type: 'text',
              content: html.slice(start, html.indexOf('<', start)),
            });
          }

          byTag[current.tagName] = current;

          // if we're at root, push new base node
          if (level === 0) {
            result.push(current);
          }

          parent = arr[level - 1];

          if (parent) {
            parent.children.push(current);
          }

          arr[level] = current;
        }

        if (!isOpen || current.voidElement) {
          level -= 1;
          if (!inComponent && nextChar !== '<' && nextChar) {
            // trailing text node
            if (arr[level]) {
              arr[level].children.push({
                type: 'text',
                content: html.slice(start, html.indexOf('<', start)),
              });
            }
          }
        }
      });
      return result;
    },
  },

  /** **
   * 标签解析器
   * 解析对应的标签，并调用格式化引擎生成对应格式内容
   **/
  tagParser: {
    // 挂载的解析引擎，一次只能挂在一个解析引擎，目前只实现和挂载了markdown解析引擎
    formatEngine: {},
    /**
     * 解析p标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    pParser(obj, str) {
      const $str = str;
      if (/\n$/.test($str)) {
        return $str;
      }
      return `${$str}\n`;
    },
    /**
     * 解析div标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    divParser(obj, str) {
      const $str = str;
      if (/\n$/.test($str)) {
        return $str;
      }
      return `${$str}\n`;
    },
    /**
     * 解析span标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    spanParser(obj, str) {
      const $str = str.replace(/\t/g, '').replace(/\n/g, ' '); // span标签里不应该有\n的，有的话就转化成空格
      if (obj.attrs && obj.attrs.style) {
        // 先屏蔽字体颜色、字体大小、字体背景色的转义逻辑
        // let color = this.styleParser.colorAttrParser(obj.attrs.style);
        // let size = this.styleParser.sizeAttrParser(obj.attrs.style);
        // bgcolor = this.styleParser.bgColorAttrParser(obj.attrs.style);
        // str  = this.formatEngine.convertColor(str, color);
        // str  = this.formatEngine.convertSize(str, size);
        // str  = this.formatEngine.convertBgColor(str, bgcolor);
        // return str;
      }
      return $str;
    },
    /**
     * 解析code标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @param {boolean} isBlock 是否强制为代码块
     * @returns {string} str
     */
    codeParser(obj, str, isBlock = false) {
      return this.formatEngine.convertCode(str, isBlock);
    },
    /**
     * 解析br标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    brParser(obj, str) {
      return this.formatEngine.convertBr(str, '\n');
    },
    /**
     * 解析img标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    imgParser(obj, str) {
      if (obj.attrs && obj.attrs['data-control'] === 'tapd-graph') {
        return this.formatEngine.convertGraph(obj.attrs.title, obj.attrs.src, obj.attrs['data-origin-xml'], obj);
      }
      if (obj.attrs && obj.attrs.src) {
        return this.formatEngine.convertImg(obj.attrs.alt, obj.attrs.src);
      }
    },
    /**
     * 解析video标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    videoParser(obj, str) {
      if (obj.attrs && obj.attrs.src) {
        return this.formatEngine.convertVideo(str, obj.attrs.src, obj.attrs.poster, obj.attrs.title);
      }
    },
    /**
     * 解析b标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    bParser(obj, str) {
      const strArr = str.split('\n');
      const ret = [];
      for (let i = 0; i < strArr.length; i++) {
        ret.push(this.formatEngine.convertB(strArr[i]));
      }
      return ret.join('\n');
    },
    /**
     * 解析i标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    iParser(obj, str) {
      const strArr = str.split('\n');
      const ret = [];
      for (let i = 0; i < strArr.length; i++) {
        ret.push(this.formatEngine.convertI(strArr[i]));
      }
      return ret.join('\n');
    },
    /**
     * 解析strike标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    strikeParser(obj, str) {
      const strArr = str.split('\n');
      const ret = [];
      for (let i = 0; i < strArr.length; i++) {
        ret.push(this.formatEngine.convertStrike(strArr[i]));
      }
      return ret.join('\n');
    },
    /**
     * 解析del标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    delParser(obj, str) {
      const strArr = str.split('\n');
      const ret = [];
      for (let i = 0; i < strArr.length; i++) {
        ret.push(this.formatEngine.convertDel(strArr[i]));
      }
      return ret.join('\n');
    },
    /**
     * 解析u标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    uParser(obj, str) {
      const strArr = str.split('\n');
      const ret = [];
      for (let i = 0; i < strArr.length; i++) {
        ret.push(this.formatEngine.convertU(strArr[i]));
      }
      return ret.join('\n');
    },
    /**
     * 解析a标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    aParser(obj, str) {
      if (obj.attrs && obj.attrs.href) {
        return this.formatEngine.convertA(str, obj.attrs.href);
      }
      return '';
    },
    /**
     * 解析sup标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    supParser(obj, str) {
      return this.formatEngine.convertSup(str);
    },
    /**
     * 解析sub标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    subParser(obj, str) {
      return this.formatEngine.convertSub(str);
    },
    /**
     * 解析td标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    tdParser(obj, str) {
      return this.formatEngine.convertTd(str);
    },
    /**
     * 解析tr标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    trParser(obj, str) {
      return this.formatEngine.convertTr(str);
    },
    /**
     * 解析th标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    thParser(obj, str) {
      return this.formatEngine.convertTh(str);
    },
    /**
     * 解析thead标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    theadParser(obj, str) {
      return this.formatEngine.convertThead(str);
    },
    /**
     * 解析table标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    tableParser(obj, str) {
      return this.formatEngine.convertTable(str);
    },
    /**
     * 解析li标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    liParser(obj, str) {
      return this.formatEngine.convertLi(str);
    },
    /**
     * 解析ul标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    ulParser(obj, str) {
      return this.formatEngine.convertUl(str);
    },
    /**
     * 解析ol标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    olParser(obj, str) {
      return this.formatEngine.convertOl(str);
    },
    /**
     * 解析strong标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    strongParser(obj, str) {
      return this.formatEngine.convertStrong(str);
    },
    /**
     * 解析hr标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    hrParser(obj, str) {
      return this.formatEngine.convertHr(str);
    },
    /**
     * 解析h1标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    h1Parser(obj, str) {
      return this.formatEngine.convertH1(str);
    },
    /**
     * 解析h2标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    h2Parser(obj, str) {
      return this.formatEngine.convertH2(str);
    },
    /**
     * 解析h3标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    h3Parser(obj, str) {
      return this.formatEngine.convertH3(str);
    },
    /**
     * 解析h4标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    h4Parser(obj, str) {
      return this.formatEngine.convertH4(str);
    },
    /**
     * 解析h5标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    h5Parser(obj, str) {
      return this.formatEngine.convertH5(str);
    },
    /**
     * 解析h6标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    h6Parser(obj, str) {
      return this.formatEngine.convertH6(str);
    },
    /**
     * 解析blockquote标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    blockquoteParser(obj, str) {
      return this.formatEngine.convertBlockquote(str.replace(/\n+/g, '\n'));
    },
    /**
     * 解析address标签
     * @param {HTMLElement} obj
     * @param {string} str 需要回填的字符串
     * @returns {string} str
     */
    addressParser(obj, str) {
      return this.formatEngine.convertAddress(str.replace(/\n+/g, '\n'));
    },
    // 样式解析器
    styleParser: {
      // 识别字体颜色 color
      colorAttrParser(style) {
        const color = style.match(/color:\s*(#[a-zA-Z0-9]{3,6});/);
        if (color && color[1]) {
          return color[1];
        }
        return '';
      },
      // 识别字体大小 font-size
      sizeAttrParser(style) {
        const fontSize = style.match(/font-size:\s*([a-zA-Z0-9-]+?);/);
        if (fontSize && fontSize[1]) {
          let size = 0;
          if (/[0-9]+px/.test(fontSize[1])) {
            size = fontSize[1].replace(/px/, '').trim();
          } else {
            switch (fontSize[1]) {
              case 'x-small':
                size = 10;
                break;
              case 'small':
                size = 12;
                break;
              case 'medium':
                size = 16;
                break;
              case 'large':
                size = 18;
                break;
              case 'x-large':
                size = 24;
                break;
              case 'xx-large':
                size = 32;
                break;
              default:
                size = '';
            }
          }
          return size > 0 ? size : '';
        }
        return '';
      },
      // 识别字体背景颜色 background-color
      bgColorAttrParser(style) {
        const color = style.match(/background-color:\s*([^;]+?);/);
        if (color && color[1]) {
          let bgColor = '';
          if (/rgb\([ 0-9]+,[ 0-9]+,[ 0-9]+\)/.test(color[1])) {
            const values = color[1].match(/rgb\(([ 0-9]+),([ 0-9]+),([ 0-9]+)\)/);
            if (values[1] && values[2] && values[3]) {
              values[1] = parseInt(values[1].trim(), 10);
              values[2] = parseInt(values[2].trim(), 10);
              values[3] = parseInt(values[3].trim(), 10);
              bgColor = `#${values[1].toString(16)}${values[2].toString(16)}${values[3].toString(16)}`;
            }
          } else {
            [, bgColor] = color;
          }
          return bgColor;
        }
        return '';
      },
    },
  },

  /**
   * 一个格式化引擎
   * 将字符串格式化成markdown语法的引擎
   **/
  mdFormatEngine: {
    convertColor(str, attr) {
      const $str = str.trim();
      if (!$str || /\n/.test($str)) {
        return $str;
      }
      return attr ? `!!${attr} ${$str}!!` : $str;
    },
    convertSize(str, attr) {
      const $str = str.trim();
      if (!$str || /\n/.test($str)) {
        return $str;
      }
      return attr ? `!${attr} ${$str}!` : $str;
    },
    convertBgColor(str, attr) {
      const $str = str.trim();
      if (!$str || /\n/.test($str)) {
        return $str;
      }
      return attr ? `!!!${attr} ${$str}!!!` : $str;
    },
    convertBr(str, attr) {
      return str + attr;
    },
    convertCode(str, isBlock = false) {
      if (/\n/.test(str) || isBlock) {
        return `\`\`\`\n${str.replace(/\n+$/, '')}\n\`\`\``;
      }
      return `\`${str.replace(/`/g, '\\`')}\``;
    },
    convertB(str) {
      return /^\s*$/.test(str) ? '' : `**${str}**`;
    },
    convertI(str) {
      return /^\s*$/.test(str) ? '' : `*${str}*`;
    },
    convertU(str) {
      return /^\s*$/.test(str) ? '' : ` /${str}/ `;
    },
    convertImg(alt, src) {
      const $alt = alt && alt.length > 0 ? alt : 'image';
      return `![${$alt}](${src})`;
    },
    convertGraph(str, attr, data, obj) {
      const $str = str && str.length > 0 ? str : 'graph';
      let moreAttrs = '';
      if (obj) {
        try {
          const { attrs } = obj;
          Object.keys(attrs).forEach((prop) => {
            if (Object.prototype.hasOwnProperty.call(attrs, prop)) {
              if (prop.indexOf('data-graph-') >= 0 && attrs[prop]) {
                moreAttrs += ` ${prop}=${attrs[prop]}`;
              }
            }
          });
        } catch (error) {
          // console.log('error', error)
        }
      }
      return `![${$str}](${attr}){data-control=tapd-graph data-origin-xml=${data}${moreAttrs}}`;
    },
    convertVideo(str, src, poster, title) {
      const $title = title && title.length > 0 ? title : 'video';
      return `!video[${$title}](${src}){poster=${poster}}`;
    },
    convertA(str, attr) {
      if (str === attr) {
        return `${str} `;
      }
      const $str = str.trim();
      if (!$str) {
        return $str;
      }
      return `[${$str}](${attr})`;
    },
    convertSup(str) {
      return `^${str.trim().replace(/\^/g, '\\^')}^`;
    },
    convertSub(str) {
      return `^^${str.trim().replace(/\^\^/g, '\\^\\^')}^^`;
    },
    convertTd(str) {
      return `~|${str.trim().replace(/\n{1,}/g, '<br>')} ~|`;
    },
    convertTh(str) {
      return `~|${str.trim().replace(/\n{1,}/g, '<br>')} ~|`;
    },
    convertTr(str) {
      return `${str.replace(/\n/g, '')}\n`;
    },
    convertThead(str) {
      return `${str.replace(/~\|~\|/g, '~|').replace(/~\|/g, '|')}|:--|\n`;
    },
    convertTable(str) {
      const ret = `\n${str.replace(/~\|~\|/g, '~|').replace(/~\|/g, '|')}\n`.replace(/\n{2,}/g, '\n');
      if (/\|:--\|/.test(ret)) {
        return ret;
      }
      return `\n| |\n|:--|${ret}`;
    },
    convertLi(str) {
      return `- ${str.replace(/^\n/, '').replace(/\n+$/, '').replace(/\n+/g, '\n\t')}\n`;
    },
    convertUl(str) {
      return `${str}\n`;
    },
    convertOl(str) {
      const arr = str.split('\n');
      let index = 1;
      for (let i = 0; i < arr.length; i++) {
        if (/^- /.test(arr[i])) {
          arr[i] = arr[i].replace(/^- /, `${index}. `);
          index += 1;
        }
      }
      const $str = arr.join('\n');
      return `${$str}\n`;
    },
    convertStrong(str) {
      return /^\s*$/.test(str) ? '' : `**${str}**`;
    },
    convertStrike(str) {
      return /^\s*$/.test(str) ? '' : `~~${str}~~`;
    },
    convertDel(str) {
      return /^\s*$/.test(str) ? '' : `~~${str}~~`;
    },
    convertHr(str) {
      return /^\s*$/.test(str) ? '\n\n----\n' : `\n\n----\n${str}`;
    },
    convertH1(str) {
      return `# ${str.trim().replace(/\n+$/, '')}\n\n`;
    },
    convertH2(str) {
      return `## ${str.trim().replace(/\n+$/, '')}\n\n`;
    },
    convertH3(str) {
      return `### ${str.trim().replace(/\n+$/, '')}\n\n`;
    },
    convertH4(str) {
      return `#### ${str.trim().replace(/\n+$/, '')}\n\n`;
    },
    convertH5(str) {
      return `##### ${str.trim().replace(/\n+$/, '')}\n\n`;
    },
    convertH6(str) {
      return `###### ${str.trim().replace(/\n+$/, '')}\n\n`;
    },
    convertBlockquote(str) {
      return `>${str.trim()}\n\n`;
    },
    convertAddress(str) {
      return `>${str.trim()}\n\n`;
    },
  },
  /**
   * 清除整段的样式、方便编辑
   * 暂时先屏蔽字体色和背景色
   * @param {Array} htmlparsedArrays 由HTMLElement组成的数组
   */
  paragraphStyleClear(htmlparsedArrays) {
    for (let index = 0; index < htmlparsedArrays[0].children.length; index++) {
      const htmlItem = htmlparsedArrays[0].children[index];
      const stack = [htmlItem];
      let paragraphs = [];
      while (stack.length) {
        const temp = stack.shift();
        const childCount = this.notEmptyTagCount(temp);
        if (childCount === 1) {
          paragraphs.push(temp);
        } else if (childCount > 1) {
          for (let k = 0; k < temp.children.length; k++) {
            stack.push(temp.children[k]);
          }
        } else {
          if (paragraphs.length === 1) {
            this.clearChildColorAttrs(paragraphs.pop());
          }
          paragraphs = [];
        }
      }
      if (paragraphs.length === 1) {
        this.clearChildColorAttrs(paragraphs.pop());
      }
    }

    return htmlparsedArrays;
  },
  /**
   * 非空子元素数量
   */
  notEmptyTagCount(htmlItem) {
    if (
      !htmlItem ||
      htmlItem.voidElement ||
      (htmlItem.type === 'tag' && !htmlItem.children.length) ||
      (htmlItem.type === 'text' && !htmlItem.content.replace(/(\r|\n|\s)+/g, ''))
    ) {
      return 0;
    }

    if (htmlItem.children && htmlItem.children.length) {
      let res = 0;
      for (let index = 0; index < htmlItem.children.length; index++) {
        res += this.notEmptyTagCount(htmlItem.children[index]);
      }
      return res;
    }
    return 1;
  },
  clearChildColorAttrs(htmlItems) {
    const self = this;
    this.forEachHtmlParsedItems(htmlItems, (htmlItem) => {
      self.clearSelfNodeColorAttrs(htmlItem);
    });
  },
  clearSelfNodeColorAttrs(htmlItem) {
    if (htmlItem.attrs && htmlItem.attrs.style) {
      const styles = htmlItem.attrs.style.split(';');
      const newStyles = [];
      for (let index = 0; index < styles.length; index++) {
        if (styles[index] && styles[index].indexOf('color') === -1) {
          newStyles.push(styles[index]);
        }
      }
      if (newStyles.length) {
        htmlItem.attrs.style = `${newStyles.join(';')};`;
      } else {
        delete htmlItem.attrs.style;
      }
    }
  },
  forEachHtmlParsedItems(htmlItems, cb) {
    if (htmlItems) {
      cb(htmlItems);
      if (htmlItems.children && htmlItems.children.length) {
        for (let index = 0; index < htmlItems.children.length; index++) {
          this.forEachHtmlParsedItems(htmlItems.children[index], cb);
        }
      }
    }
  },
};

export default htmlParser;
