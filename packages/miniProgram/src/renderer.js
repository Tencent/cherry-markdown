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
import { htmlToMiniProgramBlocks } from './transform';
import { blocksToMiniProgramView } from './view';

/**
 * Shared rendering utility used by both MiniProgramStream and MiniProgramStreamAdapter.
 * Renders markdown through a Cherry engine and returns WXML-friendly view blocks.
 *
 * @param {{ makeHtml: (markdown: string, returnType?: string, forceNoCursor?: boolean) => string }} engine
 * @param {string} markdown
 * @param {import('./transform').MiniProgramTransformOptions & import('./view').MiniProgramViewOptions} [options]
 * @returns {import('./view').MiniProgramViewBlock[]}
 */
export function markdownToMiniProgramView(engine, markdown, options = {}) {
  const forceNoCursor = options.forceNoCursor !== false;
  const html = engine.makeHtml(markdown || '', 'string', forceNoCursor);
  const blocks = htmlToMiniProgramBlocks(html, { ...options, forceNoCursor });
  return blocksToMiniProgramView(blocks, options);
}
