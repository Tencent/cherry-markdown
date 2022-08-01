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

const imgAltHelper = {
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
      extendAttrs = ` width="${width.replace(/[ #]*/g, '')}"`;
    }
    if (height) {
      extendAttrs += ` height="${height.replace(/[ #]*/g, '')}"`;
    }
    return extendAttrs;
  },

  /**
   * 提取alt部分的扩展样式
   * @param {string} alt 图片引用中的alt部分
   * @returns {{extendStyles:string, extendClasses:string}}
   */
  processExtendStyleInAlt(alt) {
    let extendStyles = this.$getAlignment(alt);
    let extendClasses = '';
    const info = alt.match(/#(border|shadow|radius|B|S|R)/g);
    if (info) {
      for (let i = 0; i < info.length; i++) {
        switch (info[i]) {
          case '#border':
          case '#B':
            extendStyles += 'border:1px solid #888888;padding: 2px;box-sizing: border-box;';
            extendClasses += ' cherry-img-border';
            break;
          case '#shadow':
          case '#S':
            extendStyles += 'box-shadow:0 2px 15px -5px rgb(0 0 0 / 50%);';
            extendClasses += ' cherry-img-shadow';
            break;
          case '#radius':
          case '#R':
            extendStyles += 'border-radius: 15px;';
            extendClasses += ' cherry-img-radius';
            break;
        }
      }
    }
    return { extendStyles, extendClasses };
  },

  /**
   * 从alt中提取对齐方式信息
   * @param {string} alt
   * @returns {string}
   */
  $getAlignment(alt) {
    const styleRegex = /#(center|right|left|float-right|float-left)/i;
    const info = alt.match(styleRegex);
    if (!info) {
      return '';
    }
    const [, alignment] = info;
    switch (alignment) {
      case 'center':
        return 'transform:translateX(-50%);margin-left:50%;display:block;';
      case 'right':
        return 'transform:translateX(-100%);margin-left:100%;margin-right:-100%;display:block;';
      case 'left':
        return 'transform:translateX(0);margin-left:0;display:block;';
      case 'float-right':
        return 'float:right;transform:translateX(0);margin-left:0;display:block;';
      case 'float-left':
        return 'float:left;transform:translateX(0);margin-left:0;display:block;';
    }
  },
};
export default imgAltHelper;
