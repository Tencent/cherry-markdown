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
import MenuBase from '@/toolbars/MenuBase';
/**
 * 撤销/重做 里的“重做”按键
 * 依赖codemirror的undo接口
 */
export default class Redo extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('redo', 'redo');
  }

  /**
   * 直接调用codemirror的redo方法就好了
   */
  onClick() {
    this.editor.editor.redo();
  }
}
