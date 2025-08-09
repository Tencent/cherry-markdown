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
import _ from 'lodash';

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
    const { echarts, cherryOptions, ...options } = echartsOptions;
    if (!echarts && !window.echarts) {
      throw new Error('table-echarts-plugin[init]: Package echarts not found.');
    }
    this.options = { ...DEFAULT_OPTIONS, ...(options || {}) };
    this.echartsRef = echarts || window.echarts; // echarts引用
    this.dom = null;

    // 保存Cherry配置，用于获取地图数据源URL
    this.cherryOptions = cherryOptions;
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
        chartOption = generateOptions(BarChartOptions, tableObject, options);
        break;
      case 'line':
        chartOption = generateOptions(LineChartOptions, tableObject, options);
        break;
      case 'radar':
        chartOption = generateOptions(RadarChartOptions, tableObject, options);
        break;
      case 'map':
        chartOption = this.renderMapChart(tableObject, options);
        break;
      case 'heatmap':
        chartOption = this.renderHeatmapChart(tableObject, options);
        break;
      case 'pie':
        chartOption = this.renderPieChart(tableObject, options);
        break;
      default:
        return '';
    }
    console.log('Chart options:', chartOption);

    // 生成唯一ID和简化的配置数据
    const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 序列化数据用于存储
    const tableDataStr = JSON.stringify(tableObject);
    const chartOptionsStr = JSON.stringify(options);

    // 创建一个包含所有必要信息的HTML结构
    const htmlContent = `
      <div class="cherry-echarts-wrapper" 
           style="width: ${this.options.width}px; height: ${
      this.options.height
    }px; min-height: 300px; display: block; position: relative; border: 1px solid #ddd;" 
           id="${chartId}"
           data-chart-type="${type}"
           data-table-data="${tableDataStr.replace(/"/g, '&quot;')}"
           data-chart-options="${chartOptionsStr.replace(/"/g, '&quot;')}">
        <div class="chart-loading" style="text-align: center; line-height: 300px; color: #666;">正在加载图表...</div>
      </div>
    `;

    // 在DOM插入后立即初始化图表
    // 使用更可靠的容器等待机制
    const initChart = (retryCount = 0) => {
      const container = document.getElementById(chartId);
      if (container && this.echartsRef) {
        try {
          const myChart = this.echartsRef.init(container);
          console.log('Chart initialized successfully:', chartId);
          myChart.setOption(chartOption);
          // 为热力图和饼图添加点击高亮效果
          if (type === 'heatmap' || type === 'pie') {
            this.addClickHighlightEffect(myChart, type);
          }
        } catch (error) {
          console.error('Failed to render chart:', error);
          console.error('Chart options:', chartOption);
          console.error('Container:', container);
          if (container) {
            container.innerHTML = `<div style="text-align: center; line-height: 300px; color: red;">
              图表渲染失败<br/>
              <span style="font-size: 12px; color: #666;">错误: ${error.message}</span>
            </div>`;
          }
        }
      } else if (retryCount < 10) {
        // 最多重试10次，每次间隔100ms
        console.log(`Retrying chart initialization for ${chartId}, attempt: ${retryCount + 1}`);
        setTimeout(() => initChart(retryCount + 1), 100);
      } else {
        console.error('Failed to find chart container after 10 retries:', chartId, !!this.echartsRef);
        const fallbackContainer = document.getElementById(chartId);
        if (fallbackContainer) {
          fallbackContainer.innerHTML = `<div style="text-align: center; line-height: 300px; color: red;">
            图表容器未找到<br/>
            <span style="font-size: 12px; color: #666;">容器ID: ${chartId}</span>
          </div>`;
        }
      }
    };

    setTimeout(() => initChart(), 50);

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

  renderHeatmapChart(tableObject, options) {
    return this.$renderHeatmapChartCommon(tableObject, options);
  }

  renderPieChart(tableObject, options) {
    return this.$renderPieChartCommon(tableObject, options);
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

  $renderHeatmapChartCommon(tableObject, options) {
    console.log('Rendering heatmap chart:', tableObject);

    // 构建热力图数据
    const xAxisData = tableObject.header.slice(1); // 列标题作为x轴
    const yAxisData = tableObject.rows.map((row) => row[0]); // 行标题作为y轴
    const data = [];
    // 构建热力图数据点 [x索引, y索引, 值]
    tableObject.rows.forEach((row, yIndex) => {
      row.slice(1).forEach((value, xIndex) => {
        const numValue = parseFloat(value.replace(/,/g, '')) || 0;
        data.push([xIndex, yIndex, numValue]);
      });
    });

    // 计算数值范围用于颜色映射
    const values = data.map((item) => item[2]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    const chartOptions = {
      backgroundColor: '#fff',
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
          return `${yAxisData[params.data[1]]}<br/>${xAxisData[params.data[0]]}: <strong>${params.data[2]}</strong>`;
        },
        extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-radius: 4px;',
      },
      grid: {
        height: '50%',
        top: '10%',
        left: '10%',
        right: '10%',
      },
      xAxis: {
        type: 'category',
        data: xAxisData,
        splitArea: {
          show: true,
        },
        axisLabel: {
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'category',
        data: yAxisData,
        splitArea: {
          show: true,
        },
        axisLabel: {
          fontSize: 12,
        },
      },
      visualMap: {
        min: minValue,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        inRange: {
          color: [
            '#313695',
            '#4575b4',
            '#74add1',
            '#abd9e9',
            '#e0f3f8',
            '#ffffcc',
            '#fee090',
            '#fdae61',
            '#f46d43',
            '#d73027',
            '#a50026',
          ],
        },
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: '热力图数据',
          type: 'heatmap',
          data,
          label: {
            show: true,
            fontSize: 10,
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              borderWidth: 2,
              borderColor: '#ff6b6b',
            },
          },
          select: {
            itemStyle: {
              borderWidth: 2,
              borderColor: '#ff6b6b',
              opacity: 1,
            },
          },
          selectedMode: 'single',
          animation: true,
          animationDuration: 1000,
          animationEasing: 'cubicOut',
        },
      ],
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'bottom',
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
    };
    return chartOptions;
  }

  $renderPieChartCommon(tableObject, options) {
    console.log('Rendering pie chart:', tableObject);

    // 构建饼图数据
    const data = tableObject.rows.map((row) => ({
      name: row[0],
      value: parseFloat(row[1].replace(/,/g, '')) || 0,
    }));

    const chartOptions = {
      backgroundColor: '#fff',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#999',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12,
        },
        formatter: '{a} <br/>{b}: {c} ({d}%)',
        extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-radius: 4px;',
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: '数据分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '18',
              fontWeight: 'bold',
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              borderWidth: 3,
              borderColor: '#ff6b6b',
            },
          },
          select: {
            itemStyle: {
              borderWidth: 3,
              borderColor: '#ff6b6b',
              opacity: 1,
            },
          },
          selectedMode: 'single',
          labelLine: {
            show: false,
          },
          data,
          animation: true,
          animationDuration: 1000,
          animationEasing: 'cubicOut',
        },
      ],
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
    };
    return chartOptions;
  }

  renderMapChart(tableObject, options) {
    console.log('开始渲染地图图表，选项:', options);

    // 检查options中是否有自定义地图数据源
    if (options && options.mapDataSource) {
      console.log('检测到自定义地图数据源:', options.mapDataSource);

      // 优先使用用户自定义的地图数据源
      // 如果当前已经有china地图数据，先清除它以确保使用新数据
      if (window.echarts && window.echarts.getMap('china')) {
        console.log('清除现有地图数据以使用自定义地图数据源');
      }

      // 立即开始加载自定义地图数据，这会覆盖默认地图数据
      this.$loadCustomMapData(options.mapDataSource, true);
    } else {
      console.log('使用默认地图数据源');
      // 只有在没有自定义数据源时才加载默认地图数据
      this.$loadChinaMapData();
    }

    // 立即返回地图图表配置
    return this.$renderMapChartCommon(tableObject, options);
  }

  /**
   * 加载中国地图数据
   */
  $loadChinaMapData() {
    if (typeof window.echarts === 'undefined') {
      console.error('ECharts 库未加载');
      return;
    }

    // 检查地图数据是否已加载
    if (window.echarts.getMap('china')) {
      console.log('中国地图数据已存在');
      return;
    }

    console.log('正在加载中国地图数据...');

    // 获取配置中的地图数据源URL，如果没有配置则使用默认值
    let possiblePaths = [
      'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json', // 在线高质量地图数据源（优先，已验证可用）
      './assets/data/china.json', // 从examples目录访问本地备份文件
    ];

    // 如果有Cherry配置且配置了mapTable.sourceUrl，则使用配置的URL
    if (
      this.cherryOptions &&
      this.cherryOptions.toolbars &&
      this.cherryOptions.toolbars.config &&
      this.cherryOptions.toolbars.config.mapTable &&
      this.cherryOptions.toolbars.config.mapTable.sourceUrl
    ) {
      possiblePaths = this.cherryOptions.toolbars.config.mapTable.sourceUrl;
      console.log('使用配置的地图数据源:', possiblePaths);
    }

    this.$tryLoadMapDataFromPaths(possiblePaths, 0);
  }

  /**
   * 尝试从多个路径加载地图数据
   */
  $tryLoadMapDataFromPaths(paths, index) {
    if (index >= paths.length) {
      console.error('所有地图数据源都加载失败');
      return;
    }

    const url = paths[index];
    console.log(`尝试加载地图数据: ${url}`);

    this.$fetchMapData(url).catch((error) => {
      console.warn(`地图数据加载失败 (${url}):`, error.message);
      // 尝试下一个路径
      this.$tryLoadMapDataFromPaths(paths, index + 1);
    });
  }

  /**
   * 获取地图数据
   */
  $fetchMapData(url) {
    return fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} for ${url}`);
        }
        return response.json();
      })
      .then((geoJson) => {
        // 注册地图数据
        window.echarts.registerMap('china', geoJson);
        console.log(`中国地图数据加载成功！来源: ${url}`);

        // 触发重新渲染已有的地图图表
        this.$refreshMapCharts();
        return geoJson;
      });
  }

  /**
   * 加载自定义地图数据
   * @param {string} mapUrl - 地图数据URL
   * @param {boolean} forceReload - 是否强制重新加载
   */
  $loadCustomMapData(mapUrl, forceReload = false) {
    if (!mapUrl || mapUrl.trim() === '') {
      console.warn('自定义地图数据URL为空，使用默认加载方法');
      return;
    }

    console.log(`正在加载用户自定义地图数据: ${mapUrl}${forceReload ? ' (强制重新加载)' : ''}`);

    // 优先加载用户自定义的地图数据，覆盖任何已有的地图数据
    this.$fetchMapData(mapUrl)
      .then(() => {
        console.log('用户自定义地图数据加载成功，正在刷新所有地图图表');
        // 地图数据加载成功后，立即刷新页面中的所有地图图表
        this.$refreshMapCharts();
      })
      .catch((error) => {
        console.warn(`用户自定义地图数据加载失败 (${mapUrl}):`, error.message);
        console.warn('自定义地图数据加载失败，回退到默认地图数据');
        // 如果用户自定义URL失败，回退到默认地图数据
        this.$loadChinaMapData();
      });
  }

  /**
   * 刷新页面中的地图图表
   */
  $refreshMapCharts() {
    // 查找页面中所有的地图图表容器，重新渲染
    const mapContainers = document.querySelectorAll('[id^="chart-"][data-chart-type="map"]');
    console.log('Found map containers to refresh:', mapContainers.length);

    mapContainers.forEach((container) => {
      const chartId = container.id;
      console.log('Refreshing map chart:', chartId);

      // 从 data 属性获取存储的表格数据
      const tableDataStr = container.getAttribute('data-table-data');
      const chartOptionsStr = container.getAttribute('data-chart-options');

      if (tableDataStr && this.echartsRef) {
        try {
          const tableData = JSON.parse(tableDataStr);
          const chartOptions = chartOptionsStr ? JSON.parse(chartOptionsStr) : {};

          const chartOption = this.$renderMapChartCommon(tableData, chartOptions);
          const existingChart = this.echartsRef.getInstanceByDom(container);

          if (existingChart) {
            existingChart.setOption(chartOption);
            console.log('Map chart refreshed successfully:', chartId);
          } else {
            // 重新创建图表
            const newChart = this.echartsRef.init(container);
            newChart.setOption(chartOption);
            console.log('Map chart recreated:', chartId);
          }
        } catch (error) {
          console.error('Failed to refresh map chart:', chartId, error);
        }
      }
    });
  }

  $renderMapChartCommon(tableObject, options) {
    console.log('Rendering map chart:', tableObject);

    // 检查 ECharts 是否可用
    if (typeof window.echarts === 'undefined') {
      console.error('ECharts 库未加载');
      return {
        title: {
          text: '地图渲染失败: ECharts 库未加载',
          left: 'center',
          textStyle: { color: '#ff0000' },
        },
      };
    }

    // 检查中国地图数据是否已注册
    if (!window.echarts.getMap('china')) {
      console.warn('中国地图数据未加载，正在尝试加载...');

      // 异步加载地图数据
      this.$loadChinaMapData();

      // 返回加载提示，稍后会被替换
      return {
        title: {
          text: '正在加载地图数据...',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#666',
            fontSize: 16,
          },
        },
        graphic: {
          elements: [
            {
              type: 'text',
              left: 'center',
              top: '60%',
              style: {
                text: '如果长时间未显示，请检查网络连接',
                font: '12px sans-serif',
                fill: '#999',
              },
            },
          ],
        },
      };
    }

    return generateOptions(MapChartOptions, tableObject, options);
  }

  // 添加点击高亮效果
  addClickHighlightEffect(chartInstance, chartType) {
    let selectedDataIndex = null;
    chartInstance.on('click', (params) => {
      console.log('Chart clicked:', params);
      // 如果点击的是同一个数据项，则取消高亮
      if (selectedDataIndex === params.dataIndex) {
        selectedDataIndex = null;
        this.clearHighlight(chartInstance, chartType);
        return;
      }
      // 记录当前选中的数据项
      selectedDataIndex = params.dataIndex;
    });
  }
  // 清除高亮效果
  clearHighlight(chartInstance, chartType) {
    // 取消ECharts内置的高亮
    chartInstance.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
    });
    // 恢复所有数据项的原始样式
    const option = chartInstance.getOption();
    const seriesData = option.series[0].data;
    seriesData.forEach((item) => {
      if (item.itemStyle) {
        delete item.itemStyle.opacity;
        delete item.itemStyle.borderWidth;
        delete item.itemStyle.borderColor;
      }
    });
    chartInstance.setOption({
      series: [
        {
          data: seriesData,
        },
      ],
    });
  }

  onDestroy() {
    if (!this.dom) {
      return;
    }
    this.echartsRef.dispose(this.dom);
  }
}

const BaseChartOptions = {
  options(tableObject, options) {
    return {
      backgroundColor: '#fff',
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'],
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: '#999',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 12,
        },
        extraCssText: 'box-shadow: 0 2px 8px rgba(0,0,0,0.15); border-radius: 4px;',
      },
      toolbox: {
        show: true,
        orient: 'vertical',
        left: 'right',
        top: 'center',
        feature: {
          // magicType: {
          //   show: true,
          //   type: ['line', 'bar'],
          //   title: {
          //     line: '切换为折线图',
          //     bar: '切换为柱状图',
          //   },
          // },
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
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        left: 'center',
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
      // brush: {
      //   toolbox: ['rect', 'polygon', 'lineX', 'lineY', 'keep', 'clear'],
      //   xAxisIndex: 0,
      // },
    };
  },
};

const AxisBaseChartOptions = {
  parents: [BaseChartOptions],
  options(tableObject, options) {
    const data = [];
    const series = [];
    tableObject.rows.forEach((row) => {
      console.log('Processing row:', row);
      data.push(row[0]);
      series.push({
        name: row[0],
        data: row.slice(1).map((data) => parseFloat(data.replace(/,/g, ''))),
      });
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
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
      },
      legend: {
        data,
        type: 'scroll',
        top: 'top',
      },
      series,
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
      grid: {
        containLabel: true,
        left: '3%',
        right: '8%',
        bottom: '8%',
        top: '15%',
      },
    };
  },
};

const NonAxisBaseChartOptions = {
  parents: [BaseChartOptions],
  options(tableObject, options) {
    return {
      'tooltip.trigger': 'item',
    };
  },
};

const LineChartOptions = {
  parents: [AxisBaseChartOptions],
  options(tableObject, options) {
    return {
      'tooltip.axisPointer.type': 'cross',
      // tooltip: {
      //   axisPointer: {
      //     type: 'cross',
      //   },
      // },
      // 'tooltip.axisPointer.type': 'axis',
      // $series:
      'series.$item': {
        type: 'line',
        animation: true,
        animationDuration: 1000,
        animationEasing: 'elasticOut',
        animationDelay(idx) {
          return idx * 10;
        },
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
  },
};

const BarChartOptions = {
  parents: [AxisBaseChartOptions],
  options(tableObject, options) {
    return {
      'tooltip.axisPointer.type': 'shadow',
      'series.$item': {
        type: 'bar',
        barWidth: '60%',
        animation: true,
        animationDuration: 1000,
        animationEasing: 'elasticOut',
        animationDelay(idx) {
          return idx * 10;
        },
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
    };
  },
};

const RadarChartOptions = {
  parents: [NonAxisBaseChartOptions],
  options(tableObject, options) {
    const indicator = tableObject.header.slice(1).map((header) => {
      const maxValue = Math.max(
        ...tableObject.rows.map((row) => {
          const index = tableObject.header.indexOf(header);
          return parseFloat(row[index].replace(/,/g, '')) || 0;
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

    return {
      'tooltip.formatter'(params) {
        console.log('radar params:', params);
        let result = `<div style="margin-bottom:4px;font-weight:bold;">${params.name}</div>`;
        params.value.forEach((value, index) => {
          result += '<div style="margin:2px 0;">';
          result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${params.color};"></span>`;
          result += `<span style="font-weight:bold;">${indicator[index].name}</span>`;
          result += `<span style="float:right;margin-left:20px;font-weight:bold;">${value}</span>`;
          result += '</div>';
        });
        return result;
      },
      legend: {
        data: tableObject.rows.map((row) => row[0]),
        top: 'bottom',
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
              // text: '雷达图分析',
              fontSize: 16,
              fontWeight: 'bold',
              fill: '#333',
            },
          },
        ],
      },
    };
  },
};

