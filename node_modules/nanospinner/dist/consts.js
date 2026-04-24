"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.symbols = exports.isTTY = void 0;
const node_tty_1 = __importDefault(require("node:tty"));
const node_process_1 = __importDefault(require("node:process"));
/**
 * This file contains code adapted from the following projects:
 *
 * 1. is-unicode-supported (https://github.com/sindresorhus/is-unicode-supported)
 * 2. cli-spinners (https://github.com/sindresorhus/cli-spinners)
 * 3. log-symbols (https://github.com/sindresorhus/log-symbols)
 *
 * All of the above projects are created by Sindre Sorhus (https://sindresorhus.com)
 * and are licensed under the MIT License.
 *
 * The full text of the MIT License can be found in the LICENSE file in this project's root directory.
 */
const isCI = node_process_1.default.env.CI ||
    node_process_1.default.env.WT_SESSION ||
    node_process_1.default.env.ConEmuTask === '{cmd::Cmder}' ||
    node_process_1.default.env.TERM_PROGRAM === 'vscode' ||
    node_process_1.default.env.TERM === 'xterm-256color' ||
    node_process_1.default.env.TERM === 'alacritty';
const isTTY = node_tty_1.default.isatty(1) && node_process_1.default.env.TERM !== 'dumb' && !('CI' in node_process_1.default.env);
exports.isTTY = isTTY;
// https://github.com/sindresorhus/is-unicode-supported
const supportUnicode = node_process_1.default.platform !== 'win32' ? node_process_1.default.env.TERM !== 'linux' : isCI;
const symbols = {
    frames: isTTY
        ? supportUnicode
            ? // https://github.com/sindresorhus/cli-spinners
                ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
            : ['-', '\\', '|', '/']
        : ['-'],
    // https://github.com/sindresorhus/log-symbols/blob/main/index.js
    tick: supportUnicode ? '✔' : '√',
    cross: supportUnicode ? '✖' : '×',
    warn: supportUnicode ? '⚠' : '!!',
    info: supportUnicode ? 'ℹ' : 'i',
};
exports.symbols = symbols;
