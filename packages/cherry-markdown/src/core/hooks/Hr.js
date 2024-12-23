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
import ParagraphBase from '@/core/ParagraphBase';
import { prependLineFeedForParagraph } from '@/utils/lineFeed';
/**
 * 分割线语法
 */
export default class Hr extends ParagraphBase {
  static HOOK_NAME = 'hr';

  constructor() {
    super({ needCache: true });
  }

  beforeMakeHtml(str) {
    return str.replace(this.RULE.reg, (match, preLines) => {
      const lineCount = (preLines.match(/\n/g) || []).length + 1;
      // 计算签名，签名可能会重复，符合预期
      const sign = `hr${lineCount}`;
      const placeHolder = this.pushCache(`<hr data-sign="${sign}" data-lines="${lineCount}" />`, sign);
      return prependLineFeedForParagraph(match, placeHolder);
    });
  }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  rule() {
    // 分割线必须有从新行开始，比如以换行结束
    const ret = {
      begin: '(?:^|\\n)(\\n*)[ ]*',
      end: '(?=$|\\n)',
      content: '((?:-[ \\t]*){3,}|(?:\\*[ \\t]*){3,}|(?:_[ \\t]*){3,})',
    };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
