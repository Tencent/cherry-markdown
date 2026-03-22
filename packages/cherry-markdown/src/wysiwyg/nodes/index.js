/**
 * Custom Milkdown node plugins for Cherry Markdown syntax
 * Exports all node plugins and their commands
 */
import { ruby } from './ruby';
import { panel } from './panel';
import { detail } from './detail';
import { video, audio } from './media';
import { footnote } from './footnote';

export { rubySchema, insertRubyCommand, ruby } from './ruby';
export { panelSchema, insertPanelCommand, panel } from './panel';
export { detailSchema, insertDetailCommand, detail } from './detail';
export { video, audio } from './media';
export { footnote, insertFootnoteCommand } from './footnote';

/**
 * Returns all custom node plugins as a flat array, ready to be passed to editor.use()
 */
export function getAllCustomNodePlugins() {
  return [...ruby, ...panel, ...detail, ...video, ...audio, ...footnote];
}
