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

import { createElement } from './dom';

/**
 * 对话框基操集合
 */
const dialog = {
  open() {
    this.dom.style.display = 'block';
    this.postMessage('ready?');
  },

  close() {
    this.dom.style.display = 'none';
  },

  postMessage(messageName, value = '') {
    this.iframeDom?.contentWindow?.postMessage({ eventName: messageName, value }, '*');
  },

  draw(params, onReady, onSubmit) {
    const { iframeSrc, title } = params;
    this.onSubmit = onSubmit;
    this.onReady = onReady;

    if (this.dom) {
      const test = new RegExp(`${iframeSrc}$`, 'i');
      if (!test.test(this.iframeDom.src)) {
        this.iframeDom.src = iframeSrc;
      }
      this.open();
      return;
    }
    // 添加通信事件
    window.addEventListener('message', (event) => {
      // @ts-ignore
      if (!event.data || !event.data.eventName) {
        return;
      }
      // @ts-ignore
      switch (event.data.eventName) {
        case 'getData:success':
          // @ts-ignore
          this.onSubmit(event.data.value);
          this.close();
        case 'ready':
          this.onReady();
      }
    });
    // 构造页面元素
    this.iframeDom = createElement('iframe', 'cherry-dialog-iframe', { src: iframeSrc, style: 'border: none;' });
    this.dom = createElement('div', 'cherry-dialog', {
      style: [
        'z-index:9999',
        'display: block',
        'position: absolute',
        'top: 10%;left: 10%;bottom: 10%;right: 10%',
        'background-color: #FFF',
        'box-shadow: 0px 50px 100px -12px rgba(0,0,0,.05),0px 30px 60px -30px rgba(0,0,0,.1)',
        'border-radius: 6px',
        'border: 1px solid #ddd;',
      ].join(';'),
    });
    this.head = createElement('div', 'cherry-dialog--head', {
      style: ['height: 30px', 'line-height: 30px', 'padding-left: 10px', 'padding-right: 10px'].join(';'),
    });
    this.body = createElement('div', 'cherry-dialog--body', {
      style: ['position: absolute', 'bottom: 30px', 'top: 30px', 'left: 0', 'right: 0', 'overflow: hidden'].join(';'),
    });
    this.foot = createElement('div', 'cherry-dialog--foot', {
      style: [
        'height: 30px',
        'line-height: 30px',
        'padding-left: 10px',
        'padding-right: 10px',
        'position: absolute',
        'bottom: 0',
        'left: 0',
        'right: 0',
      ].join(';'),
    });
    this.headTitle = createElement('span', 'cherry-dialog--title', { style: 'user-select:none;' });
    this.headCloseButton = createElement('i', 'cherry-dialog--close ch-icon ch-icon-close', {
      style: 'float: right;font-size: 12px;cursor: pointer;',
    });
    this.footSureButton = createElement('button', 'cherry-dialog--sure', {
      style: [
        'float: right',
        'cursor: pointer',
        'margin: 3px',
        'background-color: #4d90fe',
        'color: #FFF',
        'border: 1px solid #4d90fe',
        'border-radius: 2px',
        'padding: 2px 15px',
        'user-select:none',
      ].join(';'),
    });

    this.headCloseButton.title = '关闭';
    this.footSureButton.textContent = '确定';

    this.headTitle.textContent = title;
    this.head.appendChild(this.headTitle);
    this.head.appendChild(this.headCloseButton);
    this.foot.appendChild(this.footSureButton);

    this.body.appendChild(this.iframeDom);
    this.dom.appendChild(this.head);
    this.dom.appendChild(this.body);
    this.dom.appendChild(this.foot);

    this.headCloseButton.addEventListener('click', () => {
      this.close();
    });

    this.footSureButton.addEventListener('click', () => {
      this.postMessage('getData');
    });
    document.body.appendChild(this.dom);
  },
};

/**
 * draw.io的对话框
 * @param {string} xml draw.io的xml格式的字符串数据
 * @param {*} callback 回调
 */
export function drawioDialog(iframeSrc = '', xml = '', callback = null) {
  const dialogParam = { iframeSrc, title: 'draw.io' };
  dialog.draw(
    dialogParam,
    () => {
      dialog.postMessage('setData', xml);
    },
    (data) => {
      callback(data);
    },
  );
}
