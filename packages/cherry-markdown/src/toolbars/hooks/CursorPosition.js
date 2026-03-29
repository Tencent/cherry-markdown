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
import MenuBase from '@/toolbars/MenuBase';
/**
 * 光标位置回显
 */
export default class CursorPosition extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('cursorPosition', 'cursorPosition');
    this.noIcon = true;
    this.updateMarkdown = false;
    this.countEvent = new Event('cursorChange');
  }

  $updateCursorPosition() {
    const { line, ch } = this.$cherry.editor?.editor?.getCursor() || { line: 0, ch: 0 };
    const selected = this.$cherry.editor?.editor?.getSelection() || '';
    this.btnDom.innerHTML = `Ln ${line}, Col ${ch}${selected ? ` (${selected.length} selected)` : ''}`;
  }

  afterInit(btnDom) {
    this.btnDom = btnDom;
    this.btnDom.addEventListener('cursorChange', () => {
      this.$updateCursorPosition();
    });
    this.$updateCursorPosition();
    setTimeout(() => {
      this.$cherry.editor.editor.on('cursorActivity', () => {
        btnDom.dispatchEvent(this.countEvent);
      });
    }, 500);
  }
}
