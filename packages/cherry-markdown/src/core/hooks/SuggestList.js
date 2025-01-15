/**
 * Tencent is pleased to support the open source community by making CherryMarkdown available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company. All rights reserved.
 * The below software in this distribution may have been modified by THL A29 Limited ("Tencent Modifications").
 *
 * All Tencent Modifications are Copyright (C) THL A29 Limited.
 *
 * CherryMarkdown is licensed under the Apache License, Version 2.0 (the "License");
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

import { codePreviewLangSelectList } from '@/utils/code-preview-language-setting';

/*
 * 外加配置系统联想词
 */
export const addonsKeywords = '#';
/*
 * 预留联想词
 */
export const suggesterKeywords = '/·￥、：“”【】（）《》`'.concat(addonsKeywords);
/*
 * 系统联想候选表，主要为'、'以及'、'的联想。
 */
const SystemSuggestList = [
  {
    icon: 'h1',
    label: 'H1 Heading',
    keyword: 'head1',
    value: '# ',
  },
  {
    icon: 'h2',
    label: 'H2  Heading',
    keyword: 'head2',
    value: '## ',
  },
  {
    icon: 'h3',
    label: 'H3  Heading',
    keyword: 'head3',
    value: '### ',
  },
  {
    icon: 'table',
    label: 'Table',
    keyword: 'table',
    value: '| Header | Header | Header |\n| --- | --- | --- |\n| Content | Content | Content |\n',
  },
  {
    icon: 'code',
    label: 'Code',
    keyword: 'code',
    value: '```\n\n```\n',
  },
  {
    icon: 'link',
    label: 'Link',
    keyword: 'link',
    value: `[title](https://url)`,
    selection: { from: 'title](https://url)'.length, to: '](https://url)'.length },
  },
  {
    icon: 'checklist',
    label: 'Checklist',
    keyword: 'checklist',
    value: `- [ ] item\n- [x] item`,
  },
  {
    icon: 'tips',
    label: 'Panel',
    keyword: 'panel tips info warning danger success',
    value: `::: primary title\ncontent\n:::\n`,
  },
  {
    icon: 'insertFlow',
    label: 'Detail',
    keyword: 'detail',
    value: `+++ 点击展开更多\n内容\n++- 默认展开\n内容\n++ 默认收起\n内容\n+++\n`,
  },
  // {
  //   icon: 'pen',
  //   label: '续写',
  //   keyword: 'xu xie chatgpt',
  //   value: () => {
  //     if (!this.$engine.$cherry.options.openai.apiKey) {
  //       return '请先配置openai apiKey';
  //     }
  //     this.$engine.$cherry.toolbar.toolbarHandlers.chatgpt('complement');
  //     return `\n`;
  //   },
  // },
  // {
  //   icon: 'pen',
  //   label: '总结',
  //   keyword: 'zong jie chatgpt',
  //   value: () => {
  //     if (!this.$engine.$cherry.options.openai.apiKey) {
  //       return '请先配置openai apiKey';
  //     }
  //     this.$engine.$cherry.toolbar.toolbarHandlers.chatgpt('summary');
  //     return `\n`;
  //   },
  // },
];
/*
 * 全角联想候选表，用于将全角转为半角。
 */
const HalfWidthSuggestList = [
  {
    icon: 'FullWidth',
    label: '`',
    keyword: '···',
    value: '`',
  },
  {
    icon: 'FullWidth',
    label: '$',
    keyword: '￥',
    value: '$',
  },
  {
    icon: 'FullWidth',
    label: '/',
    keyword: '、',
    value: '/',
  },
  {
    icon: 'FullWidth',
    label: '\\',
    keyword: '、',
    value: '\\',
  },
  {
    icon: 'FullWidth',
    label: '"',
    keyword: '“',
    value: '"',
  },
  {
    icon: 'FullWidth',
    label: '"',
    keyword: '”',
    value: '"',
  },
  {
    icon: 'FullWidth',
    label: '[',
    keyword: '【',
    value: '[',
  },
  {
    icon: 'FullWidth',
    label: ']',
    keyword: '】',
    value: ']',
  },
  {
    icon: 'FullWidth',
    label: '(',
    keyword: '（',
    value: '(',
  },
  {
    icon: 'FullWidth',
    label: ')',
    keyword: '）',
    value: ')',
  },
  {
    icon: 'FullWidth',
    label: '<',
    keyword: '《',
    value: '<',
  },
  {
    icon: 'FullWidth',
    label: '>',
    keyword: '》',
    value: '>',
  },
];
/*
 * 更多候选适配，
 * goLeft用于在选中联想之后向左移动一定距离光标，
 * selection用于选中光标，from-to即选中范围。
 */
