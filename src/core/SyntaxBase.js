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

/**
 * @typedef {import('~types/syntax').HookType} HookType
 * @typedef {import('~types/syntax').HookTypesList} HookTypesList
 * @typedef {import('~types/syntax').EditorConfig} EditorConfig
 * @typedef {import('~types/syntax').HookRegexpRule} HookRegexpRule
 */

/** @type {boolean} */
let isMathjaxConfig = false;

/**
 * @type {HookTypesList}
 */
export const HOOKS_TYPE_LIST = {
  SEN: 'sentence',
  PAR: 'paragraph',
  DEFAULT: 'sentence',
};

export default class SyntaxBase {
  /**
   * @static
   * @type {string}
   */
  static HOOK_NAME = 'default';
  /**
   * @static
   * @type {HookType}
   */
  static HOOK_TYPE = HOOKS_TYPE_LIST.DEFAULT;
  /**
   * @protected
   * @type {import('../Engine').default}
   */
  $engine;
  $locale;

  /**
   * @constructor
   * @param {Partial<EditorConfig>} editorConfig
   */
  constructor(editorConfig) {
    // editorConfig.pageHooks: 已实例化的页面级hook
    // editorConfig.syntaxOptions: 当前Hook的用户配置
    // editorConfig.externals: 第三方库
    this.RULE = this.rule(editorConfig);
  }

  getType() {
    return /** @type {typeof SyntaxBase} */ (this.constructor).HOOK_TYPE || HOOKS_TYPE_LIST.DEFAULT;
  }

  getName() {
    return /** @type {typeof SyntaxBase} */ (this.constructor).HOOK_NAME;
  }

  afterInit(callback) {
    if (typeof callback === 'function') {
      callback();
    }
  }

  setLocale(locale) {
    this.$locale = locale;
  }

  /**
   * 生命周期函数
   * @param {string} str 待处理的markdown文本
   * @returns {string} 处理后的文本，一般为html
   */
  beforeMakeHtml(str) {
    return str;
  }

  /**
   * 生命周期函数
   * @param {string} str 待处理的markdown文本
   * @returns {string} 处理后的文本，一般为html
   */
  makeHtml(str) {
    return str;
  }

  /**
   * 生命周期函数
   * @param {string} str 待处理的markdown文本
   * @returns {string} 处理后的文本，一般为html
   */
  afterMakeHtml(str) {
    return str;
  }

  // getMakeHtml() {
  //     return this.makeHtml || false;
  // }

  /**
   *
   * @param {KeyboardEvent} e 触发事件
   * @param {*} str
   */
  onKeyDown(e, str) {}

  getOnKeyDown() {
    return this.onKeyDown || false;
  }

  getAttributesTest() {
    return /^(color|fontSize|font-size|id|title|class|target|underline|line-through|overline|sub|super)$/;
  }

  /**
   *
   * @param {string} attr
   * @param {() => {}} func 回调函数
   */
  $testAttributes(attr, func) {
    if (this.getAttributesTest().test(attr)) {
      func();
    }
  }

  /**
   * 提取属性
   * @param {string} str 待提取字符串
   * @returns {{attrs: Record<string,any>; str: string}}
   */
  getAttributes(str) {
    const ret = { attrs: {}, str };
    // if(/(?<=[^\\]){([a-zA-Z-]+=[0-9a-z-]+(?=;|\||}))+}$/.test(str)) {
    //     str.match(/(?<=[^\\]){[^\n]+?}$/)[0]
    //         .match(/([a-zA-Z-]+=[0-9a-z-]+(?=;|\||}))+/g)
    //         .foreach((one) => {
    //             one = one.split('=');
    //             this._testAttributes(one[0], ()=>{
    //                 ret.attrs[one[0]] = one[1];
    //             });
    //         });
    //     ret.str = str.replace(/(?<=[^\\]){[^\n]+?}$/, '');
    // }
    return ret;
  }

  static getMathJaxConfig() {
    return isMathjaxConfig;
  }

  /**
   *
   * @param {boolean} version 指定mathJax是否使用MathJax
   */
  static setMathJaxConfig(version) {
    isMathjaxConfig = version;
  }

  /**
   * 测试输入的字符串是否匹配当前Hook规则
   * @param {string} str 待匹配文本
   * @returns {boolean}
   */
  test(str) {
    return this.RULE.reg ? this.RULE.reg.test(str) : false;
  }

  /**
   *
   * @param {Partial<EditorConfig>} editorConfig
   * @returns {HookRegexpRule}
   */
  rule(editorConfig) {
    return { begin: '', end: '', content: '', reg: new RegExp('') };
  }

  mounted() {
    // console.log('base mounted');
  }
}
