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
import openAI from 'openai';

/**
 * 插入“画图”的按钮
 * 本功能依赖[Mermaid.js](https://mermaid-js.github.io)组件，请保证调用CherryMarkdown前已加载mermaid.js组件
 */
export default class ChatGpt extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('chatgpt', 'chatgpt');
    this.noIcon = true;
    this.subMenuConfig = [
      // 续写
      { iconName: this.locale.complement, name: 'complement', onclick: this.bindSubClick.bind(this, 'complement') },
      // 总结
      { iconName: this.locale.conclude, name: 'conclude', onclick: this.bindSubClick.bind(this, 'conclude') },
    ];
    if (this.$cherry.options.apiKey) {
      const openai = new openAI.OpenAIApi(
        new openAI.Configuration({
          apiKey: '', // your API key goes here
        }),
      );
      this.openai = openai;
    }
  }

  getSubMenuConfig() {
    return this.subMenuConfig;
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容，本函数不处理选中的内容，会直接清空用户选中的内容
   * @param {string} shortKey 快捷键参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    if (!shortKey) {
      return;
    }
    const that = this;
    switch (shortKey) {
      case 'complement':
        if (!this.openai) {
          // 触发一个事件表示没有apiKey？
          return;
        }
        this.openai
          .createCompletion(
            {
              model: 'text-davinci-003',
              prompt: `continue writing with the following text: ${selection || this.$cherry.editor.editor.getValue()}`,
              temperature: 0.6,
              max_tokens: 500,
            },
            {
              proxy: {
                host: '127.0.0.1',
                port: 7890,
              },
            },
          )
          .then((res) => {
            that.editor.editor.replaceSelection(`${selection || ''} \n${res.data?.choices?.[0]?.text}`);
            that.editor.editor.focus();
            that.$afterClick();
          });
        break;
      case 'conclude':
        this.openai
          .createCompletion(
            {
              model: 'text-davinci-003',
              prompt: `summary the following text: ${selection || this.$cherry.editor.editor.getValue()}`,
              temperature: 0.6,
              max_tokens: 500,
            },
            {
              proxy: {
                host: '127.0.0.1',
                port: 7890,
              },
            },
          )
          .then((res) => {
            that.editor.editor.replaceSelection(`${selection || ''} \n${res.data?.choices?.[0]?.text}`);
            that.editor.editor.focus();
            that.$afterClick();
          });
        break;
      default:
        return;
    }
  }
}
