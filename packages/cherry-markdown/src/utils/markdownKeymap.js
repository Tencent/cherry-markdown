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

import { markdownKeymap } from '@codemirror/lang-markdown';
import { cherryInsertNewlineContinueMarkup } from './markdownEnter';

/**
 * Keep suggestion acceptance, Cherry custom lists, and Markdown continuation in one Enter binding.
 * Returning false lets the editor's default Enter handle ordinary text and other languages.
 * @param {Object} [options]
 * @param {import('@codemirror/view').Command} [options.interceptEnter]
 * @param {import('@codemirror/view').Command} [options.continueCustomList]
 * @returns {import('@codemirror/view').KeyBinding[]}
 */
export function createMarkdownKeymap({ interceptEnter = () => false, continueCustomList = () => false } = {}) {
  return markdownKeymap.map((binding) =>
    binding.key === 'Enter'
      ? {
          ...binding,
          run: (view) => interceptEnter(view) || continueCustomList(view) || cherryInsertNewlineContinueMarkup(view),
        }
      : binding,
  );
}
