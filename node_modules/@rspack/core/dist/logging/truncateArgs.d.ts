/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/logging/truncateArgs.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
/**
 * @param args items to be truncated
 * @param maxLength maximum length of args including spaces between
 * @returns truncated args
 */
declare const truncateArgs: (args: any[], maxLength: number) => string[];
export { truncateArgs };
