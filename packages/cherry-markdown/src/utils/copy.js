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

/**
 * 复制内容到剪贴板
 * @param {string} [text] - 可选的纯文本内容 (text/plain)
 * @param {string} [html] - 可选的 HTML 内容 (text/html)
 * @returns {Promise<void>}
 * @throws {Error}
 */
export async function copyToClip(text, html) {
  // 验证输入
  if (!text && !html) {
    throw new Error('没有提供任何内容进行复制');
  }

  if (navigator.clipboard && window.ClipboardItem) {
    try {
      /** @type {Record<string, Blob>} */
      const clipboardItems = {};
      if (text) {
        clipboardItems['text/plain'] = new Blob([text], { type: 'text/plain' });
      }
      if (html) {
        clipboardItems['text/html'] = new Blob([html], { type: 'text/html' });
      }
      await navigator.clipboard.write([new ClipboardItem(clipboardItems)]);
      return;
    } catch (err) {
      // 如果 Clipboard API 失败，降级到 execCommand
      console.warn('Clipboard API failed, falling back to execCommand:', err);
    }
  }

  // 降级方案：使用 execCommand
  function listener(e) {
    if (text) {
      e.clipboardData.setData('text/plain', text);
    }
    if (html) {
      e.clipboardData.setData('text/html', html);
    }
    e.preventDefault();
  }

  document.addEventListener('copy', listener);
  try {
    const success = document.execCommand('copy');
    if (!success) {
      throw new Error('Copy command was unsuccessful');
    }
  } finally {
    document.removeEventListener('copy', listener);
  }
}
