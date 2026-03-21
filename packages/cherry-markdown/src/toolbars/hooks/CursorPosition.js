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
    
    if (editor) {
      const cursor = editor.getCursor();
      if (cursor !== null && cursor !== undefined) {
        // CM6Adapter.getCursor() 返回文档偏移量，需要转换为行列
        const cursorOffset = typeof cursor === 'number' ? cursor : 0;
        const view = editor.view;
        if (view) {
          // CM6 的 doc.lineAt() 返回的 number 是 1-indexed
          // 为保持与 Cherry 其他 API 一致（使用 0-based），需要转换回 0-indexed
          const docLine = view.state.doc.lineAt(cursorOffset);
          line = docLine.number - 1;
          ch = cursorOffset - docLine.from;
        }
      }
    }
    
    const selected = (editor ? editor.getSelection() : null) || '';
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
