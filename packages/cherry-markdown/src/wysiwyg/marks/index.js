/**
 * Custom Milkdown mark plugins for Cherry Markdown syntax
 * Exports all mark plugins and their toggle commands
 */
import { superscript } from './superscript';
import { subscript } from './subscript';
import { underline } from './underline';
import { highlight } from './highlight';
import { fontColor } from './fontColor';
import { bgColor } from './bgColor';
import { fontSize } from './fontSize';

export { superscriptSchema, toggleSuperscriptCommand, superscriptInputRule, superscript } from './superscript';
export { subscriptSchema, toggleSubscriptCommand, subscriptInputRule, subscript } from './subscript';
export { underlineSchema, toggleUnderlineCommand, underline } from './underline';
export { highlightSchema, toggleHighlightCommand, highlightInputRule, highlight } from './highlight';
export { fontColorSchema, toggleFontColorCommand, fontColor } from './fontColor';
export { bgColorSchema, toggleBgColorCommand, bgColor } from './bgColor';
export { fontSizeSchema, toggleFontSizeCommand, fontSize } from './fontSize';

/**
 * Returns all custom mark plugins as a flat array, ready to be passed to editor.use()
 */
export function getAllCustomMarkPlugins() {
  // Order matters: bgColor (!!!) must be registered before fontColor (!!) before fontSize (!)
  // so their remark tree transforms process in the correct order
  return [...superscript, ...subscript, ...underline, ...highlight, ...bgColor, ...fontColor, ...fontSize];
}
