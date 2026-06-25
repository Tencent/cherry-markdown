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
    const editor = this.$cherry.editor?.editor;
    let line = 0;
    let ch = 0;
    let selected = '';

    if (editor?.view) {
      const { state } = editor.view;
      const cursorOffset = state.selection.main.head;
      const docLine = state.doc.lineAt(cursorOffset);
      line = docLine.number - 1;
      ch = cursorOffset - docLine.from;
      selected = state.doc.sliceString(state.selection.main.from, state.selection.main.to);
    }

    this.btnDom.innerHTML = `Ln ${line}, Col ${ch}${selected ? ` (${selected.length} selected)` : ''}`;
  }

  afterInit(btnDom) {
    this.btnDom = btnDom;
    this.btnDom.addEventListener('cursorChange', () => {
      this.$updateCursorPosition();
    });
    this.$updateCursorPosition();
    this.$cherry.$event.on('beforeSelectionChange', () => {
      btnDom.dispatchEvent(this.countEvent);
    });
  }
}
