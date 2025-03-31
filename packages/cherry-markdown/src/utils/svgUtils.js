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

import { downloadByATag } from './downloadUtil';
/**
 * @typedef {Object} Svg2ImgOptions
 * @property {string=} filename 文件名
 * @property {number=} width 宽度
 * @property {number=} height 高度
 * @property {number=} scale 缩放比例
 * @property {number=} quality 图片质量
 * @property {string=} backgroundColor 背景颜色
 * @property {"svg" | "png" | "jpg"=} format 图片格式
 * @property {string=} encoderOptions 编码器选项
 * @property {string=} mimeType mime类型
 * @property {string=} type 类型
 * @property {string=} crossOrigin 跨域
 */
/**
 * svg转img
 * @param {SVGSVGElement} svgElement
 * @param {Svg2ImgOptions} options
 */
export function svg2img(svgElement, options = {}) {
  if (options.format === 'svg') {
    downloadSvg(svgElement, options.filename ?? 'formula.svg');
    return;
  }
  const {
    width = svgElement.width.baseVal.value,
    height = svgElement.height.baseVal.value,
    scale = 5,
    quality = 1,
    backgroundColor = 'white',
    filename = 'formula',
    format = 'png',
    mimeType = 'image/png',
  } = options;
  const svgString = getSvgString(svgElement);
  // 创建一个新的 Canvas 元素
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
  img.onload = () => {
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        const url = URL.createObjectURL(blob);
        downloadByATag(url, `${filename}.${format}`);
        URL.revokeObjectURL(url);
      },
      mimeType,
      quality,
    );
  };
}

/**
 * 获取带xmlns的svg字符串
 * @param {SVGSVGElement} svgElement svg元素
 * @returns {string}
 */
export function getSvgString(svgElement) {
  return new XMLSerializer().serializeToString(svgElement);
}

/**
 * 下载svg
 * @param {SVGSVGElement} svgElement svg元素
 * @param {string} filename 文件名
 */
export function downloadSvg(svgElement, filename) {
  const svgString = getSvgString(svgElement);
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  downloadByATag(url, filename);
  URL.revokeObjectURL(url);
}
