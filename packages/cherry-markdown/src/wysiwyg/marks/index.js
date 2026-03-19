/**
 * Custom Milkdown mark plugins for Cherry Markdown syntax
 * Exports all mark plugins and their toggle commands
 */
import { superscript } from './superscript';
import { subscript } from './subscript';
import { underline } from './underline';
import { highlight } from './highlight';

export { superscriptSchema, toggleSuperscriptCommand, superscriptInputRule, superscript } from './superscript';
export { subscriptSchema, toggleSubscriptCommand, subscriptInputRule, subscript } from './subscript';
export { underlineSchema, toggleUnderlineCommand, underline } from './underline';
export { highlightSchema, toggleHighlightCommand, highlightInputRule, highlight } from './highlight';

/**
 * Returns all custom mark plugins as a flat array, ready to be passed to editor.use()
 */
export function getAllCustomMarkPlugins() {
  return [...superscript, ...subscript, ...underline, ...highlight];
}
