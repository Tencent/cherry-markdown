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
/**
 * 切换语言按钮
 **/
export default class ChangeLocale extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.noIcon = true;
    const defaultLocaleList = [
      {
        locale: 'zh_CN',
        name: '中文',
      },
      {
        locale: 'en_US',
        name: 'English',
      },
      {
        locale: 'ru_RU',
        name: 'Русский',
      },
    ];
    this.changeLocale = $cherry?.options?.toolbars?.config?.changeLocale || defaultLocaleList;
    this.subMenuConfig = [];
    this.nameMap = {};
    for (let i = 0; i < this.changeLocale.length; i++) {
      const { locale, name } = this.changeLocale[i];
      this.subMenuConfig.push({
        iconName: locale,
        name,
        onclick: this.bindSubClick.bind(this, locale),
      });
      this.nameMap[locale] = name;
    }
    this.setName(this.nameMap[this.$cherry.options.locale] || this.nameMap.zh_CN);
  }

  onClick(selection, shortKey) {
    if (!this.$cherry.locales[shortKey]) {
      return;
    }
    this.$cherry.$event.emit('afterChangeLocale', shortKey);
    this.$cherry.options.locale = shortKey;
    this.$cherry.locale = this.$cherry.locales[shortKey];
    this.$cherry.resetToolbar('toolbar', this.$cherry.options.toolbars.toolbar || []);
  }
}
