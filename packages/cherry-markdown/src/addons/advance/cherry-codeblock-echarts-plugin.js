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
import JSON5 from 'json5';
import { getExternal } from '@/utils/external';
import { generateContainerId, createErrorElement } from '@/utils/async-render-pipeline';

export default class EChartsCodeBlockEngine {
  static install(cherryOptions, ...args) {
    const globalEcharts = /** @type {import('echarts').ECharts | undefined} */ (getExternal('echarts'));
    if (!globalEcharts) {
      return;
    }
    mergeWith(cherryOptions, {
      engine: {
        syntax: {
          codeBlock: {
            customRenderer: {
              echarts: new EChartsCodeBlockEngine(...args),
            },
          },
        },
      },
      externals: {
        echarts: globalEcharts,
      },
    });
  }

  constructor(echartsOptions = {}) {
    const { echarts } = echartsOptions;
    const globalEcharts = /** @type {import('echarts').ECharts | undefined} */ (getExternal('echarts'));
    const resolvedEcharts = echarts || globalEcharts;
    if (!resolvedEcharts) {
      throw new Error('codeblock-echarts-plugin[init]: Package echarts not found.');
    }
    this.size = echartsOptions.size;
    this.echartsRef = resolvedEcharts; // echarts引用
  }

  /**
   * 解析 ECharts option 字符串。
   * 优先使用 new Function 执行 JS 对象字面量（支持函数、正则等 JS 语法），
   * 失败后 fallback 到 JSON5.parse（仅支持纯数据）。
   * @param {string} src 代码块源码
   * @returns {object} 解析后的 ECharts option 对象
   */
  parseOption(src) {
    const trimmed = src.replace(/;\s*$/, '').trim();
    // 优先尝试 new Function，支持 function、箭头函数、正则等 JS 语法
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${trimmed})`);
      const result = fn();
      if (result && typeof result === 'object') {
        return result;
      }
    } catch (e) {
      // JS 执行失败，继续尝试 JSON5
    }
    // fallback: JSON5 解析纯数据格式
    return JSON5.parse(trimmed);
  }

  render(src, sign, $engine, language) {
    if (src.trim().length <= 0) return '';
    const width = this.size?.width || '100%';
    const height = this.size?.height || '300px';
    const styleStr = `width: ${width}; height: ${height};`;

    // 生成唯一 ID，用于 pipeline 查找容器
    const containerId = generateContainerId('echarts-cb');

    // 预解析 option（在 render 阶段，上下文完整）
    let option = {};
    try {
      option = this.parseOption(src);
    } catch (e) {
      const safeMsg = String(e.message).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<div style="${styleStr}" class="cherry-echarts-codeblock-wrapper"><div style="color: red;">Parse Error: ${safeMsg}</div></div>`;
    }

    // 将渲染任务推入异步管线队列
    const CherryCtor = /** @type {typeof import('../../CherryStatic').CherryStatic} */ ($engine.$cherry.constructor);
    const pipeline = CherryCtor.asyncRenderPipeline;
    if (pipeline) {
      const { echartsRef } = this;
      const flowMode = !!$engine.$cherry.options?.engine?.global?.flowSessionContext;
      pipeline.enqueue({
        containerId,
        instanceId: $engine.$cherry.instanceId,
        execute(container) {
          if (!echartsRef) return;
          try {
            let chart = echartsRef.getInstanceByDom(container);
            if (!chart) {
              chart = echartsRef.init(container);
            }
            chart.setOption(option, true);
          } catch (error) {
            if (flowMode) {
              container.innerHTML = 'drawing...';
            } else {
              container.innerHTML = '';
              container.appendChild(createErrorElement(error.message));
            }
          }
        },
        priority: 20,
      });
    }

    return `<div style="${styleStr}" class="cherry-echarts-codeblock-wrapper" id="${containerId}"></div>`;
  }
}
