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

export default class Underline extends SyntaxBase {
  static HOOK_NAME = 'underline';

  // constructor() {
  //     super();
  // }

  makeHtml(str) {
    if (!this.test(str)) {
      return str;
    }
    return str.replace(this.RULE.reg, '$1<span style="text-decoration: underline;">$2</span>$3');
  }

  rule() {
    const ret = { begin: '(^| )\\/', end: '\\/( |$)', content: '([^\\n]+?)' };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
