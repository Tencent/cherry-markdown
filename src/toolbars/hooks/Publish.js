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
import MenuBase from '@/toolbars/MenuBase';
import { isBrowser } from '@/utils/env';
import platformTransform from '@/utils/platformTransform';

/** @typedef {import('../../../types/cherry').SupportPlatform} SupportPlatform */

/** @type {Array<SupportPlatform>} */
const supportPlatforms = ['wechat'];

export default class Publish extends MenuBase {
  /**
   * @param {import('@/toolbars/MenuBase').MenuBaseConstructorParams} $cherry
   */
  constructor($cherry) {
    super($cherry);
    this.previewer = $cherry.previewer;
    this.updateMarkdown = false;
    this.setName('publish', 'copy');
    const publishConfigs = $cherry?.options?.toolbars?.config?.publish || [];
    const keys = publishConfigs.map((config) => {
      if (!Object.prototype.hasOwnProperty.call(config, 'key')) {
        throw new Error('publish config must have key');
      }
      // @ts-ignore
      if (!supportPlatforms.includes(config.key)) {
        throw new Error(`publish config key must be one of ${supportPlatforms.join(',')}`);
      }
      return config.key;
    });
    if (new Set(keys).size !== keys.length) {
      throw new Error('publish config key must be unique');
    }
    this.subMenuConfig = publishConfigs.map((config) => {
      /** @type {import('../MenuBase').SubMenuConfigItem}*/
      const subMenuConfig = {
        name: config.name,
        iconName: config.iconName,
        icon: config.icon,
        onclick: this.bindSubClick.bind(this, config),
      };
      return subMenuConfig;
    });
  }

  /**
   * 子菜单点击事件
   * @param {string} selection 编辑器中选中的内容
   * @param {import('../../../types/cherry').CherryPublishToolbarOption} shortcut 子菜单配置项
   */
  onClick(selection, shortcut) {
    if (!isBrowser()) return;
    const { previewerDom } = this.$cherry.previewer.options;
    const title = previewerDom?.querySelector('h1')?.innerText ?? '';
    const { key, serviceUrl, injectPayload } = shortcut;
    const execute = async () => {
      let injectPayloadResult = {};
      if (typeof injectPayload === 'function') {
        injectPayloadResult = await injectPayload();
      } else if (typeof injectPayload === 'object' && injectPayload !== null) {
        injectPayloadResult = injectPayload;
      }
      const style = this.getAllStyleSheets();
      const html = await platformTransform(previewerDom?.outerHTML ?? '', key);
      const res = await fetch(`${serviceUrl}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: key,
          contentType: 'html',
          needInlineStyle: true,
          articles: [
            {
              title,
              content: html + style,
              ...injectPayloadResult,
            },
          ],
        }),
      });
      const publishRes = await res.json();
      if (publishRes?.code === 0) {
        alert('发布成功');
      } else {
        alert(`错误码：${publishRes?.code} 错误信息：${publishRes?.msg}`);
      }
    };
    execute();
  }

  /**
   * 获取所有的样式表
   * @returns {string}
   */
  getAllStyleSheets() {
    const allSheets = Array.from(document.styleSheets).filter((item) => item.cssRules[0]);
    // 每一条styleSheet用一个style标签包裹
    return allSheets
      .map(
        (cssStyleSheet) =>
          `<style>${Array.from(cssStyleSheet.cssRules)
            .map((cssRule) => cssRule.cssText)
            .join('')}</style>`,
      )
      .join('');
  }
}
