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
 *
 * @param {string} str
 * @param {{replacedText:string;begin:number;length:number;}[]} buffer
 */
function replaceStringByBuffer(str, buffer) {
  if (!buffer.length) {
    return str;
  }
  const slicedString = [];
  let offset = 0;
  buffer.forEach((buf, index) => {
    slicedString.push(str.slice(offset, buf.begin));
    slicedString.push(buf.replacedText);
    offset = buf.begin + buf.length;
    if (index === buffer.length - 1) {
      slicedString.push(str.slice(offset));
    }
  });
  // console.log(slicedString, slicedString.join(''));
  return slicedString.join('');
}

/**
 * @param {string} str 原始字符串
 * @param {RegExp} regex 正则
 * @param {(...args: any[])=>string} replacer 字符串替换函数
 * @param {boolean} [continuousMatch=false] 是否连续匹配，主要用于需要后向断言的连续语法匹配
 * @param {number} [rollbackLength=1] 连续匹配时，每次指针回退的长度，默认为 1
 */
export function replaceLookbehind(str, regex, replacer, continuousMatch = false, rollbackLength = 1) {
  if (!regex) {
    return str;
  }
  // 从头开始匹配
  regex.lastIndex = 0;
  let args;
  let lastIndex = 0;
  const replaceBuffer = [];
  while ((args = regex.exec(str)) !== null) {
    const replaceInfo = {
      begin: args.index,
      length: args[0].length,
    };
    if (continuousMatch && args.index === lastIndex - rollbackLength) {
      const [match, , ...restArgs] = args;
      // 丢弃 leadingChar，需要调整begin和length
      replaceBuffer.push({
        begin: replaceInfo.begin + rollbackLength,
        length: replaceInfo.length - rollbackLength,
        replacedText: replacer(match.slice(rollbackLength), '', ...restArgs),
      });
    } else {
      replaceBuffer.push({
        ...replaceInfo,
        replacedText: replacer(...args),
      });
    }
    // console.log(args);
    lastIndex = regex.lastIndex;
    regex.lastIndex -= rollbackLength;
  }
  // 正则复位，避免影响其他逻辑
  regex.lastIndex = 0;
  return replaceStringByBuffer(str, replaceBuffer);
}
