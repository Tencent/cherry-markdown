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
import AsyncRenderPipeline from './utils/async-render-pipeline';
import { isBrowser } from './utils/env';

const constants = { HOOKS_TYPE_LIST };

const plugins = {
  TapdTablePlugin,
  TapdHtmlTagPlugin,
  TapdCheckListPlugin,
  EChartsCodeBlockEngine,
};

// @ts-expect-error process.env from build env
const VERSION = `${process.env.BUILD_VERSION}`;

export class CherryStatic {
  static createSyntaxHook = createSyntaxHook;
  static createMenuHook = createMenuHook;
  static constants = constants;
  static plugins = plugins;
  static VERSION = VERSION;
  /** 全局异步渲染管线实例 */
  static asyncRenderPipeline = new AsyncRenderPipeline();
  /**
   * 注册插件，须在实例化前调用，只能通过子类（Cherry / CherryStream / CherryEngine）调用。
   * @param {{ install: (defaultConfig: any, ...args: any[]) => void }} PluginClass 插件Class
   * @param  {...any} args 初始化插件的参数
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
