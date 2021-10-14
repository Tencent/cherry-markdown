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

  toHtml(wholeMatch, m1) {
    LoadMathModule.bind(this)('engine');
    const sign = this.$engine.md5(wholeMatch);
    const linesArr = m1.match(/\n/g);
    const lines = linesArr ? linesArr.length + 2 : 2;

    if (this.engine === 'katex') {
      // katex渲染
      const html = this.katex.renderToString(m1, {
        throwOnError: false,
        displayMode: true,
      });
      const result = `<div data-sign="${sign}" class="Cherry-Math" data-type="mathBlock"
            data-lines="${lines}">${html}</div>`;
      return this.pushCache(result, sign);
    }
    if (this.MathJax?.tex2svg) {
      // MathJax渲染
      const svg = getHTML(this.MathJax.tex2svg(m1), true);
      const result = `<div data-sign="${sign}" class="Cherry-Math" data-type="mathBlock"
            data-lines="${lines}">${svg}</div>`;
      return this.pushCache(result, sign);
    }

    // 既无MathJax又无katex时，原样输出
    const result = `<div data-sign="${sign}" class="Cherry-Math" data-type="mathBlock"
          data-lines="${lines}">$$${escapeFormulaPunctuations(m1)}$$</div>`;
    return this.pushCache(result, sign);
  }

  beforeMakeHtml(str) {
    let $str = str;
    if (this.test($str)) {
      $str = $str.replace(this.RULE.reg, this.toHtml.bind(this));
    }
    return $str;
  }

  makeHtml(str) {
    return str;
  }

  rule() {
    const ret = { begin: '~D~D\\s*', end: '\\s*~D~D', content: '([\\w\\W]*?)' };
    ret.reg = new RegExp(ret.begin + ret.content + ret.end, 'g');
    return ret;
  }
}
