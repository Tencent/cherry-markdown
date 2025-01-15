/**
 * Tencent is pleased to support the open source community by making CherryMarkdown available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company. All rights reserved.
 * The below software in this distribution may have been modified by THL A29 Limited ("Tencent Modifications").
 *
 * All Tencent Modifications are Copyright (C) THL A29 Limited.
 *
 * CherryMarkdown is licensed under the Apache License, Version 2.0 (the "License");
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
  renderer: 'svg',
  width: 500,
  height: 300,
};

export default class EChartsTableEngine {
  static install(cherryOptions, ...args) {
    if (typeof window === 'undefined') {
      console.warn('echarts-table-engine only works in browser.');
      mergeWith(cherryOptions, {
        engine: {
          syntax: {
            table: {
              enableChart: false,
            },
          },
        },
      });
      return;
    }
    mergeWith(cherryOptions, {
      engine: {
        syntax: {
          table: {
            enableChart: true,
            chartRenderEngine: EChartsTableEngine,
            externals: ['echarts'],
          },
        },
      },
    });
  }

  constructor(echartsOptions = {}) {
    const { echarts, ...options } = echartsOptions;
    if (!echarts && !window.echarts) {
      throw new Error('table-echarts-plugin[init]: Package echarts not found.');
    }
    this.options = { ...DEFAULT_OPTIONS, ...(options || {}) };
    this.echartsRef = echarts || window.echarts; // echarts引用
    this.dom = null;
  }

  getInstance() {
    if (!this.dom) {
      this.dom = document.createElement('div');
      this.echartsRef.init(this.dom, null, this.options);
    }
    return this.echartsRef.getInstanceByDom(this.dom);
  }

  render(type, options, tableObject) {
    // console.log(type, options, tableObject);
    let chartOption = {};
    switch (type) {
      case 'bar':
        chartOption = this.renderBarChart(tableObject, options);
        break;
      case 'line':
        chartOption = this.renderLineChart(tableObject, options);
        break;
      default:
        return '';
    }
    const eChartInstance = this.getInstance();
    eChartInstance.clear();
    eChartInstance.setOption(chartOption);
    return eChartInstance.getDom().innerHTML;
  }

  renderBarChart(tableObject, options) {
    return this.$renderChartCommon(tableObject, options, 'bar');
  }

  renderLineChart(tableObject, options) {
    return this.$renderChartCommon(tableObject, options, 'line');
  }

  $renderChartCommon(tableObject, options, type) {
    // TODO: 通过options反转xy轴
    const baseSeries = {
      bar: {
        type: 'bar',
        barWidth: 20,
        animation: false,
        name: '',
        data: [],
      },
      line: {
        type: 'line',
        animation: false,
        name: '',
        data: [],
      },
    };
    if (!baseSeries[type]) {
      return;
    }
    const dataSet = tableObject.rows.reduce(
      (result, row) => {
        // legend
        result.legend.data.push(row[0]);
        // series
        result.series.push({
          ...baseSeries[type],
          name: row[0],
          data: row.slice(1).map((data) => {
            const num = Number.parseFloat(data.replace(/,/g, ''));
            return num;
          }),
        });
        return result;
      },
      {
        legend: { data: [] },
        series: [],
      },
    );
    const chartOptions = {
      ...dataSet,
      xAxis: {
        data: tableObject.header.slice(1),
        type: 'category',
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          width: '100%',
        },
      },
      grid: {
        containLabel: true,
        left: '1%',
        right: '1%',
        bottom: '10%',
      },
    };
    return chartOptions;
  }

  onDestroy() {
    if (!this.dom) {
      return;
    }
    this.echartsRef.dispose(this.dom);
  }
}
