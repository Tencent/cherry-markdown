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
export default class HookBase {
  getType() {
    const typeList = {
      1: 'sentence',
      2: 'paragraph',
      3: 'page',
    };
    return typeList[this.HOOKTYPE] || 'sentence';
  }

  getName() {
    return this.HOOKNAME;
  }

  constructor() {
    this.HOOKNAME = '';
    this.HOOKTYPE = 1;
  }

  // makeHtml(str) {
  //     return str;
  // }
  getMakeHtml() {
    return this.makeHtml || false;
  }

  // onKeyDown(e, str) {
  //     return false;
  // }
  getOnKeyDown() {
    return this.onKeyDown || false;
  }

  // test(str) {
  //     let rule = this.getRule();
  //     let reg = new RegExp(rule.begin+rule.content+rule.end, 'g');
  //     return reg.test(str)
  // }

  // rule() {
  //     return {begin:'#+', end:'\n', content:'[^\#\n]+'};
  // }
  getRule() {
    return this.rule || false;
  }

  // toolbar() {
  //     return new ToolBar();
  // }
}
