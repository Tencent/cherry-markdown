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
import SyntaxBase from '../SyntaxBase.js';

export default class Transfer extends SyntaxBase {
  static HOOK_NAME = 'transfer';

  // constructor() {
  //     super();
  // }

  rule() {
    return {
      begin: '',
      content: '',
      end: '',
      reg: new RegExp(''),
    };
  }

  beforeMakeHtml(str) {
    return str.replace(/\\\n/g, '\\ \n');
  }

  afterMakeHtml(str) {
    let $str = str.replace(/~Q/g, '~');
    $str = $str.replace(/~X/g, '`');
    $str = $str.replace(/~Y/g, '!');
    $str = $str.replace(/~Z/g, '#');
    $str = $str.replace(/~&/g, '&');
    $str = $str.replace(/~K/g, '/');
    return $str;
  }
}
