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
    this.enableJs = echartsOptions.enableJs ?? false;
    this.echartsRef = resolvedEcharts; // echarts引用
    this.srcCache = new Map();
  }

  /**
   * 解析 ECharts option 字符串。
   * 优先使用 JSON5.parse（仅支持纯数据）。
   * 失败后 fallback 到 new Function 执行 JS 对象字面量（支持函数、正则等 JS 语法），
   * @param {string} src 代码块源码
   * @returns {object} 解析后的 ECharts option 对象
   */
  parseOption(src) {
    const trimmed = src.replace(/;\s*$/, '').trim();
    if (this.enableJs !== true) {
      return JSON5.parse(trimmed);
    }
    try {
      return JSON5.parse(trimmed);
    } catch (e) {
      // eslint-disable-next-line no-new-func
      const fn = new Function(`return (${trimmed})`);
      const result = fn();
      if (result && typeof result === 'object') {
        return result;
      }
      throw e;
    }
  }

  render(src, sign, $engine, language) {
    if (src.trim().length <= 0) return '';
    const width = this.size?.width || '100%';
    const height = this.size?.height || '300px';
    const styleStr = `width: ${width}; height: ${height};`;
    const previewerDom = $engine.$cherry.previewer.getDom();
    // 延迟到下一轮事件循环再执行
    setTimeout(() => {
      const containers = previewerDom.querySelectorAll(
        `div[data-sign="${sign}"][data-type="echarts"] .cherry-echarts-codeblock-wrapper`,
      );
      if (containers.length <= 0 || !this.echartsRef) return;
      containers.forEach((container) => {
        try {
          const option = this.parseOption(src);
          // 判断是否已经初始化
          let chart = this.echartsRef.getInstanceByDom(container);
          const isNewChart = !chart;
          if (isNewChart) {
            chart = this.echartsRef.init(container);
          }
          // 如果图表已存在且 sign 未变，跳过 setOption，避免动画被重置
          if (!isNewChart && this.srcCache.has(sign)) {
            return; // src 没有变化，跳过重绘
          }
          chart.setOption(option, true); // 增加 true 参数以强制覆盖旧配置
          // 记录当前 sign，用于下次判断内容是否变化
          this.srcCache.set(sign, 1);
        } catch (error) {
          if ($engine.$cherry.options.engine.global.flowSessionContext) {
            container.innerHTML = `drawing...`;
          } else {
            container.innerHTML = `<div style="color: red;">Render Error: ${error.message}</div>`;
          }
        }
      });
    }, 50);
    return `<div style="${styleStr}" class="cherry-echarts-codeblock-wrapper"></div>`;
  }
}
