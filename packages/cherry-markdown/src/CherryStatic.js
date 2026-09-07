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

// Registrations belong to a Cherry constructor; editor state belongs to each mount.
const instancePlugins = new WeakMap();
export function getInstancePlugins(constructor) {
  const inherited = constructor && Object.getPrototypeOf(constructor);
  const registrations = new Map();
  for (const entry of [
    ...(inherited ? getInstancePlugins(inherited) : []),
    ...(instancePlugins.get(constructor) || []),
  ]) {
    registrations.set(entry.plugin, entry);
  }
  return [...registrations.values()];
}

/**
 * @typedef {object} CherryPluginClass
 * @property {boolean} [$cherry$mounted]
 * @property {function(object, ...any[]): void} [install]
 * @property {function(object, ...any[]): any} [mount]
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
    if (typeof PluginClass.mount === 'function') {
      const registrations = instancePlugins.get(this) || [];
      if (!registrations.some(({ plugin }) => plugin === PluginClass)) {
        instancePlugins.set(this, [...registrations, { plugin: PluginClass, args }]);
      }
      return;
    }
    if (typeof PluginClass.install !== 'function') {
      throw new TypeError('Cherry plugins must provide install() or mount().');
    }
    if (PluginClass.$cherry$mounted === true) {
      return;
    }
    // @ts-expect-error 子类静态 config 由 Cherry / CherryEngine 挂载
    PluginClass.install.apply(PluginClass, [this.config.defaults, ...args]);
    PluginClass.$cherry$mounted = true;
  }

  constructor(...args) {
    // 基类仅挂载静态 API，禁止直接实例化
    if (new.target === CherryStatic) {
      throw new Error('CherryStatic cannot be instantiated directly.');
    }
  }
}
