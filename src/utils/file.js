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
 * 上传文件的逻辑，如果有callback，则不再走默认的替换文本的逻辑，而是调用callback
 * @param {string} type 上传文件的类型
 */
export function handleUpload(editor, type = 'image', callback = null) {
  // type为上传文件类型 image|video|audio|pdf|word
  const input = document.createElement('input');
  input.type = 'file';
  input.id = 'fileUpload';
  input.value = '';
  input.style.display = 'none';
  // document.body.appendChild(input);
  input.addEventListener('change', (event) => {
    // @ts-ignore
    const [file] = event.target.files;
    // 文件上传后的回调函数可以由调用方自己实现
    editor.options.fileUpload(file, (url) => {
      // 文件上传的默认回调行数，调用方可以完全不使用该函数
      if (typeof url !== 'string' || !url) {
        return;
      }
      let code = '';
      if (type === 'image') {
        // 如果是图片，则返回固定的图片markdown源码
        code = `![${file.name}](${url})`;
      } else if (type === 'video') {
        // 如果是视频，则返回固定的视频markdown源码
        code = `!video[${file.name}](${url})`;
      } else if (type === 'audio') {
        // 如果是音频，则返回固定的音频markdown源码
        code = `!audio[${file.name}](${url})`;
      } else {
        // 默认返回超链接
        code = `[${file.name}](${url})`;
      }
      if (callback) {
        callback(file.name, url);
      } else {
        // 替换选中区域
        // @ts-ignore
        editor.editor.doc.replaceSelection(code);
      }
    });
  });
  input.click();
}
