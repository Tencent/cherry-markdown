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
import MenuBase from '@/toolbars/MenuBase';
import { getPanelRule } from '@/utils/regexp';

/**
 * 插入时间线
 * 复用 Panel 的 :::xxx ... ::: 交互逻辑，插入的模板内部包含多条 "- [status] time title" 条目
 */
export default class Timeline extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('timeline', 'timeline');
    this.panelRule = getPanelRule().reg;
    this.noSubMenu = true;
  }

  $getTitle() {
    const { locale } = this.$cherry;
    return locale?.timelineTitle ?? '时间线';
  }

  /**
   * 点击工具栏按钮时，插入一个时间线模板。
   * 复用父类 Panel.onClick 的骨架：把 shortKey 固定为 'timeline'，
   * 并把默认的 "内容" 替换为多条示例条目。
   */
  onClick(selection) {
    const { locale } = this.$cherry;
    const defaultContent =
      locale?.timelineDefaultContent ??
      ':: [done] 2024-01-15 项目立项\n  完成需求评审\n' +
        ':: [doing] 2024-03-20 Alpha 版本\n  正在联调\n' +
        ':: [todo] 2024-06-01 正式上线\n' +
        ':: [error] 2024-07-01 严重回滚事件\n' +
        ':: [milestone] 2024-08-01 用户破万';
    const $selection = this.getSelection(selection, 'line', true) || defaultContent;
    // 直接走父类逻辑，type 固定为 timeline
    this.registerAfterClickCb(() => {
      this.setLessSelection('::: ', '\n');
    });
    let title = '';
    let body = $selection.replace(/^\n+/, '');
    if (/\n/.test(body)) {
      title = body.replace(/\n[\w\W]+$/, '');
      // 如果首行不是 ":: " 起始，则把它当标题
      if (!/^\s*::\s+/.test(title)) {
        body = body.replace(/^[^\n]+\n/, '');
      } else {
        title = this.$getTitle();
      }
    } else {
      title = this.$getTitle();
      body = defaultContent;
    }
    return `::: timeline ${title}\n${body}\n:::`.replace(/\n{2,}:::/g, '\n:::');
  }
}
