/**
 * Tencent is pleased to support the open source community by making CherryMarkdown available.
 *
 * Copyright (C) 2021 Tencent. All rights reserved.
 * The below software in this distribution may have been modified by Tencent ("Tencent Modifications").
 *
 * All Tencent Modifications are Copyright (C) Tencent.
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
      // 设置必要的样式和属性确保图表可见
      this.dom.style.width = `${this.options.width}px`;
      this.dom.style.height = `${this.options.height}px`;
      this.dom.style.minHeight = '300px';
      this.dom.style.display = 'block';
      this.dom.style.position = 'relative';

      const chart = this.echartsRef.init(this.dom, null, this.options);
      // 监听窗口resize事件
      window.addEventListener('resize', () => {
        chart.resize();
      });
    }
    return this.echartsRef.getInstanceByDom(this.dom);
  }

  render(type, options, tableObject) {
    console.log('Rendering chart:', type, options, tableObject);
    let chartOption = {};
    switch (type) {
      case 'bar':
        chartOption = this.renderBarChart(tableObject, options);
        break;
      case 'line':
        chartOption = this.renderLineChart(tableObject, options);
        break;
      case 'radar':
        chartOption = this.renderRadarChart(tableObject, options);
        break;
      default:
        return '';
    }
    console.log('Chart options:', chartOption);

    // 生成唯一ID和简化的配置数据
    const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 创建一个包含所有必要信息的HTML结构
    const htmlContent = `
      <div class="cherry-echarts-wrapper" 
           style="width: ${this.options.width}px; height: ${this.options.height}px; min-height: 300px; display: block; position: relative; border: 1px solid #ddd;" 
           id="${chartId}">
        <div class="chart-loading" style="text-align: center; line-height: 300px; color: #666;">正在加载图表...</div>
      </div>
    `;

    // 在DOM插入后立即初始化图表
    setTimeout(() => {
      const container = document.getElementById(chartId);
      if (container && typeof this.echartsRef !== 'undefined') {
        try {
          console.log('Initializing chart in container:', chartId);
          const chart = this.echartsRef.init(container, null, {
            renderer: 'svg',
            width: this.options.width,
            height: this.options.height,
          });
          chart.setOption(chartOption);
          console.log('Chart initialized successfully:', chartId);

          // 移除加载提示
          const loading = container.querySelector('.chart-loading');
          if (loading) {
            loading.remove();
          }
        } catch (error) {
          console.error('Chart initialization failed:', error);
          if (container) {
            container.innerHTML = '<div style="text-align: center; line-height: 300px; color: red;">图表渲染失败</div>';
          }
        }
      } else {
        console.warn('Chart container or echarts not found:', chartId, !!this.echartsRef);
      }
    }, 50);

    return htmlContent;
  }

  renderBarChart(tableObject, options) {
    return this.$renderChartCommon(tableObject, options, 'bar');
  }

  renderLineChart(tableObject, options) {
    return this.$renderChartCommon(tableObject, options, 'line');
  }

  renderRadarChart(tableObject, options) {
    return this.$renderRadarChartCommon(tableObject, options);
  }

  $renderRadarChartCommon(tableObject, options) {
    console.log('Rendering radar chart:', tableObject);

    // 构建雷达图指标
    const indicator = tableObject.header.slice(1).map((header) => {
      const maxValue = Math.max(
        ...tableObject.rows.map((row) => {
          const index = tableObject.header.indexOf(header);
          const value = parseFloat(row[index].replace(/,/g, '')) || 0;
          return value;
        }),
      );
      return {
        name: header,
        max: Math.ceil(maxValue * 1.2), // 设置最大值为数据最大值的1.2倍，向上取整
      };
    });

    const seriesData = tableObject.rows.map((row, index) => ({
      name: row[0],
      value: row.slice(1).map((data) => parseFloat(data.replace(/,/g, '')) || 0),
      areaStyle: {
        opacity: 0.1 + index * 0.05, // 每个系列有不同的透明度
      },
      lineStyle: {
        width: 2,
      },
      itemStyle: {
        borderWidth: 2,
      },
    }));

    console.log('Radar indicator:', indicator);
    console.log('Radar seriesData:', seriesData);

    const chartOptions = {
      backgroundColor: '#fff',
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#999',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12,
        },
        formatter(params) {
          let result = `<div style="margin-bottom:4px;font-weight:bold;">${params.name}</div>`;
          params.value.forEach(function (value, index) {
            result += '<div style="margin:2px 0;">';
            result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params.color};"></span>`;
            result += `<span style="font-weight:bold;">${indicator[index].name}</span>`;
            result += `<span style="float:right;margin-left:20px;font-weight:bold;">${value}</span>`;
            result += '</div>';
          });
          return result;
        },
        extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-radius: 4px;',
      },
      legend: {
        data: tableObject.rows.map((row) => row[0]),
        orient: 'horizontal',
        left: 'center',
        top: 'bottom',
        textStyle: {
          fontSize: 12,
        },
        itemWidth: 12,
        itemHeight: 12,
        selectedMode: 'multiple',
        selector: [
          {
            type: 'all',
            title: '全选',
          },
          {
            type: 'inverse',
            title: '反选',
          },
        ],
      },
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        feature: {
          dataView: {
            show: true,
            readOnly: false,
            title: '数据视图',
            lang: ['数据视图', '关闭', '刷新'],
          },
          restore: { show: true, title: '重置' },
          saveAsImage: {
            show: true,
            title: '保存为图片',
            type: 'png',
            backgroundColor: '#fff',
          },
        },
        iconStyle: {
          borderColor: '#999',
        },
        emphasis: {
          iconStyle: {
            borderColor: '#666',
          },
        },
      },
      radar: {
        name: {
          textStyle: {
            color: '#333',
            fontSize: 12,
            fontWeight: 'bold',
          },
          formatter(name) {
            return name.length > 6 ? `${name.substr(0, 6)}...` : name;
          },
        },
        indicator,
        radius: '60%',
        center: ['50%', '50%'],
        splitNumber: 5,
        shape: 'polygon',
        splitArea: {
          areaStyle: {
            color: [
              'rgba(114, 172, 209, 0.2)',
              'rgba(114, 172, 209, 0.4)',
              'rgba(114, 172, 209, 0.6)',
              'rgba(114, 172, 209, 0.8)',
              'rgba(114, 172, 209, 1)',
            ].reverse(),
          },
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(211, 253, 250, 0.8)',
          },
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(211, 253, 250, 0.8)',
          },
        },
      },
      series: [
        {
          name: '雷达图数据',
          type: 'radar',
          data: seriesData,
          emphasis: {
            lineStyle: {
              width: 4,
            },
            areaStyle: {
              opacity: 0.3,
            },
          },
          animation: true,
          animationDuration: 1000,
          animationEasing: 'elasticOut',
        },
      ],
      graphic: {
        elements: [
          {
            type: 'text',
            left: 'center',
            top: '5%',
            style: {
              text: '雷达图分析',
              fontSize: 16,
              fontWeight: 'bold',
              fill: '#333',
            },
          },
        ],
      },
    };
    return chartOptions;
  }

  $renderChartCommon(tableObject, options, type) {
    console.log('Common chart rendering:', type, tableObject);

    const baseSeries = {
      bar: {
        type: 'bar',
        barWidth: '60%',
        animation: true,
        animationDuration: 1000,
        animationEasing: 'elasticOut',
        animationDelay(idx) {
          return idx * 10;
        },
        name: '',
        data: [],
        emphasis: {
          focus: 'series',
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        label: {
          show: false,
          position: 'top',
          formatter: '{c}',
        },
      },
      line: {
        type: 'line',
        animation: true,
        animationDuration: 1000,
        animationEasing: 'elasticOut',
        animationDelay(idx) {
          return idx * 10;
        },
        name: '',
        data: [],
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          cap: 'round',
          join: 'round',
        },
        itemStyle: {
          borderWidth: 2,
          borderColor: '#fff',
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 5,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            borderWidth: 3,
          },
        },
        smooth: 0.3,
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' },
          ],
        },
      },
    };

    if (!baseSeries[type]) {
      return {};
    }

    const dataSet = tableObject.rows.reduce(
      (result, row) => {
        console.log('Processing row:', row);
        result.legend.data.push(row[0]);
        result.series.push({
          ...baseSeries[type],
          name: row[0],
          data: row.slice(1).map((data) => {
            const num = parseFloat(data.replace(/,/g, ''));
            console.log('Parsed data:', data, '->', num);
            return num;
          }),
        });
        return result;
      },
      {
        legend: {
          data: [],
          type: 'scroll',
          orient: 'horizontal',
          left: 'center',
          top: 'top',
          textStyle: {
            fontSize: 12,
          },
          itemWidth: 12,
          itemHeight: 12,
          selectedMode: 'multiple',
          selector: [
            {
              type: 'all',
              title: '全选',
            },
            {
              type: 'inverse',
              title: '反选',
            },
          ],
        },
        series: [],
      },
    );

    const chartOptions = {
      ...dataSet,
      backgroundColor: '#fff',
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#999',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12,
        },
        axisPointer: {
          type: type === 'line' ? 'cross' : 'shadow',
          label: {
            backgroundColor: '#6a7985',
          },
          crossStyle: {
            color: '#999',
          },
        },
        formatter(params) {
          let result = `<div style="margin-bottom:4px;font-weight:bold;">${params[0].axisValueLabel}</div>`;
          params.forEach(function (item, index) {
            result += '<div style="margin:2px 0;">';
            result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>`;
            result += `<span style="font-weight:bold;">${item.seriesName}</span>`;
            result += `<span style="float:right;margin-left:20px;font-weight:bold;">${item.value}</span>`;
            result += '</div>';
          });
          return result;
        },
        extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-radius: 4px;',
      },
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        feature: {
          mark: { show: true, title: '辅助线开关' },
          dataView: {
            show: true,
            readOnly: false,
            title: '数据视图',
            lang: ['数据视图', '关闭', '刷新'],
          },
          magicType: {
            show: true,
            type: ['line', 'bar'],
            title: {
              line: '切换为折线图',
              bar: '切换为柱状图',
            },
          },
          restore: { show: true, title: '重置' },
          saveAsImage: {
            show: true,
            title: '保存为图片',
            type: 'png',
            backgroundColor: '#fff',
          },
        },
        iconStyle: {
          borderColor: '#999',
        },
        emphasis: {
          iconStyle: {
            borderColor: '#666',
          },
        },
      },
      xAxis: {
        data: tableObject.header.slice(1),
        type: 'category',
        axisLine: {
          lineStyle: {
            color: '#333',
          },
        },
        axisLabel: {
          color: '#333',
          rotate: tableObject.header.slice(1).some((h) => h.length > 4) ? 45 : 0,
          interval: 0,
          fontSize: 11,
        },
        axisTick: {
          alignWithLabel: true,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#333',
          fontSize: 11,
          formatter(value) {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            }
            if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}K`;
            }
            return value;
          },
        },
        axisLine: {
          lineStyle: {
            color: '#333',
          },
        },
        splitLine: {
          lineStyle: {
            color: '#eee',
            type: 'dashed',
          },
        },
        nameTextStyle: {
          color: '#333',
        },
      },
      grid: {
        containLabel: true,
        left: '3%',
        right: '8%',
        bottom: '8%',
        top: '15%',
      },
      dataZoom: [
        {
          type: 'slider',
          show: tableObject.header.length > 8,
          xAxisIndex: [0],
          start: 0,
          end: 100,
          bottom: '2%',
          height: 20,
          handleIcon:
            'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23.1h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
          handleSize: '80%',
          handleStyle: {
            color: '#fff',
            shadowBlur: 3,
            shadowColor: 'rgba(0, 0, 0, 0.6)',
            shadowOffsetX: 2,
            shadowOffsetY: 2,
          },
        },
        {
          type: 'inside',
          xAxisIndex: [0],
          start: 0,
          end: 100,
        },
      ],
      brush: {
        toolbox: ['rect', 'polygon', 'lineX', 'lineY', 'keep', 'clear'],
        xAxisIndex: 0,
      },
    };

    console.log('Final chart options:', chartOptions);
    return chartOptions;
  }

  onDestroy() {
    if (!this.dom) {
      return;
    }
    this.echartsRef.dispose(this.dom);
  }
}