const MapChartOptions = {
  parents: [NonAxisBaseChartOptions],
  options(tableObject, options) {
    const mapData = tableObject.rows.map((row) => {
      const originalName = row[0];
      const standardName = normalizeProvinceName(originalName);
      const value = parseFloat(row[1].replace(/,/g, '')) || 0;

      console.log(`Name mapping: "${originalName}" -> "${standardName}"`);

      return {
        name: standardName,
        value,
      };
    });

    return {
      'tooltip.formatter': (params) => `${params.name}: ${params.value || 0}`,
      visualMap: {
        min: Math.min(...mapData.map((item) => item.value)),
        max: Math.max(...mapData.map((item) => item.value)),
        left: 'left',
        top: 'bottom',
        text: ['高', '低'],
        calculable: true,
        inRange: {
          color: ['#e0ffff', '#006edd'],
        },
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: '地图数据',
          type: 'map',
          map: 'china',
          roam: true,
          label: {
            show: true,
            fontSize: 10,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
            },
            itemStyle: {
              areaColor: '#ffefd5',
            },
          },
          data: mapData,
          itemStyle: {
            areaColor: '#f5f5f5',
            borderColor: '#999',
            borderWidth: 0.5,
          },
        },
      ],
    };
  },
};

// 省份名称映射表
const provinceNameMap = {
  北京: '北京市',
  天津: '天津市',
  上海: '上海市',
  重庆: '重庆市',
  河北: '河北省',
  山西: '山西省',
  辽宁: '辽宁省',
  吉林: '吉林省',
  黑龙江: '黑龙江省',
  江苏: '江苏省',
  浙江: '浙江省',
  安徽: '安徽省',
  福建: '福建省',
  江西: '江西省',
  山东: '山东省',
  河南: '河南省',
  湖北: '湖北省',
  湖南: '湖南省',
  广东: '广东省',
  海南: '海南省',
  四川: '四川省',
  贵州: '贵州省',
  云南: '云南省',
  陕西: '陕西省',
  甘肃: '甘肃省',
  青海: '青海省',
  台湾: '台湾省',
  内蒙古: '内蒙古自治区',
  广西: '广西壮族自治区',
  西藏: '西藏自治区',
  宁夏: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
  香港: '香港特别行政区',
  澳门: '澳门特别行政区',
};

