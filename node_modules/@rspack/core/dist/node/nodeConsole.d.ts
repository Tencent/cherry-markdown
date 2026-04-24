/**
 * The following code is modified based on
 * https://github.com/webpack/webpack/blob/4b4ca3b/lib/node/nodeConsole.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack/blob/main/LICENSE
 */
import type { LoggerConsole } from "../logging/createConsoleLogger";
export default function ({ colors, appendOnly, stream }: {
    colors?: boolean;
    appendOnly?: boolean;
    stream: NodeJS.WritableStream;
}): LoggerConsole;
