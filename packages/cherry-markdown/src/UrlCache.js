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
import md5 from 'md5';

let urlCache = {};
const cherryInnerLinkRegex = /^cherry-inner:\/\/([0-9a-f]+)$/i;

export function urlProcessorProxy(urlProcessor) {
  return function (url, srcType) {
    if (UrlCache.isInnerLink(url)) {
      const newUrl = urlProcessor(UrlCache.get(url), srcType);
      return UrlCache.replace(url, newUrl);
    }
    return urlProcessor(url, srcType);
  };
}

export default class UrlCache {
  /**
   * 判断url是否Cherry的内部链接
   * @param {string} url 要检测的URL
   * @returns
   */
  static isInnerLink(url) {
    return cherryInnerLinkRegex.test(url);
  }

  /**
   * 缓存url为内部链接，主要用于缩短超长链接，避免正则超时
   * @param {string} url 要转换为内部链接的URL
   * @returns
   */
  static set(url) {
    const urlSign = md5(url);
    urlCache[urlSign] = url;
    return `cherry-inner://${urlSign}`;
  }

  /**
   * 获取原始链接
   * @param {string} innerUrl 内部链接
   * @returns
   */
  static get(innerUrl) {
    const [, urlSign] = innerUrl.match(cherryInnerLinkRegex) ?? [];
    if (!urlSign) {
      return;
    }
    return urlCache[urlSign];
  }

  /**
   * 替换指定内部链接的真实地址
   * @param {string} innerUrl 原始内部链接
   * @param {string} newUrl 需要替换的链接
   */
  static replace(innerUrl, newUrl) {
    const [, urlSign] = innerUrl.match(cherryInnerLinkRegex) ?? [];
    if (!urlSign) {
      return;
    }
    urlCache[urlSign] = newUrl;
    return innerUrl;
  }

  /**
   * 替换所有内部链接为原始的真实地址
   * @param {string} html 包含 cherry-inner 协议地址的 html 文本
   */
  static restoreAll(html) {
    const cherryInnerLinkRegex = /cherry-inner:\/\/([0-9a-f]+)/gi;
    const $html = html.replace(cherryInnerLinkRegex, (match) => {
      const originalUrl = UrlCache.get(match);
      return originalUrl || match;
    });
    return $html;
  }

  /**
   * 清空缓存
   */
  static clear() {
    urlCache = {};
  }
}
