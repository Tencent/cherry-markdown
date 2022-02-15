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
import CodeMirror from 'codemirror';

interface EditorEventMap {
  onBlur: FocusEvent;
  onFocus: FocusEvent;
  onKeydown: KeyboardEvent;
  onPaste: ClipboardEvent;
}

type EditorDefaultCallback = () => void;
export type EditorEventCallback<
  E = unknown,
  K extends keyof EditorEventMap = keyof EditorEventMap
> = E extends EditorEventMap[K]
  ? (event: E, codemirror: CodeMirror.Editor) => void
  : (codemirror: CodeMirror.Editor) => void;

type EditorPasteEventHandler = (
  event: ClipboardEvent,
  clipboardData: ClipboardEvent['clipboardData'],
  codemirror: CodeMirror.Editor,
) => void;

export type EditorConfiguration = {
  id: string;
  editorDom: HTMLElement;
  wrapperDom: HTMLElement;
  toolbars: any;
  value?: string;
  convertWhenPaste?: boolean;
  codemirror: CodeMirror.EditorConfiguration;
  onKeydown: EditorEventCallback<EditorEventMap['onKeydown']>;
  onFocus: EditorEventCallback<EditorEventMap['onFocus']>;
  onBlur: EditorEventCallback<EditorEventMap['onBlur']>;
  onPaste: EditorEventCallback<EditorEventMap['onPaste']>;
  onChange: (changeList: CodeMirror.EditorChangeLinkedList, codemirror: CodeMirror.Editor) => void;
  onScroll: EditorEventCallback;
  handlePaste?: EditorPasteEventHandler;
  /** 预览区域跟随编辑器光标自动滚动 */
  autoScrollByCursor: boolean;
  fileUpload?: (file: File, callback: (fileUrl: string) => void) => void;
};
