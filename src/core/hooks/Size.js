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
import SyntaxBase from '@/core/SyntaxBase';

export default class Size extends SyntaxBase {
  static HOOK_NAME = 'fontSize';

  // constructor() {
  //     super();
  // }

  makeHtml(str) {
    if (!this.test(str)) {
      return str;
    }
    return str.replace(this.RULE.reg, '$2<span style="font-size:$4px;line-height:1em;">$5</span>$7');
  }

  rule() {
    const ret = { begin: '((^|[^\\\\])(\\!))', end: '(\\!([\\s\\S]|$))', content: '([0-9]{1,2})[\\s]([\\w\\W]*?)' };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
