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
    // console.log('update deco');
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
        result.extendStyles += 'transform:translateX(-100%);margin-left:100%;margin-right:-100%;display:block;';
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
        result.extendClasses += ' cherry-img0align-float-right';
        return;
      default:
        return;
    }
  },
};
export default imgAltHelper;