// 名称标准化函数
const normalizeProvinceName = (inputName) => {
  // 移除可能的空格
  const cleanName = inputName.trim();

  // 直接匹配映射表
  if (provinceNameMap[cleanName]) {
    return provinceNameMap[cleanName];
  }

  // 如果输入已经是完整名称，直接返回
  if (
    cleanName.endsWith('市') ||
    cleanName.endsWith('省') ||
    cleanName.endsWith('自治区') ||
    cleanName.endsWith('特别行政区')
  ) {
    return cleanName;
  }

  // 模糊匹配：查找包含输入名称的省份
  for (const [shortName, fullName] of Object.entries(provinceNameMap)) {
    if (fullName.includes(cleanName) || cleanName.includes(shortName)) {
      return fullName;
    }
  }

  // 如果都没匹配到，返回原名称
  console.warn(`Province name not matched: ${inputName}`);
  return cleanName;
};

function generateOptions(handler, tableObject, options) {
  let result;
  if (!handler.parents || handler.parents.length === 0) {
    result = {};
  } else {
    result = generateOptions(handler.parents[0], tableObject, options);
    for (const handler2 in handler.parents.slice(1)) {
      deepMerge(result, generateOptions(handler2, tableObject, options), result);
      // result = autoMergeDollarProps(result, generateOptions(handler2, tableObject, options));
    }
  }
  deepMerge(result, handler.options(tableObject, options), result);
  // result = autoMergeDollarProps(result, handler.options(tableObject, options));
  return result;
}

