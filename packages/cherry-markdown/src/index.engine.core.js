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
import EnginePackage, { SyntaxHookBase } from '@cherry-markdown/engine';
import MenuHookBase from './toolbars/MenuBase';
import defaultConfig from './Cherry.config';
import cloneDeep from './utils/toolkit/cloneDeep';
import mergeWith from './utils/toolkit/mergeWith';
import { customizer } from './utils/config';

/** @deprecated 0.x compatibility constructor retaining the historical full config surface. */
class CherryEngine extends EnginePackage {
  static config = { defaults: defaultConfig };

  constructor(options = {}, runtime = {}) {
    const normalized = mergeWith({}, cloneDeep(CherryEngine.config.defaults), options, customizer);
    super(normalized, runtime);
  }
}

export { SyntaxHookBase, MenuHookBase };
export * from '@cherry-markdown/engine';
export default CherryEngine;
