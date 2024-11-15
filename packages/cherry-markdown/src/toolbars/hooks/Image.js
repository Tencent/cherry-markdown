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
import { handleUpload, handleParams, handleUploadMulti } from '@/utils/file';
import { CONTROL_KEY, getKeyCode } from '@/utils/shortcutKey';
/**
 * 插入图片
 */
export default class Image extends MenuBase {
  /**
   * @param {import('@/toolbars/MenuBase').MenuBaseConstructorParams} $cherry
   */
  constructor($cherry) {
    super($cherry);
    this.setName('image', 'image');
    this.shortcutKeyMap = {
      [`${CONTROL_KEY}-${getKeyCode('g')}`]: {
        hookName: this.name,
        aliasName: this.$cherry.locale[this.name],
      },
    };
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    const accept = this.$cherry.options?.fileTypeLimitMap?.image ?? '*';
    const multiple = this.$cherry?.options.multipleFileSelection?.image ?? false;

    if (multiple) {
      if (this.hasCacheOnce()) {
        // @ts-ignore
        const arr = this.getAndCleanCacheOnce();
        let res = '';
        // @ts-ignore
        for (const { url, params } of arr) {
          const begin = '![';
          const end = `](${url})`;
          this.registerAfterClickCb(() => {
            this.setLessSelection(begin, end);
          });
          const finalName = params.name ? params.name : name;
          res += `${begin}${finalName}${handleParams(params)}${end}\n`;
        }
        return res;
      }
      // 插入图片，调用上传文件逻辑
      handleUploadMulti(this.editor, 'image', accept, (arr) => {
        this.setCacheOnce(arr);
        this.fire(null);
      });
      this.updateMarkdown = false;
      return selection;
    }

    if (this.hasCacheOnce()) {
      // @ts-ignore
      const { name, url, params } = this.getAndCleanCacheOnce();
      const begin = '![';
      const end = `](${url})`;
      this.registerAfterClickCb(() => {
        this.setLessSelection(begin, end);
      });
      const finalName = params.name ? params.name : name;
      return `${begin}${finalName}${handleParams(params)}${end}`;
    }
    // 插入图片，调用上传文件逻辑
    handleUpload(this.editor, 'image', accept, (name, url, params) => {
      this.setCacheOnce({ name, url, params });
      this.fire(null);
    });
    this.updateMarkdown = false;
    return selection;
  }
}
