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

export default class EChartsCodeBlockEngine {
  static install(cherryOptions, ...args) {
    if (typeof window === 'undefined' || typeof window.echarts === 'undefined') {
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
        echarts: window.echarts,
      },
    });
  }

  constructor(echartsOptions = {}) {
    const { echarts, size } = echartsOptions;
    if (!echarts && !window.echarts) {
      throw new Error('codeblock-echarts-plugin[init]: Package echarts not found.');
    }
    this.size = size;
    this.echartsRef = echarts || window.echarts; // echarts引用
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
      const option = JSON5.parse(src.replace(/;\s*$/, ''));
      containers.forEach((container) => {
        try {
          // 判断是否已经初始化
          let chart = this.echartsRef.getInstanceByDom(container);
          if (!chart) {
            chart = this.echartsRef.init(container);
          }
          chart.setOption(option, true); // 增加 true 参数以强制覆盖旧配置
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
