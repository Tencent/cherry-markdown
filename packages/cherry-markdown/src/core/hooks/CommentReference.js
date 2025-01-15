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
import ParagraphBase from '@/core/ParagraphBase';
import { compileRegExp } from '@/utils/regexp';
import UrlCache from '@/UrlCache';
/**
 * 脚注和引用语法
 * 示例：
 *    这里需要一个脚注[^脚注别名1]，另外这里也需要一个脚注[^another]。
 *    [^脚注别名1]: 无论脚注内容写在哪里，脚注的内容总会显示在页面最底部
 *    以两次回车结束
 *
 *    [^another]: 另外，脚注里也可以使用一些简单的markdown语法
 *    >比如 !!#ff0000 这里!!有一段**引用**
 */
export default class CommentReference extends ParagraphBase {
  static HOOK_NAME = 'commentReference';

  constructor({ externals, config }) {
    super();
    this.commentCache = {};
  }

  $cleanCache() {
    this.commentCache = {};
  }

  pushCommentReferenceCache(key, cache) {
    const [url, ...args] = cache.split(/[ ]+/g);
    const innerUrl = UrlCache.set(url);
    this.commentCache[`${key}`.toLowerCase()] = [innerUrl, ...args].join(' ');
  }

  getCommentReferenceCache(key) {
    return this.commentCache[`${key}`.toLowerCase()] || null;
  }

  beforeMakeHtml(str) {
    let $str = str;
    if (this.test($str)) {
      $str = $str.replace(this.RULE.reg, (match, leading, key, content) => {
        this.pushCommentReferenceCache(key, content);
        const lineFeeds = match.match(/\n/g) ?? [];
        return lineFeeds.join('');
      });
      // 替换实际引用
      const refRegex = /(\[[^\]\n]+?\])?(?:\[([^\]\n]+?)\])/g; // 匹配[xxx][ref]形式的内容，不严格大小写
      $str = $str.replace(refRegex, (match, leadingContent, key) => {
        const cache = this.getCommentReferenceCache(key);
        if (cache) {
          if (leadingContent) {
            return `${leadingContent}(${cache})`; // 替换为[xx](cache)形式，交给Link或多媒体标签处理
          }
          return `[${key}](${cache})`; // 替换为[ref](cache)形式，交给Link或多媒体标签处理
        }
        return match;
      });
      this.$cleanCache();
    }
    return $str;
  }

  makeHtml(str, sentenceMakeFunc) {
    return str;
  }

  afterMakeHtml(str) {
    return UrlCache.restoreAll(str);
  }

  rule() {
    const ret = {
      begin: '(^|\\n)[ \t]*',
      content: [
        '\\[([^^][^\\]]*?)\\]:\\h*', // comment key
        '([^\\n]+?)', // comment content
      ].join(''),
      end: '(?=$|\\n)',
    };
    ret.reg = compileRegExp(ret, 'g', true);
    return ret;
  }
}
