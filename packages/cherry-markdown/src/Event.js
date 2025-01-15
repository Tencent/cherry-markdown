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
import mitt from 'mitt';

/**
 * 事件管理
 */
export default class Event {
  constructor(instanceId) {
    this.instanceId = instanceId;
  }
  /**
   * 事件列表
   * @property
   */
  Events = {
    previewerClose: 'previewerClose',
    previewerOpen: 'previewerOpen',
    editorClose: 'editorClose',
    editorOpen: 'editorOpen',
    toolbarHide: 'toolbarHide',
    toolbarShow: 'toolbarShow',
    cleanAllSubMenus: 'cleanAllSubMenus', // 清除所有子菜单弹窗
    afterChange: 'afterChange', // 编辑器内容变化
    afterInit: 'afterInit', // 编辑器初始化完成
    focus: 'focus', // 焦点
    blur: 'blur', // 失焦
    selectionChange: 'selectionChange', // 选区内容改变时触发
    afterChangeLocale: 'afterChangeLocale', // 语言改变
    changeMainTheme: 'changeMainTheme', // 变更主题
    changeCodeBlockTheme: 'changeCodeBlockTheme', // 变更代码块主题
  };

  /**
   * @property
   * @private
   * @type {import('mitt').Emitter}
   */
  emitter = mitt();

  setInstanceId(instanceId) {
    this.instanceId = instanceId;
  }

  getInstanceId() {
    return this.instanceId;
  }

  clearAll() {
    this.emitter.all.clear();
  }

  bindCallbacksByOptions(options) {
    if (options.callback.afterChange) {
      this.on(this.Events.afterChange, (msg) => {
        options.callback.afterChange(msg.markdownText, msg.html);
      });
    }
    if (options.callback.afterInit) {
      this.on(this.Events.afterInit, (msg) => {
        options.callback.afterInit(msg.markdownText, msg.html);
      });
    }
    if (options.event.afterChange) {
      this.on(this.Events.afterChange, (msg) => {
        options.event.afterChange(msg.markdownText, msg.html);
      });
    }
    if (options.event.afterInit) {
      this.on(this.Events.afterInit, (msg) => {
        options.event.afterInit(msg.markdownText, msg.html);
      });
    }
    if (options.event.focus) {
      this.on(this.Events.focus, (event) => {
        options.event.focus(event);
      });
    }
    if (options.event.blur) {
      this.on(this.Events.blur, (event) => {
        options.event.blur(event);
      });
    }
    if (options.event.selectionChange) {
      this.on(this.Events.selectionChange, (event) => {
        options.event.selectionChange(event);
      });
    }
    if (options.event.afterChangeLocale) {
      this.on(this.Events.afterChangeLocale, (locale) => {
        options.event.afterChangeLocale(locale);
      });
    }
    if (options.event.changeMainTheme) {
      this.on(this.Events.changeMainTheme, (theme) => {
        options.event.changeMainTheme(theme);
      });
    }
    if (options.event.changeCodeBlockTheme) {
      this.on(this.Events.changeCodeBlockTheme, (theme) => {
        options.event.changeCodeBlockTheme(theme);
      });
    }
  }

  /**
   * 注册监听事件
   * @param {string} event 要注册监听的事件
   * @param {(event: any) => void} handler 事件回调
   */
  on(event, handler) {
    this.emitter.on(`${this.instanceId}:${event}`, handler);
  }

  off(event, handler) {
    this.emitter.off(`${this.instanceId}:${event}`, handler);
  }

  /**
   * 触发事件
   * @param {string} event 要触发的事件
   * @param {object} msg 消息体
   */
  emit(event, msg) {
    this.emitter.emit(`${this.instanceId}:${event}`, msg);
  }
}
