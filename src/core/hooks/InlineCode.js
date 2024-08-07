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
    const ret = { begin: '(`+)[ ]*', end: '[ ]*\\1', content: '(.+?(?:\\n.+?)*?)' };
    ret.reg = compileRegExp(ret, 'g');
    return ret;
  }
}