function deepMerge(target, source, root) {
  for (const key of Object.keys(source)) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const keyList = key.split('.');
      let target2 = target;
      for (const key2 of keyList.slice(0, -1)) {
        if (typeof target2[key2] !== 'object' || target2[key2] === null || target2[key2] === undefined) {
          target2[key2] = {};
        }
        target2 = target2[key2];
      }

      const key3 = keyList[keyList.length - 1];
      console.log('key3:', key3);
      if (Array.isArray(target2) && key3 === '$item') {
        // 如果是要给数组元素赋值。
        for (const item of target2) {
          deepMerge(item, source[key], root);
        }
      } else if (typeof target2[key3] === 'object' && typeof source[key] === 'object') {
        // 如果目标对象在该属性上已经存在一个对象，并且源对象对应的属性也是一个对象，则递归合并。
        deepMerge(target2[key3], source[key], root);
      } else if (typeof source[key] === 'function') {
        // 若是函数则绑定根对象。
        target2[key3] = source[key].bind(root);
      } else {
        // 否则，直接覆盖或新增属性。
        target2[key3] = source[key];
      }
    }
  }
  return target;
}

function autoMergeDollarProps(target, source) {
  const result = _.merge({}, target);

  // 收集所有 $ 开头的路径
  function collectDollarPaths(obj, path = '') {
    const dollars = [];
    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];

      if (key.startsWith('$') && typeof value === 'object' && value !== null) {
        dollars.push({
          dollarPath: currentPath,
          arrayKey: key.slice(1),
          arrayPath: currentPath.slice(1), // $series → series（同级）
          value,
        });
      } else if (typeof value === 'object' && value !== null) {
        dollars.push(...collectDollarPaths(value, currentPath));
      }
    }
    return dollars;
  }

  const dollarRules = collectDollarPaths(source);

  dollarRules.forEach((rule) => {
    // 计算目标数组路径：把 $.a.$b.$seriesItem → a.b.series
    const arrayPath = rule.dollarPath.slice(1); // 去掉 $
    const array = _.get(result, arrayPath);

    if (Array.isArray(array)) {
      array.forEach((item) => {
        _.merge(item, rule.value);
      });
    }
  });

  // 最后：将 source 普通属性合并（排除 $ 键）
  const cleanSource = _.omitBy(source, (value, key) => key.startsWith('$'));
  _.merge(result, cleanSource);

  return result;
}
