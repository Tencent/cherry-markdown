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
import Align from './Align';
/**
 * 插入对齐方式
 * @deprecated 名字起错了，请使用 Align
 */
export default class Justify extends Align {
  constructor($cherry) {
    super($cherry);
    this.setName('justify', 'justify');
  }

  $getTitle() {
    return ' ';
  }
}
