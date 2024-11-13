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
 * 多选上传文件的逻辑，如果有callback，则不再走默认的替换文本的逻辑，而是调用callback
 * @param {string} type 上传文件的类型
 */
export function handleUploadMulti(editor, type = 'image', accept = '*', callback = null) {
  // type为上传文件类型 image|video|audio|pdf|word
  const input = document.createElement('input');
  const inputMultiple = editor.$cherry.options.multipleFileSelection || false;
  input.type = 'file';
  input.id = 'fileUpload';
  input.value = '';
  input.style.display = 'none';
  input.accept = accept;
  input.multiple = inputMultiple;
  // document.body.appendChild(input);
  input.addEventListener('change', (event) => {
    // @ts-ignore
    const { files } = event.target;
    // 文件上传后的回调函数可以由调用方自己实现
    editor.$cherry.options.callback.fileUploadMulti(files, (arr) => {
      // 文件上传的默认回调行数，调用方可以完全不使用该函数
      if (arr.length === 0) {
        return;
      }
      if (callback) {
        return callback(arr);
      }
      let code = '';
      for (const file of files) {
        const { url } = file;
        code += `${handleType(type, file, url)}/n`;
      }
      // 替换选中区域
      // @ts-ignore
      editor.editor.doc.replaceSelection(code);
    });
  });
  input.click();
}

/**
 * 上传文件的逻辑，如果有callback，则不再走默认的替换文本的逻辑，而是调用callback
 * @param {string} type 上传文件的类型
 */
export function handleUpload(editor, type = 'image', accept = '*', callback = null) {
  // type为上传文件类型 image|video|audio|pdf|word
  const input = document.createElement('input');
  input.type = 'file';
  input.id = 'fileUpload';
  input.value = '';
  input.style.display = 'none';
  input.accept = accept;
  // document.body.appendChild(input);
  input.addEventListener('change', (event) => {
    // @ts-ignore
    const [file] = event.target.files;
    // 文件上传后的回调函数可以由调用方自己实现
    editor.$cherry.options.callback.fileUpload(file, (url, params = {}) => {
      // 文件上传的默认回调行数，调用方可以完全不使用该函数
      if (typeof url !== 'string' || !url) {
        return;
      }
      if (callback) {
        return callback(file.name, url, params);
      }
      let code = '';
      code = handleType(type, file, url);
      // 替换选中区域
      // @ts-ignore
      editor.editor.doc.replaceSelection(code);
    });
  });
  input.click();
}

/**
 * 处理要插入的代码
 * @param type 文件类型
 * @param file 文件
 * @param url 路径
 * @returns string
 */
const handleType = (type, file, url) => {
  if (type === 'image') {
    // 如果是图片，则返回固定的图片markdown源码
    return `![${file.name}](${url})`;
  }
  if (type === 'video') {
    // 如果是视频，则返回固定的视频markdown源码
    return `!video[${file.name}](${url})`;
  }
  if (type === 'audio') {
    // 如果是音频，则返回固定的音频markdown源码
    return `!audio[${file.name}](${url})`;
  }
  // 默认返回超链接
  return `[${file.name}](${url})`;
};

/**
 * 解析params参数
 * @param params?.isBorder 是否有边框样式（图片场景下生效）
 * @param params?.isShadow 是否有阴影样式（图片场景下生效）
 * @param params?.isRadius 是否有圆角样式（图片场景下生效）
 * @param params?.width 设置宽度，可以是像素、也可以是百分比（图片、视频场景下生效）
 * @param params?.height 设置高度，可以是像素、也可以是百分比（图片、视频场景下生效）
 */
export function handleParams(params) {
  const ret = [];
  if (params?.isBorder) {
    ret.push('#B');
  }
  if (params?.isShadow) {
    ret.push('#S');
  }
  if (params?.isRadius) {
    ret.push('#R');
  }
  if (params?.width) {
    ret.push(`#${params.width}`);
  }
  if (params?.height) {
    if (!params.width) {
      ret.push('#auto');
    }
    ret.push(`#${params.height}`);
  }
  return ret.join(' ');
}

export function handleFileUploadCallback(url, params, file) {
  const name = params?.name ?? file.name;
  let type = '';
  let poster = '';
  if (/video/i.test(file.type)) {
    type = '!video';
    poster = params?.poster ? `{poster=${params.poster}}` : '';
  }
  if (/audio/i.test(file.type)) {
    type = '!audio';
  }
  if (/image/i.test(file.type)) {
    type = '!';
  }
  const style = type ? handleParams(params) : '';
  return `${type}[${name}${style}](${url})${poster}`;
}
