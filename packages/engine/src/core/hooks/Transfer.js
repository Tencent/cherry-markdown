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
import ParagraphBase from '@/core/ParagraphBase';

export default class Transfer extends ParagraphBase {
  static HOOK_NAME = 'transfer';

  constructor() {
    super({ needCache: false });
  }

  rule() {
    return {
      begin: '',
      content: '',
      end: '',
      reg: new RegExp(''),
    };
  }

  beforeMakeHtml(str) {
    // fix: 转义字符边界情况的特殊处理 Fixed #144
    return str.replace(/\\\n/g, '\\ \n');
  }

  makeHtml(str) {
    return str;
  }
}
