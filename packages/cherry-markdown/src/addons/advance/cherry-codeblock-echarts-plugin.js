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
   * 解析 ECharts option 字符串（纯 JSON5）。
   *
   * 支持 JSON5 宽松语法：注释、尾逗号、无引号 key、单引号字符串等，
   * 覆盖绝大多数 ECharts 配置场景。
   *
   * 不支持 JS 函数语法（如 `formatter: (params) => ...`），
   * 请使用 ECharts 内置的字符串模板替代，例如：
   *   - `formatter: '{b}: {c}%'`
   *   - `axisLabel: { formatter: '{value} 万元' }`
   *
   * @see https://echarts.apache.org/zh/option.html#tooltip.formatter
   * @param {string} src 代码块源码
   * @returns {object} 解析后的 ECharts option 对象
   */
  parseOption(src) {
    const trimmed = src.replace(/;\s*$/, '').trim();
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
      const safeMsg = String(e.message)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
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
