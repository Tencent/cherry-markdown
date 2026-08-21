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
import SyntaxBase from '@/core/SyntaxBase';
/**
 * 连续空格
 */
export default class Space extends SyntaxBase {
  static HOOK_NAME = 'space';

  makeHtml(str, sentenceMakeFunc) {
    return str.replace(this.RULE.reg, (whole) => {
      return '&nbsp;'.repeat(whole.length);
    });
  }

  rule() {
    const ret = {
      begin: '',
      end: '',
      content: '',
    };
    ret.reg = /\s{2,}/g;
    return ret;
  }
}
