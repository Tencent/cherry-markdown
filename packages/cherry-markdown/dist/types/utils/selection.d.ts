/**
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.
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
 * 获取用户选中的文本内容，如果没有选中文本，则返回光标所在的位置的内容
 * @param {Object} cm Codemirror实例
 * @param {string} selection 当前选中的文本内容
 * @param {string} type  'line': 当没有选择文本时，获取光标所在行的内容； 'word': 当没有选择文本时，获取光标所在单词的内容
 * @param {boolean} focus true；强行选中光标处的内容，否则只获取选中的内容
 * @returns {string}
 */
export function getSelection(cm: any, selection: string, type?: string, focus?: boolean): string;
