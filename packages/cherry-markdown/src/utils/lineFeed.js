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
 * 为段落前加换行符
 * @param {string} match    匹配全文
 * @param {string} processedContent 加入的内容
 */
export function prependLineFeedForParagraph(match, processedContent, canNestedInList = false) {
  if (!/^\n/.test(match)) {
    return processedContent;
  }
  if (canNestedInList) {
    const leadingLinesCount = match.match(/^\n+/g)?.[0]?.length ?? 0;
    // 前置换行符数量大于2时，补充两个换行符，否则只补充一个
    if (leadingLinesCount > 1) {
      return `\n\n${processedContent}`;
    }
    return `\n${processedContent}`;
  }
  return `\n\n${processedContent}`;
}

/**
 * 计算段落所占行数，必须传入通过 prependLineFeedForParagraph 方法处理后的内容，才能计算准确
 * @param {string} preLinesMatch 前置匹配行
 * @param {number} contentLines 实际内容行数
 */
export function calculateLinesOfParagraph(preLinesMatch, contentLines) {
  let preLineCount = (preLinesMatch.match(/\n/g) || []).length;
  // 前置行匹配文本为空，说明是全文开头
  // 非全文开头前面必有两个从 prependLineFeed 方法新增加的换行符
  if (preLinesMatch !== '') {
    preLineCount -= 2;
  }
  return preLineCount + contentLines;
}
