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
import { mac } from 'codemirror/src/util/browser';
import HookCenter from './HookCenter';
import Event from '@/Event';

function getCurrentKey(event) {
  let key = '';
  if (event.ctrlKey) {
    key += 'Ctrl-';
  }

  if (event.altKey) {
    key += 'Alt-';
  }

  if (event.metaKey && mac) {
    key += 'Command-';
  }

  if (event.key) {
    key += event.key.toLowerCase();
  }

  return key;
}

export default class Toolbar {
  constructor(options) {
    /**
     * @property
     * @type {string} 实例ID
     */
    this.instanceId = `cherry-toolbar-${new Date().getTime()}`;

    this.options = {
      dom: document.createElement('div'),
      buttonConfig: ['bold'],
      editor: {},
      extensions: [],
      keysmap: {},
      engine: {},
      customMenu: [],
    };

    Object.assign(this.options, options);
    this.initExtension();
    this.init();
  }

  init() {
    this.collectShortcutKey();
    this.collectToolbarHandler();
  }

  previewOnly() {
    this.options.dom.classList.add('preview-only');
    Event.emit(this.instanceId, Event.Events.toolbarHide);
  }

  showToolbar() {
    this.options.dom.classList.remove('preview-only');
    Event.emit(this.instanceId, Event.Events.toolbarShow);
  }

  initExtension() {
    this.options.extensions = /** @type {any[]} */ (/** @type {unknown} */ (new HookCenter(this)));

    const frag = document.createDocumentFragment();
    this.options.extensions.forEach((ext) => {
      frag.appendChild(ext.createBtn());
    });
    this.options.dom.appendChild(frag);
  }

  collectShortcutKey() {
    this.options.extensions.forEach((ext) => {
      if (!ext.shortcutKey) {
        return;
      }
      this.options.keysmap = {
        ...this.options.keysmap,
        ...ext.shortcutKey({ isMac: mac }),
      };
    });
  }

  collectToolbarHandler() {
    this.toolbarHandlers = {};
    this.options.extensions.forEach((ext) => {
      if (typeof ext.onClick !== 'function') {
        return;
      }
      this.toolbarHandlers[ext.name] = (shortKey, callback) => {
        const selections = this.options.editor.editor.getSelections();
        const ret = selections.map(
          (selection, index, srcArray) => ext.onClick(selection, shortKey, callback) || srcArray[index],
        );
        this.options.editor.editor.replaceSelections(ret, 'around');
        this.options.editor.editor.focus();
      };
    });
  }

  matchShortcutKey(evt) {
    const currentKey = getCurrentKey(evt);

    return this.options.extensions.some((ext) => this.options.keysmap[currentKey]);
  }

  fireShortcutKey(evt, codemirror) {
    const currentKey = getCurrentKey(evt);
    this.options.keysmap[currentKey] && this.options.keysmap[currentKey](evt, codemirror);
  }
}
