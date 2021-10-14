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
/**
 * 本文件主要维护导出Cherry时需要附加在Cherry对象上的静态属性集合
 * 所有的具名导出都会挂载在Cherry或CherryEngine上
 */
import { HOOKS_TYPE_LIST } from './core/SyntaxBase';
import { createSyntaxHook, createMenuHook } from './Factory';
import { isBrowser } from './utils/env';

const constants = { HOOKS_TYPE_LIST };

const plugins = {};
const nodeIgnorePlugin = [];

if (!isBrowser()) {
  nodeIgnorePlugin.forEach((key) => {
    delete plugins[key];
  });
}

const VERSION = `${process.env.BUILD_VERSION}`;

export class CherryStatic {
  static createSyntaxHook = createSyntaxHook;
  static createMenuHook = createMenuHook;
  static constants = constants;
  static VERSION = VERSION;
  /**
   * @this {typeof import('./Cherry').default | typeof CherryStatic}
   * @param {{ install: (defaultConfig: any, ...args: any[]) => void }} PluginClass 插件Class
   * @param  {...any} args 初始化插件的参数
   * @returns
   */
  static usePlugin(PluginClass, ...args) {
    if (this === CherryStatic) {
      throw new Error('`usePlugin` is not allowed to called through CherryStatic class.');
    }
    // @ts-ignore
    if (this.initialized) {
      throw new Error('The function `usePlugin` should be called before Cherry is instantiated.');
    }
    // @ts-ignore
    if (PluginClass.$cherry$mounted === true) {
      return;
    }
    // @ts-ignore
    PluginClass.install.apply(PluginClass, [this.config.defaults, ...args]);
    // @ts-ignore
    PluginClass.$cherry$mounted = true;
  }
}
