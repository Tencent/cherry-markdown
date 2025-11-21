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
export function copyToClip(text?: string, html?: string): Promise<void>;
