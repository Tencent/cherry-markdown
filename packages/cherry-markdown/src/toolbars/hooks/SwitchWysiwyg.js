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
/**
 * 模式切换器按钮，提供下拉子菜单切换编辑模式：
 * - 双栏编辑 (edit&preview)
 * - 纯编辑 (editOnly)
 * - 纯预览 (previewOnly)
 * - 所见即所得 (wysiwyg)
 */
export default class SwitchWysiwyg extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('switchWysiwyg', 'swap');
    this.updateMarkdown = false;
    this.subMenuConfig = this.$buildSubMenuConfig();
  }

  $buildSubMenuConfig() {
    const modes = [
      { name: 'modelEditPreview', iconName: 'preview', model: 'edit&preview' },
      { name: 'modelEditOnly', iconName: 'edit', model: 'editOnly' },
      { name: 'modelPreviewOnly', iconName: 'previewClose', model: 'previewOnly' },
    ];
    // 仅当 WYSIWYG 插件已启用时才显示该选项
    if (this.$cherry.options?.wysiwyg?.enabled) {
      modes.push({ name: 'modelWysiwyg', iconName: 'pen-fill', model: 'wysiwyg' });
    }
    return modes.map((item) => ({
      iconName: item.iconName,
      name: item.name,
      onclick: this.bindSubClick.bind(this, item.model),
    }));
  }

  /**
   * 子菜单点击后通过 fire → onClick 触发
   */
  onClick(selection, shortKey) {
    if (shortKey) {
      this.$cherry.switchModel(shortKey);
    }
    return false;
  }

  /**
   * 高亮当前激活的模式
   */
  getActiveSubMenuIndex(subMenuDomPanel) {
    const status = this.$cherry.status || {};
    if (status.wysiwyg === 'show') return this.$cherry.options?.wysiwyg?.enabled ? 3 : -1;
    if (status.editor === 'show' && status.previewer === 'show') return 0;
    if (status.editor === 'show' && status.previewer === 'hide') return 1;
    if (status.editor === 'hide' && status.previewer === 'show') return 2;
    return 0;
  }
}
