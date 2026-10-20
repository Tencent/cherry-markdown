/**
 * Keep suggestion acceptance, Cherry custom lists, and Markdown continuation in one Enter binding.
 * Returning false lets the editor's default Enter handle ordinary text and other languages.
 * @param {Object} [options]
 * @param {import('@codemirror/view').Command} [options.interceptEnter]
 * @param {import('@codemirror/view').Command} [options.continueCustomList]
 * @returns {import('@codemirror/view').KeyBinding[]}
 */
export function createMarkdownKeymap({ interceptEnter, continueCustomList }?: {
    interceptEnter?: import("@codemirror/view").Command;
    continueCustomList?: import("@codemirror/view").Command;
}): import("@codemirror/view").KeyBinding[];
