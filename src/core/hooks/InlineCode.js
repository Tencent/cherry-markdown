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
import CodeBlock from './CodeBlock';
import { compileRegExp } from '@/utils/regexp';

export default class InlineCode extends ParagraphBase {
  static HOOK_NAME = 'inlineCode';

  // constructor() {
  //     super();
  // }

  makeHtml(str) {
    return str;
  }

  afterMakeHtml(str) {
    let $str = str;
    if (Object.keys(CodeBlock.inlineCodeCache).length > 0) {
      $str = $str.replace(/~~CODE([0-9a-zA-Z]+)\$/g, (match, sign) => CodeBlock.inlineCodeCache[sign]);
      CodeBlock.inlineCodeCache = {};
    }
    return $str;
  }

  rule() {
    const ret = { begin: '(`+)[ ]*', end: '[ ]?\\1',  content: '([^`\\n]*(?:\\n[^`\\n]*)*)(?=\\1|$)' };
// 匹配零个或一个空格，后面紧跟与begin中捕获的反引号数量相同的反引号  
// 简化content部分，使用非贪婪匹配来捕获任意数量的非反引号字符（包括换行符），  
// 直到遇到与begin中捕获的反引号数量相同的反引号为止。  
// 上面的content正则表达式解释：  
// - `[^`\\n]*`：匹配任意数量的非反引号和非换行符字符。  
// - `(?:\\n[^`\\n]*)*`：非捕获组，匹配任意数量的换行符后跟任意数量的非反引号和非换行符字符的重复。  
// - `(?=\\1|$)`：正向前瞻断言，确保接下来是与begin中捕获的反引号数量相同的反引号或字符串结束。  
    ret.reg = compileRegExp(ret, 'g');
    return ret;
  }
}
