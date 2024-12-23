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

import diff from 'fast-diff';
/**
 * 更新内容时保持光标不变
 * @param {Number} pos 光标相对文档开头的偏移量
 * @param {String} oldContent 变更前的内容
 * @param {String} newContent 变更后的内容
 * @returns {Number} newPos 新的光标偏移量
 */
export default function getPosBydiffs(pos, oldContent, newContent) {
  const diffs = diff(oldContent, newContent);
  let newPos = pos;
  let tmpPos = pos;
  for (let i = 0; i < diffs.length; i++) {
    const val = diffs[i];
    if (tmpPos <= 0) {
      return newPos;
    }
    const opType = val[0];
    const opLength = val[1].length;
    switch (opType) {
      // 没有改变的内容
      case diff.EQUAL:
        if (tmpPos <= opLength) {
          return newPos;
        }
        tmpPos -= opLength;
        break;
      // 删除的内容
      case diff.DELETE:
        if (tmpPos <= opLength) {
          return newPos - opLength + tmpPos;
        }
        tmpPos -= opLength;
        newPos -= opLength;
        break;
      // 新增的内容
      case diff.INSERT:
        newPos += opLength;
        break;
    }
  }
  return newPos;
}