const MoreSuggestList = [
  {
    icon: 'FullWidth',
    label: '[]',
    keyword: '【】',
    value: `[]`,
    goLeft: 1,
  },
  {
    icon: 'FullWidth',
    label: '【】',
    keyword: '【',
    value: `【】`,
    goLeft: 1,
  },
  {
    icon: 'link',
    label: 'Link',
    keyword: '【】',
    value: `[title](https://url)`,
    selection: { from: 'title](https://url)'.length, to: '](https://url)'.length },
  },
  {
    icon: 'FullWidth',
    label: '()',
    keyword: '（',
    value: `()`,
    goLeft: 1,
  },
  {
    icon: 'FullWidth',
    label: '（）',
    keyword: '（',
    value: `（）`,
    goLeft: 1,
  },
  {
    icon: 'FullWidth',
    label: '<>',
    keyword: '《》',
    value: `<>`,
    goLeft: 1,
  },
  {
    icon: 'FullWidth',
    label: '《》',
    keyword: '《》',
    value: `《》`,
    goLeft: 1,
  },
  {
    icon: 'FullWidth',
    label: '""',
    keyword: '“”',
    value: `""`,
    goLeft: 1,
  },
  {
    icon: 'FullWidth',
    label: '“”',
    keyword: '“”',
    value: `”“`,
    goLeft: 1,
  },
  {
    icon: 'FullWidth',
    label: 'inlineCode',
    keyword: '`',
    value: '``',
    goLeft: 1,
  },
  {
    icon: 'FullWidth',
    label: 'codeBlock',
    keyword: '`',
    value: '```\n\n```\n',
    goTop: 2,
  },
];

// TODO 提示列表超过一定长度的时候，需要跟随箭头上下滚动列表，以保证待选择项始终可见

// 代码语言的候选表
const CodeLangSuggestList = (() => {
  const CodePreviewLangSuggestList = codePreviewLangSelectList.map((lang) => ({
    icon: 'FullWidth',
    label: lang,
    keyword: '```',
    value: `\`\`\`${lang}\n\n\`\`\`\n`,
    goTop: 2,
    exactMatch: true,
  }));

  const CodePreviewLangSuggestListExact = [];
  codePreviewLangSelectList.forEach((lang) => {
    let str = '';
    for (const i of lang) {
      str += i;
      CodePreviewLangSuggestListExact.push({
        icon: 'FullWidth',
        label: lang,
        keyword: `\`\`\`${str}`,
        value: `\`\`\`${lang}\n\n\`\`\`\n`,
        goTop: 2,
        exactMatch: true,
      });
    }
  });

  return CodePreviewLangSuggestList.concat(CodePreviewLangSuggestListExact);
})();

/*
 * 除开系统联想候选表的其他所有表之和
 */
const OtherSuggestList = HalfWidthSuggestList.concat(MoreSuggestList).concat(CodeLangSuggestList);

export function allSuggestList(keyword, locales) {
  const systemSuggestList = [].concat(SystemSuggestList);
  const otherSuggestList = [].concat(OtherSuggestList);
  systemSuggestList.forEach((item) => {
    item.label = locales[item.label] || item.label;
  });
  otherSuggestList.forEach((item) => {
    item.label = locales[item.label] || item.label;
  });
  if (keyword[0] === '/' || keyword[0] === '、' || addonsKeywords.includes(keyword[0])) {
    systemSuggestList.forEach((item) => {
      item.keyword = ''.concat(keyword[0], item.keyword);
    });
  }
  // '、'除了返回系统候选表，还需要返回两个半角字符
  return otherSuggestList.concat(systemSuggestList).filter((item) => {
    return item.keyword.startsWith(keyword[0]);
  });
}
