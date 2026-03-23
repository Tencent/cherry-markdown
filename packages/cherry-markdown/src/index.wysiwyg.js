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
