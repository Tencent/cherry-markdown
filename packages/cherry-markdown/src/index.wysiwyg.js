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
import Cherry from './index.core';
import MilkdownWysiwygPlugin from './addons/cherry-wysiwyg-milkdown-plugin';
import { Crepe } from '@milkdown/crepe';
import { replaceAll } from '@milkdown/kit/utils';
import { createWysiwygCommandMap } from './wysiwyg/commandMap';
import { getAllCustomMarkPlugins } from './wysiwyg/marks';
import { getAllCustomNodePlugins } from './wysiwyg/nodes';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';

Cherry.usePlugin(MilkdownWysiwygPlugin, {
  Crepe,
  replaceAll,
  commandMap: createWysiwygCommandMap(),
  customPlugins: [...getAllCustomMarkPlugins(), ...getAllCustomNodePlugins()],
});

export { MilkdownWysiwygPlugin };
export default Cherry;
