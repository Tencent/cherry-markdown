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
import mergeWith from 'lodash/mergeWith';
import { isBrowser } from '@/utils/env';

const CHART_TYPES = [
  'flowchart',
  'sequence',
  'gantt',
  'journey',
  'timeline',
  'class',
  'state',
  'er',
  'pie',
  'quadrantChart',
  'xyChart',
  'requirement',
  'architecture',
  'mindmap',
  'kanban',
  'gitGraph',
  'c4',
  'sankey',
  'packet',
  'block',
  'radar',
];

const DEFAULT_OPTIONS = {
  // TODO: themes
  theme: 'default',
  altFontFamily: 'sans-serif',
  fontFamily: 'sans-serif',
  themeCSS: '.label foreignObject { font-size: 90%; overflow: visible; } .label { font-family: sans-serif; }',
  startOnLoad: false,
  logLevel: 5,
  // fontFamily: 'Arial, monospace'
};

CHART_TYPES.forEach((type) => {
  DEFAULT_OPTIONS[type] = {
    useMaxWidth: false,
  };
});
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

  /**
   * @param {Object} mermaidOptions - Mermaid 配置选项
   * @param {Object} [mermaidOptions.mermaid] - mermaid 实例对象，如果未提供会尝试从 window.mermaid 获取
   * @param {Object} [mermaidOptions.mermaidAPI] - mermaidAPI 实例对象，如果未提供会尝试从 window.mermaidAPI 获取
   * @param {string} [mermaidOptions.theme='default'] - 主题，可选值: 'default', 'dark', 'forest', 'neutral' 等
   * @param {string} [mermaidOptions.altFontFamily='sans-serif'] - 备用字体
   * @param {string} [mermaidOptions.fontFamily='sans-serif'] - 主字体
   * @param {string} [mermaidOptions.themeCSS] - 自定义主题 CSS 样式
   * @param {boolean} [mermaidOptions.startOnLoad=false] - 是否在页面加载时自动渲染
   * @param {number} [mermaidOptions.logLevel=5] - 日志级别，1-5，5 为最详细
   * @param {HTMLElement} [mermaidOptions.mermaidCanvasAppendDom] - Mermaid 临时画布容器的挂载节点
   * @param {Object} [mermaidOptions.flowchart] - 流程图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.sequence] - 序列图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.gantt] - 甘特图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.journey] - 用户旅程图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.timeline] - 时间线图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.class] - 类图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.state] - 状态图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.er] - ER 图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.pie] - 饼图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.quadrantChart] - 象限图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.xyChart] - XY 图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.requirement] - 需求图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.architecture] - 架构图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.mindmap] - 思维导图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.kanban] - 看板图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.gitGraph] - Git 图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.c4] - C4 图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.sankey] - 桑基图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.packet] - 数据包图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.block] - 块图配置，可设置 { useMaxWidth: false } 等
   * @param {Object} [mermaidOptions.radar] - 雷达图配置，可设置 { useMaxWidth: false } 等
   */
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
    if (this.isAsyncRenderVersion()) {
      // 异步渲染时，只有 mermaid.render 有队列优化，使用 mermaidAPI 会导致渲染出错
      this.mermaidAPIRefs = mermaid || window.mermaid || this.mermaidAPIRefs;
    }
    delete this.options.mermaid;
    delete this.options.mermaidAPI;
    this.mermaidAPIRefs.initialize(this.options);
  }

  // v10 以上开始，render 变为异步渲染，render 函数的参数数量从 4 变为 3
  isAsyncRenderVersion() {
    return this.mermaidAPIRefs.render.length === 3;
  }

  mountMermaidCanvas($engine) {
    if (this.mermaidCanvas && document.body.contains(this.mermaidCanvas)) {
      return;
    }
    this.mermaidCanvas = document.createElement('div');
    this.mermaidCanvas.style = 'width:1024px;opacity:0;position:fixed;top:100%;';
    const container = this.options.mermaidCanvasAppendDom || $engine.$cherry.wrapperDom || document.body;
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

  processSvgCode(svgCode, graphId) {
    const fixedSvg = svgCode
      .replace(/\s*markerUnits="0"/g, '')
      .replace(/\s*x="NaN"/g, '')
      .replace(/<br>/g, '<br/>');
    const html = this.convertMermaidSvgToImg(fixedSvg, graphId);
    return html;
  }

  syncRender(graphId, src, sign, $engine) {
    let html;
    try {
      this.mermaidAPIRefs.render(
        graphId,
        src,
        (svgCode) => {
          html = this.processSvgCode(svgCode, graphId);
        },
        this.mermaidCanvas,
      );
    } catch (e) {
      return e?.str;
    }
    return html;
  }

  handleAsyncRenderDone(graphId, sign, $engine, props, html) {
    props.updateCache(html);
    const container = $engine.$cherry.wrapperDom || document.body;
    if (isBrowser()) {
      const placeholderList = container.querySelectorAll(`[data-sign="${sign}"][data-type="codeBlock"]`);
      placeholderList?.forEach((placeholder) => {
        placeholder.parentElement.innerHTML = html;
      });
    }
    $engine.asyncRenderHandler.done(graphId, {
      replacer: (md) => {
        const regex = new RegExp(`<div data-sign="${sign}" data-type="codeBlock"[^>]*>.*?<\\/div>`, 'g');
        return md.replace(regex, html);
      },
    });
  }

  asyncRender(graphId, src, sign, $engine, props) {
    $engine.asyncRenderHandler.add(graphId);
    this.mermaidAPIRefs
      .render(graphId, src, this.mermaidCanvas)
      .then(({ svg: svgCode }) => {
        // 渲染完成后，替换为渲染结果
        const html = this.processSvgCode(svgCode, graphId);
        this.handleAsyncRenderDone(graphId, sign, $engine, props, html);
      })
      .catch(() => {
        // 如果开启了流式渲染，则不需要回退
        if ($engine.options.global.flowSessionContext) {
          return props.fallback();
        }
        // 渲染失败后，回退到源码
        const html = props.fallback();
        this.handleAsyncRenderDone(graphId, sign, $engine, props, html);
      });
    // 先渲染源码
    return props.fallback();
  }

  render(src, sign, $engine, props = {}) {
    let $sign = sign;
    if (!$sign) {
      $sign = Math.round(Math.random() * 100000000);
    }
    this.mountMermaidCanvas($engine);
    // 多实例的情况下相同的内容ID相同会导致mermaid渲染异常
    // 需要通过添加时间戳使得多次渲染相同内容的图像ID唯一
    // 图像渲染节流在CodeBlock Hook内部控制
    const graphId = `mermaid-${sign}-${new Date().getTime()}`;
    this.svg2img = props.mermaidConfig?.svg2img ?? false;
    return this.isAsyncRenderVersion()
      ? this.asyncRender(graphId, src, $sign, $engine, props)
      : this.syncRender(graphId, src, $sign, $engine);
  }
}
