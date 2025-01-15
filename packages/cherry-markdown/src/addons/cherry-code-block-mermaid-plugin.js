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
import mergeWith from 'lodash/mergeWith';

const DEFAULT_OPTIONS = {
  // TODO: themes
  theme: 'default',
  altFontFamily: 'sans-serif',
  fontFamily: 'sans-serif',
  themeCSS: '.label foreignObject { font-size: 90%; overflow: visible; } .label { font-family: sans-serif; }',
  flowchart: {
    useMaxWidth: false,
  },
  sequence: {
    useMaxWidth: false,
  },
  startOnLoad: false,
  logLevel: 5,
  // fontFamily: 'Arial, monospace'
};

export default class MermaidCodeEngine {
  static TYPE = 'figure';

  static install(cherryOptions, ...args) {
    mergeWith(cherryOptions, {
      engine: {
        syntax: {
          codeBlock: {
            customRenderer: {
              mermaid: new MermaidCodeEngine(...args),
            },
          },
        },
      },
    });
  }

  mermaidAPIRefs = null;
  options = DEFAULT_OPTIONS;
  dom = null;
  mermaidCanvas = null;

  constructor(mermaidOptions = {}) {
    const { mermaid, mermaidAPI } = mermaidOptions;
    if (
      !mermaidAPI &&
      !window.mermaidAPI &&
      (!mermaid || !mermaid.mermaidAPI) &&
      (!window.mermaid || !window.mermaid.mermaidAPI)
    ) {
      throw new Error('code-block-mermaid-plugin[init]: Package mermaid or mermaidAPI not found.');
    }
    this.options = { ...DEFAULT_OPTIONS, ...(mermaidOptions || {}) };
    this.mermaidAPIRefs = mermaidAPI || window.mermaidAPI || mermaid.mermaidAPI || window.mermaid.mermaidAPI;
    delete this.options.mermaid;
    delete this.options.mermaidAPI;
    this.mermaidAPIRefs.initialize(this.options);
  }

  mountMermaidCanvas($engine) {
    if (this.mermaidCanvas && document.body.contains(this.mermaidCanvas)) {
      return;
    }
    this.mermaidCanvas = document.createElement('div');
    this.mermaidCanvas.style = 'width:1024px;opacity:0;position:fixed;top:100%;';
    const container = $engine.$cherry.wrapperDom || document.body;
    container.appendChild(this.mermaidCanvas);
  }

  /**
   * 转换svg为img，如果出错则直出svg
   * @param {string} svgCode
   * @param {string} graphId
   * @returns {string}
   */
  convertMermaidSvgToImg(svgCode, graphId) {
    const domParser = new DOMParser();
    let svgHtml;
    const injectSvgFallback = (svg) =>
      svg.replace('<svg ', '<svg style="max-width:100%;height:auto;font-family:sans-serif;" ');
    try {
      const svgDoc = /** @type {XMLDocument} */ (domParser.parseFromString(svgCode, 'image/svg+xml'));
      const svgDom = /** @type {SVGSVGElement} */ (/** @type {any} */ (svgDoc.documentElement));
      // tagName不是svg时，说明存在parse error
      if (svgDom.tagName.toLowerCase() === 'svg') {
        svgDom.style.maxWidth = '100%';
        svgDom.style.height = 'auto';
        svgDom.style.fontFamily = 'sans-serif';
        const shadowSvg = /** @type {SVGSVGElement} */ (/** @type {any} */ (document.getElementById(graphId)));
        let svgBox = shadowSvg.getBBox();
        if (!svgDom.hasAttribute('viewBox')) {
          svgDom.setAttribute('viewBox', `0 0 ${svgBox.width} ${svgBox.height}`);
        } else {
          svgBox = svgDom.viewBox.baseVal;
        }
        svgDom.getAttribute('width') === '100%' && svgDom.setAttribute('width', `${svgBox.width}`);
        svgDom.getAttribute('height') === '100%' && svgDom.setAttribute('height', `${svgBox.height}`);
        // fix end
        svgHtml = svgDoc.documentElement.outerHTML;
        // 屏蔽转img标签功能，如需要转换为img解除屏蔽即可
        if (this.svg2img) {
          const dataUrl = `data:image/svg+xml,${encodeURIComponent(svgDoc.documentElement.outerHTML)}`;
          svgHtml = `<img class="svg-img" src="${dataUrl}" alt="${graphId}" />`;
        }
      } else {
        svgHtml = injectSvgFallback(svgCode);
      }
    } catch (e) {
      svgHtml = injectSvgFallback(svgCode);
    }
    return svgHtml;
  }

  render(src, sign, $engine, config = {}) {
    let $sign = sign;
    if (!$sign) {
      $sign = Math.round(Math.random() * 100000000);
    }
    this.mountMermaidCanvas($engine);
    let html;
    // 多实例的情况下相同的内容ID相同会导致mermaid渲染异常
    // 需要通过添加时间戳使得多次渲染相同内容的图像ID唯一
    // 图像渲染节流在CodeBlock Hook内部控制
    const graphId = `mermaid-${$sign}-${new Date().getTime()}`;
    this.svg2img = config?.svg2img ?? false;
    try {
      this.mermaidAPIRefs.render(
        graphId,
        src,
        (svgCode) => {
          const fixedSvg = svgCode
            .replace(/\s*markerUnits="0"/g, '')
            .replace(/\s*x="NaN"/g, '')
            .replace(/<br>/g, '<br/>');
          html = this.convertMermaidSvgToImg(fixedSvg, graphId);
        },
        this.mermaidCanvas,
      );
    } catch (e) {
      return e?.str;
    }
    return html;
  }
}
