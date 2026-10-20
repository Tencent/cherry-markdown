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
import mergeWith from '@/utils/toolkit/mergeWith';
import cloneDeep from '@/utils/toolkit/cloneDeep';

import Engine from './Engine';
import { CherryStatic } from './CherryStatic';
import SyntaxHookBase from './core/SyntaxBase';
import MenuHookBase from './toolbars/MenuBase';
import defaultConfig from './Cherry.config';
import { customizer } from './utils/config';
import { urlProcessorProxy } from './UrlCache';

class CherryEngine extends CherryStatic {
  /**
   * @private
   */
  static initialized = false;
  // TODO: 共用config
  /**
   * @readonly
   */
  static config = {
    defaults: defaultConfig,
  };

  /**
   * @param {any} options
   */
  constructor(options) {
    super();
    CherryEngine.initialized = true;
    const defaultConfigCopy = cloneDeep(CherryEngine.config.defaults);
    const opts = mergeWith({}, defaultConfigCopy, options, customizer);

    if (typeof opts.engine.global.urlProcessor === 'function') {
      opts.engine.global.urlProcessor = urlProcessorProxy(opts.engine.global.urlProcessor);
      opts.callback.urlProcessor = opts.engine.global.urlProcessor;
    } else {
      opts.callback.urlProcessor = urlProcessorProxy(opts.callback.urlProcessor);
    }

    // @ts-expect-error 构造器返回 Engine 实例以兼容历史 API
    return new Engine(opts, { options: opts });
  }
}

export { SyntaxHookBase, MenuHookBase };

/**
 * Preserve the static API while declaring the Engine instance returned by the
 * compatibility constructor. A class declaration alone cannot express this.
 * @typedef {Omit<typeof CherryEngine, 'prototype'> & (new (options?: ConstructorParameters<typeof CherryEngine>[0]) => Engine)} CherryEngineConstructor
 */
const CherryEngineExport = /** @type {CherryEngineConstructor} */ (/** @type {unknown} */ (CherryEngine));

export default CherryEngineExport;
