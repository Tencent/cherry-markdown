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
export function handleFileUploadCallback(url: any, params: any, file: any): string;
