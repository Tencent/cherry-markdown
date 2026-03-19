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
import mergeWith from 'lodash/mergeWith';

/**
 * Milkdown WYSIWYG 插件
 * 通过 Cherry.usePlugin(MilkdownWysiwygPlugin, { Crepe }) 注册
 * 将 Milkdown Crepe 编辑器集成到 Cherry Markdown 中，提供所见即所得编辑模式
 */
export default class MilkdownWysiwygPlugin {
  /**
   * @param {object} cherryOptions Cherry 默认配置
   * @param {object} options 插件选项
   * @param {import('@milkdown/crepe').Crepe} options.Crepe Milkdown Crepe 类引用
   * @param {Function} options.replaceAll Milkdown replaceAll 宏（来自 @milkdown/kit/utils）
   * @param {object} [options.crepeOptions] 传递给 Crepe 构造函数的额外选项
   */
  static install(cherryOptions, options = {}) {
    mergeWith(cherryOptions, {
      wysiwyg: {
        enabled: true,
        Crepe: options.Crepe,
        replaceAll: options.replaceAll,
        crepeOptions: options.crepeOptions || {},
      },
    });
  }
}
