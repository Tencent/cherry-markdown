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
 * 本文件主要维护导出 CherryEngine 时需要附加在对象上的静态属性集合
 */
import { HOOKS_TYPE_LIST } from './syntax/SyntaxBase';
import { createSyntaxHook } from './Factory';
import { isBrowser } from './utils/env';

const constants = { HOOKS_TYPE_LIST };

const VERSION = `${process.env.BUILD_VERSION}`;

/**
 * @typedef {object} CherryPluginClass
 * @property {boolean} [$cherry$mounted]
 * @property {function(object, ...any[]): void} install
 */

export class CherryStatic {
  static createSyntaxHook = createSyntaxHook;
  static constants = constants;
  static VERSION = VERSION;

  /**
   * @this {typeof CherryStatic}
   * @param {CherryPluginClass} PluginClass 插件 Class
   * @param  {...any} args 初始化插件的参数
   * @returns {void}
   */
  static usePlugin(PluginClass, ...args) {
    if (this === CherryStatic) {
      throw new Error('`usePlugin` is not allowed to called through CherryStatic class.');
    }
    // @ts-expect-error 子类静态属性由子类挂载
    if (this.initialized) {
      throw new Error('The function `usePlugin` should be called before Cherry is instantiated.');
    }
    if (PluginClass.$cherry$mounted === true) {
      return;
    }
    // @ts-expect-error 子类静态 config 由子类挂载
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
