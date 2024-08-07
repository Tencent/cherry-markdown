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
import { drawioDialog } from '@/utils/dialog';
/**
 * 打开draw.io画图对话框，点击确定后向编辑器插入图片语法
 */
export default class DrawIo extends MenuBase {
  constructor($cherry) {
    super($cherry);
    this.setName('draw.io', 'draw.io');
    this.noIcon = true;
    this.drawioIframeUrl = $cherry.options.drawioIframeUrl;
  }

  /**
   * 响应点击事件
   * @param {string} selection 被用户选中的文本内容
   * @param {string} shortKey 快捷键参数，本函数不处理这个参数
   * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
   */
  onClick(selection, shortKey = '') {
    if (!this.drawioIframeUrl) {
      // 如果没有配置drawio的编辑页URL，则直接失效
      return selection;
    }
    if (this.hasCacheOnce()) {
      // @ts-ignore
      const { xmlData, base64 } = this.getAndCleanCacheOnce();
      const begin = '![';
      const end = `](${base64}){data-type=drawio data-xml=${encodeURI(xmlData)}}`;
      this.registerAfterClickCb(() => {
        this.setLessSelection(begin, end);
      });
      return `${begin}在预览区点击图片重新编辑draw.io${end}`;
    }
    // 插入图片，调用上传文件逻辑
    drawioDialog(this.drawioIframeUrl, '', (data) => {
      this.setCacheOnce(data);
      this.fire(null);
    });
    this.updateMarkdown = false;
    return selection;
  }
}
