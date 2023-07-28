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

const FUNC_MAP = {
  COMPLEMENT: 'complement',
  SUMMARY: 'summary',
};

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
      {
        iconName: this.locale.complement,
        name: FUNC_MAP.COMPLEMENT,
        onclick: this.bindSubClick.bind(this, FUNC_MAP.COMPLEMENT),
      },
      // 总结
      {
        iconName: this.locale.summary,
        name: FUNC_MAP.SUMMARY,
        onclick: this.bindSubClick.bind(this, FUNC_MAP.SUMMARY),
      },
    ];
    const { apiKey = '', proxy: { host = '', port = '' } = {} } = this.$cherry.options || {};
    // 设置apiKey
    if (apiKey) {
      const openai = new openAI.OpenAIApi(
        new openAI.Configuration({
          apiKey: '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', // your API key goes here
        }),
      );
      this.openai = openai;
    }
    // 设置http proxy
    if (host && port) {
      this.proxy = {
        host,
        port,
      };
    }
    this.queryOpenAIApi = queryOpenAIApi.bind(this);
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
      case FUNC_MAP.COMPLEMENT:
        if (!this.openai) {
          // 触发一个事件表示没有apiKey？
          return;
        }
        this.queryOpenAIApi(FUNC_MAP.COMPLEMENT, selection || this.$cherry.editor.editor.getValue()).then((res) => {
          that.editor.editor.replaceSelection(`${selection || ''} \n${res.data?.choices?.[0]?.text}`);
          that.editor.editor.focus();
          that.$afterClick();
        });
        break;
      case FUNC_MAP.SUMMARY:
        this.queryOpenAIApi(FUNC_MAP.SUMMARY, selection || this.$cherry.editor.editor.getValue()).then((res) => {
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

const generatePromptMap = {
  [FUNC_MAP.COMPLEMENT](text) {
    return `continue writing with the following text: ${text}`;
  },
  [FUNC_MAP.SUMMARY](text) {
    return `summary the following text: ${text}`;
  },
};

function queryCompletion(type, input) {
  return this.openai.createCompletion(
    {
      model: 'text-davinci-003',
      prompt: generatePromptMap[type](input),
      temperature: 0.6,
      max_tokens: 500,
    },
    {
      proxy: this.proxy,
    },
  );
}

const queryMap = {
  [FUNC_MAP.COMPLEMENT](input) {
    return queryCompletion.apply(this, [FUNC_MAP.COMPLEMENT, input]);
  },
  [FUNC_MAP.SUMMARY](input) {
    return queryCompletion.apply(this, [FUNC_MAP.SUMMARY, input]);
  },
};

function queryOpenAIApi(name, input) {
  if (!this.openai) {
    return;
  }
  return queryMap[name].apply(this, [input]);
}
