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

const chartRenderConfig = { renderer: 'svg', width: 500, height: 300 };
export default class TableChartCodeEngine {
  static install(cherryOptions) {
    if ('undefined' === typeof window) {
      return (
        console.warn('echarts-table-engine only works in browser.'),
        void mergeWith(cherryOptions, {
          engine: { syntax: { table: { enableChart: false } } },
        })
      );
    }
    mergeWith(cherryOptions, {
      engine: {
        syntax: {
          table: {
            enableChart: true,
            chartRenderEngine: TableChartCodeEngine,
            externals: ['echarts'],
          },
        },
      },
    });
  }

  constructor(tableChartOptions = {}) {
    const { echarts, ...rest } = tableChartOptions;
    if (!echarts && !window.echarts) throw new Error('table-echarts-plugin[init]: Package echarts not found.');
    this.options = { ...chartRenderConfig, ...(rest || {}) };
    this.echartsRef = echarts || window.echarts;
    this.dom = null;
  }

  getInstance() {
    return (
      this.dom || ((this.dom = document.createElement('div')), this.echartsRef.init(this.dom, null, this.options)),
      this.echartsRef.getInstanceByDom(this.dom)
    );
  }

  render(src, sign, dataLines) {
    let echartsOption = {};
    switch (src) {
      case 'bar':
        echartsOption = this.renderBarChart(dataLines, sign);
        break;
      case 'line':
        echartsOption = this.renderLineChart(dataLines, sign);
        break;
      default:
        return '';
    }
    const domInstance = this.getInstance();
    return domInstance.clear(), domInstance.setOption(echartsOption), domInstance.getDom().innerHTML;
  }

  renderBarChart(dataLines, sign) {
    return this.$renderChartCommon(dataLines, sign, 'bar');
  }

  renderLineChart(dataLines, sign) {
    return this.$renderChartCommon(dataLines, sign, 'line');
  }

  $renderChartCommon(dataLines, sign, type) {
    const echartDefaultConfigs = {
      bar: {
        type: 'bar',
        barWidth: 20,
        animation: false,
        name: '',
        data: [],
      },
      line: { type: 'line', animation: false, name: '', data: [] },
    };
    if (echartDefaultConfigs[type]) {
      const chartFormatData = dataLines.rows.reduce(
        function (table, row) {
          return (
            table.legend.data.push(row[0]),
            table.series.push({
              ...echartDefaultConfigs[type],
              ...{
                name: row[0],
                data: row.slice(1).map(function (t) {
                  return Number.parseFloat(t.replace(/,/g, ''));
                }),
              },
            }),
            table
          );
        },
        { legend: { data: [] }, series: [] },
      );
      return {
        ...chartFormatData,
        ...{
          xAxis: {
            data: dataLines.header.slice(1),
            type: 'category',
          },
          yAxis: { type: 'value', axisLabel: { width: '100%' } },
          grid: {
            containLabel: true,
            left: '1%',
            right: '1%',
            bottom: '10%',
          },
        },
      };
    }
  }

  onDestroy() {
    this.dom && this.echartsRef.dispose(this.dom);
  }
}
