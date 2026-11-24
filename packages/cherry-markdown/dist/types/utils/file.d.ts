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
 * 多选上传文件的逻辑，如果有callback，则不再走默认的替换文本的逻辑，而是调用callback
 * @param {string} type 上传文件的类型
 */
export function handleUploadMulti(editor: any, type?: string, accept?: string, callback?: any): void;
/**
 * 上传文件的逻辑，如果有callback，则不再走默认的替换文本的逻辑，而是调用callback
 * @param {string} type 上传文件的类型
 */
export function handleUpload(editor: any, type?: string, accept?: string, callback?: any): void;
/**
 * 解析params参数
 * @param params?.isBorder 是否有边框样式（图片场景下生效）
 * @param params?.isShadow 是否有阴影样式（图片场景下生效）
 * @param params?.isRadius 是否有圆角样式（图片场景下生效）
 * @param params?.width 设置宽度，可以是像素、也可以是百分比（图片、视频场景下生效）
 * @param params?.height 设置高度，可以是像素、也可以是百分比（图片、视频场景下生效）
 */
export function handleParams(params: any): string;
export function handleFileUploadCallback(url: any, params: any, file: any, imageCaption: any): string;
/**
 * 去掉文件名的扩展名，用于生成图片名称
 * @param {string} name 文件名
 * @returns {string}
 */
export function stripFileExtension(name: string): string;
/**
 * 解析图片名称：上传回调返回的 params.name 优先（调用方可以自定义标题），
 * 否则使用去掉扩展名的文件名
 * @param {string} fileName 原始文件名
 * @param {object} [params] 上传回调返回的参数
 * @returns {string}
 */
export function resolveImageName(fileName: string, params?: object): string;
/**
 * 根据 imageCaption 配置生成「图片名称」追加文本（#1767）
 * 图片名称会作为独立的一段追加在图片语法后面
 * @param {boolean|string|Function} imageCaption 配置项
 *   - true：追加图片名称
 *   - string：作为前缀，例如 '图片: ' -> '图片: 图片名称'
 *   - Function(imageName, url)：返回要追加的文本，返回空串则不追加
 * @param {string} imageName 图片名称
 * @param {string} url 图片地址
 * @returns {string} 需要追加到图片语法后面的文本，空串表示不追加
 */
export function getImageCaptionText(imageCaption: boolean | string | Function, imageName: string, url: string): string;
export function handleDropType(file: File, url: string, imageCaption?: boolean | string | Function): string;
