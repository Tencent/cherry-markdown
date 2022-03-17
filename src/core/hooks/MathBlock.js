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
import { escapeFormulaPunctuations, LoadMathModule } from '@/utils/mathjax';
import { getHTML } from '@/utils/dom';
import { isBrowser } from '@/utils/env';
import { isLookbehindSupported } from '@/utils/regexp';
import { replaceLookbehind } from '@/utils/lookbehind-replace';

export default class MathBlock extends ParagraphBase {
  static HOOK_NAME = 'mathBlock';
  /**
   * 块级公式语法
   * 该语法具有排他性，并且需要优先其他段落级语法进行渲染
   * @type {'katex' | 'MathJax' | 'node'}
   */
  engine = 'MathJax'; // 渲染引擎，默认为MathJax，MathJax支持2.x与3.x版本
  katex;
  MathJax;

  constructor({ config }) {
    super({ needCache: true });
    // 非浏览器环境下配置为 node
    this.engine = isBrowser() ? config.engine ?? 'MathJax' : 'node';
  }

  toHtml(wholeMatch, lineSpace, leadingChar, content) {
    LoadMathModule.bind(this)('engine');
    // 去掉开头的空字符，去掉结尾的换行符
    const wholeMatchWithoutSpace = wholeMatch.replace(/^[ \f\r\t\v]*/, '').replace(/\s*$/, '');
    // 去掉匹配到的第一个换行符
    const lineSpaceWithoutPreSpace = lineSpace.replace(/^[ \f\r\t\v]*\n/, '');
    const sign = this.$engine.md5(wholeMatch);
    let lines = this.getLineCount(wholeMatchWithoutSpace, lineSpaceWithoutPreSpace);
    // 判断公式是不是新行输入，如果不是新行，则行号减1
    if (!/\n/.test(lineSpace)) {
      lines -= 1;
    }
    // 判断公式后面有没有尾接内容，如果尾接了内容，则行号减1
    if (!/\n\s*$/.test(wholeMatch)) {
      lines -= 1;
    }
    // 目前的机制还没有测过lines为负数的情况，先不处理
    lines = lines > 0 ? lines : 0;

    if (this.engine === 'katex') {
      // katex渲染
      const html = this.katex.renderToString(content, {
        throwOnError: false,
        displayMode: true,
      });
      const result = `<div data-sign="${sign}" class="Cherry-Math" data-type="mathBlock"
            data-lines="${lines}">${html}</div>`;
      return leadingChar + this.getCacheWithSpace(this.pushCache(result, sign, lines), wholeMatch);
    }
    if (this.MathJax?.tex2svg) {
      // MathJax渲染
      const svg = getHTML(this.MathJax.tex2svg(content), true);
      const result = `<div data-sign="${sign}" class="Cherry-Math" data-type="mathBlock"
            data-lines="${lines}">${svg}</div>`;
      return leadingChar + this.getCacheWithSpace(this.pushCache(result, sign, lines), wholeMatch);
    }

    // 既无MathJax又无katex时，原样输出
    const result = `<div data-sign="${sign}" class="Cherry-Math" data-type="mathBlock"
          data-lines="${lines}">$$${escapeFormulaPunctuations(content)}$$</div>`;
    return leadingChar + this.getCacheWithSpace(this.pushCache(result, sign, lines), wholeMatch);
  }

  beforeMakeHtml(str) {
    if (isLookbehindSupported()) {
      return str.replace(this.RULE.reg, this.toHtml.bind(this));
    }
    return replaceLookbehind(str, this.RULE.reg, this.toHtml.bind(this), true, 1);
  }

  makeHtml(str) {
    return str;
  }

  rule() {
    const ret = {
      begin: isLookbehindSupported() ? '(\\s*)((?<!\\\\))~D~D\\s*' : '(\\s*)(^|[^\\\\])~D~D\\s*',
      content: '([\\w\\W]*?)',
      end: '(\\s*)~D~D(?:\\s{0,1})',
    };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
