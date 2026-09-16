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
/**
 * 本文件主要维护导出Cherry时需要附加在Cherry对象上的静态属性集合
 * 所有的具名导出都会挂载在Cherry或CherryEngine上
 */
import { HOOKS_TYPE_LIST } from './core/SyntaxBase';
import { createSyntaxHook, createMenuHook } from './Factory';
import TapdTablePlugin from './addons/advance/cherry-tapd-table-plugin';
import TapdHtmlTagPlugin from './addons/advance/cherry-tapd-html-tag-plugin';
import TapdCheckListPlugin from './addons/advance/cherry-tapd-checklist-plugin';
import EChartsCodeBlockEngine from './addons/advance/cherry-codeblock-echarts-plugin';
import { isBrowser } from './utils/env';

const constants = { HOOKS_TYPE_LIST };

const plugins = {
  TapdTablePlugin,
  TapdHtmlTagPlugin,
  TapdCheckListPlugin,
  EChartsCodeBlockEngine,
};
const nodeIgnorePlugin = [];

if (!isBrowser()) {
  nodeIgnorePlugin.forEach((key) => {
    delete plugins[key];
  });
}

const VERSION = `${process.env.BUILD_VERSION}`;

/**
 * Runtime plugins are stored per Cherry constructor. Keeping the registry out
 * of the plugin class avoids leaking one registration between Cherry,
 * CherryEngine, CherryStream, or user-created subclasses.
 *
 * @type {WeakMap<typeof CherryStatic, Map<object, any[]>>}
 */
const runtimePluginRegistry = new WeakMap();

/**
 * @typedef {object} CherryPluginClass
 * @property {boolean} [$cherry$mounted]
 * @property {boolean} [$cherry$runtime]
 * @property {function(object, ...any): void} [install]
 * @property {function(any, ...any): any} [create]
 */

export class CherryStatic {
  static createSyntaxHook = createSyntaxHook;
  static createMenuHook = createMenuHook;
  static constants = constants;
  static plugins = plugins;
  static VERSION = VERSION;

  /**
   * @this {typeof import('./Cherry').default | typeof CherryStatic}
   * @param {CherryPluginClass} PluginClass 插件 Class
   * @param  {...any} args 初始化插件的参数
   * @returns {void}
   */
  static usePlugin(PluginClass, ...args) {
    if (this === CherryStatic) {
      throw new Error('`usePlugin` is not allowed to called through CherryStatic class.');
    }
    // @ts-expect-error 子类静态属性由 Cherry / CherryEngine 挂载
    if (this.initialized) {
      throw new Error('The function `usePlugin` should be called before Cherry is instantiated.');
    }
    if (PluginClass?.$cherry$runtime === true) {
      if (typeof PluginClass.create !== 'function') {
        throw new TypeError('A Cherry runtime plugin must provide a static `create(cherry, ...args)` function.');
      }
      let registry = runtimePluginRegistry.get(this);
      if (!registry) {
        registry = new Map();
        runtimePluginRegistry.set(this, registry);
      }
      if (registry.has(PluginClass)) {
        return;
      }
      if (typeof PluginClass.install === 'function') {
        // Keep the established install(defaults, ...args) contract available
        // for runtime plugins that also need to extend Cherry defaults.
        // @ts-expect-error 子类静态 config 由 Cherry / CherryEngine 挂载
        PluginClass.install.apply(PluginClass, [this.config.defaults, ...args]);
      }
      registry.set(PluginClass, args);
      return;
    }
    if (PluginClass.$cherry$mounted === true) {
      return;
    }
    if (typeof PluginClass.install !== 'function') {
      throw new TypeError('A Cherry plugin must provide a static `install(defaults, ...args)` function.');
    }
    // @ts-expect-error 子类静态 config 由 Cherry / CherryEngine 挂载
    PluginClass.install.apply(PluginClass, [this.config.defaults, ...args]);
    PluginClass.$cherry$mounted = true;
  }

  /**
   * Returns runtime plugin registrations owned by the current Cherry
   * constructor. This is intentionally separate from config.defaults: static
   * registration and per-instance lifecycle are different concerns.
   *
   * @returns {Array<{ PluginClass: any; args: any[] }>}
   */
  static getRuntimePlugins() {
    return Array.from(runtimePluginRegistry.get(this) ?? [], ([PluginClass, args]) => ({ PluginClass, args }));
  }

  constructor(...args) {
    // 基类仅挂载静态 API，禁止直接实例化
    if (new.target === CherryStatic) {
      throw new Error('CherryStatic cannot be instantiated directly.');
    }
  }
}
