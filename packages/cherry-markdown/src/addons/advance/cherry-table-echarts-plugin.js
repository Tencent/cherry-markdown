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
import Logger from '@/Logger';

// 主题与常量集中管理
const THEME = {
  color: {
    border: '#999',
    borderHover: '#666',
    text: '#333',
    tooltipText: '#333',
    tooltipTextDark: '#ddd',
    emphasis: '#ff6b6b',
    lineSplit: '#eee',
  },
  shadow: {
    color: 'rgba(0, 0, 0, 0.5)',
    blur: 10,
  },
  fontSize: {
    base: 12,
    small: 10,
    title: 16,
  },
};

const DEFAULT_OPTIONS = {
  renderer: 'svg',
  width: 500,
  height: 300,
};

export default class EChartsTableEngine {
  static install(cherryOptions, ...args) {
    if (typeof window === 'undefined') {
      Logger.warn('echarts-table-engine only works in browser.');
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
    // 统一管理实例
    this.instances = new Set();
    // 主题监听器
    this.themeObservers = new Map();
    // 运行时主题（根据CSS变量动态生成）
    this.themeRuntime = null;
    // 主题缓存：key 为主题名（default/dark/abyss等），值为 { echarts, runtime }
    this.themeCache = new Map();

    // 导出完成事件监听器
    this.exportObservers = new Map();
  }

  /**
   * 获取调色盘颜色，用于图表的配色
   */
  $palette(type = 'default') {
    let palette = [];
    switch (type) {
      case 'radar':
        palette = [
          'rgba(114, 172, 209, 0.2)',
          'rgba(114, 172, 209, 0.4)',
          'rgba(114, 172, 209, 0.6)',
          'rgba(114, 172, 209, 0.8)',
          'rgba(114, 172, 209, 1)',
        ];
        break;
      case 'heatmap':
        palette = [
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
        ];
        break;
      case 'map':
        palette = ['#e0ffff', '#006edd'];
        break;
      default:
        palette = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc'];
        break;
    }
    return palette;
  }

  /**
   * 构建网格配置
   * @param {Object} [overrides]
   * @returns {Object}
   */
  $grid(overrides = {}) {
    return { containLabel: true, left: '8%', right: '8%', bottom: '8%', top: '12%', ...overrides };
  }

  /**
   * 构建坐标轴配置
   */
  $axis(type = 'value', overrides = {}) {
    return {
      type,
      axisLine: { lineStyle: { color: this.$theme().color.text } },
      axisLabel: { color: this.$theme().color.text, fontSize: this.$theme().fontSize.base },
      splitLine: { lineStyle: { color: this.$theme().color.lineSplit, type: 'dashed' } },
      ...overrides,
    };
  }

  /**
   * 构建数据缩放配置
   */
  $dataZoom(showSlider = true, overrides = {}) {
    const base = [{ type: 'inside', xAxisIndex: [0], start: 0, end: 100 }];
    if (showSlider) {
      base.push({ type: 'slider', xAxisIndex: [0], bottom: '2%', start: 0, end: 100, height: 20 });
    }
    return base.map((z) => ({ ...z, ...overrides }));
  }

  /**
   * 数值解析
   * @param {any} value 输入值
   * @returns {number} 数字（无法解析则为 0）
   */
  $num(value) {
    const n = parseFloat(String(value ?? '').replace(/,/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * 构建统一系列基础属性
   */
  $baseSeries(type, overrides = {}) {
    const animation = {
      animation: true,
      animationDuration: 1000,
      animationEasing: 'elasticOut',
      animationDelay(idx) {
        return idx * 10;
      },
    };
    const base = {
      // name: '',
      data: [],
      emphasis: {
        focus: 'series',
        itemStyle: { shadowBlur: this.$theme().shadow.blur, shadowOffsetX: 0, shadowColor: this.$theme().shadow.color },
      },
    };
    const dict = {
      bar: {
        type: 'bar',
        label: { show: false, position: 'top', formatter: '{c}' },
      },
      line: {
        type: 'line',
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { width: 3, cap: 'round', join: 'round' },
        itemStyle: { borderWidth: 2, borderColor: '#fff' },
        smooth: 0.3,
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' },
          ],
        },
        emphasis: {
          focus: 'series',
          lineStyle: { width: 5 },
          itemStyle: { borderWidth: 3 },
        },
      },
      scatter: { type: 'scatter' },
      radar: { type: 'radar' },
      heatmap: { type: 'heatmap' },
      pie: { type: 'pie' },
    };
    return { ...base, ...dict[type], ...animation, ...overrides };
  }

  /**
   * 获取带有颜色的指示器圆点HTML片段
   */
  $dot(color) {
    return `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${color};"></span>`;
  }

  /**
   * 为容器下的svg额外添加类名标签, 避免figure svg深色模式下的选择器影响ECharts
   */
  $tagEchartsSvg(container) {
    const svg = container && container.querySelector && container.querySelector('svg');
    if (svg) svg.classList.add('echarts-svg');
  }

  /**
   * 销毁图表实例
   */
  destroyChart(target) {
    let container = null;
    let inst = null;

    if (target && typeof target.getDom === 'function') {
      inst = target;
      container = inst.getDom && inst.getDom();
    } else if (target instanceof Element) {
      container = target;
      inst = this.echartsRef.getInstanceByDom(container);
    }

    if (inst && !inst.isDisposed()) inst.dispose();
    if (inst) this.instances.delete(inst);
  }

  /**
   * 创建或复用图表实例
   * @param {Element} container 容器元素
   * @param {Object} [option] ECharts 配置
   * @param {*} [type] 图表类型（用于附加交互等）
   * @param {Object} [themeObj] 主题对象（不传则根据 CSS 变量计算）
   * @returns {*}
   */
  createChart(container, option = {}, type, themeObj) {
    if (!container) return null;
    // 已存在实例直接返回，避免被观察器和延迟初始化同时触发导致重复初始化
    const existed = this.echartsRef.getInstanceByDom(container);
    if (existed && !existed.isDisposed()) return existed;
    const root = container.closest('.cherry') || container.closest('.cherry-markdown') || this.$getCherryRoot();
    const theme = themeObj || this.$buildEchartsThemeFromCss(root);

    if (container.firstChild) container.innerHTML = '';

    const chart = this.echartsRef.init(container, theme, this.options);
    if (option && Object.keys(option).length) chart.setOption(option);

    this.instances.add(chart);
    this.$tagEchartsSvg(container);
    this.$enableThemeObserver(container);
    this.$enableExportObserver(container);

    if (type === 'heatmap' || type === 'pie') this.addClickHighlightEffect(chart, type);

    return chart;
  }

  /**
   * 读取 CSS 变量
   */
  $readCssVar(el, name, fallback) {
    try {
      const v = getComputedStyle(el).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }

  /**
   * 从 classList 中提取主题名 theme__xxx -> xxx
   */
  $extractThemeNameFromClassList(classList) {
    try {
      const arr = Array.from(classList || []);
      const t = arr.find((c) => c.startsWith('theme__'));
      return t ? t.replace('theme__', '') : 'default';
    } catch (e) {
      return 'default';
    }
  }

  /**
   * 基于容器所在根节点获取主题缓存 key
   */
  $themeCacheKey(rootEl) {
    const root = rootEl || this.$getCherryRoot();
    const host = root || document.body;
    return this.$extractThemeNameFromClassList((host && host.classList) || []);
  }

  /**
   * 基于CSS变量构建ECharts主题，并同步到运行时主题
   */
  $buildEchartsThemeFromCss(rootEl) {
    const el = rootEl || this.$getCherryRoot();
    const cacheKey = this.$themeCacheKey(el);
    if (this.themeCache.has(cacheKey)) {
      const cached = this.themeCache.get(cacheKey);
      this.themeRuntime = cached.runtime;
      return cached.echarts;
    }
    const bg = this.$readCssVar(el, '--base-previewer-bg', this.$readCssVar(el, '--base-editor-bg', 'transparent'));
    const text = this.$readCssVar(el, '--base-font-color', THEME.color.text);
    const border = this.$readCssVar(el, '--md-table-border', THEME.color.border);
    const split = this.$readCssVar(el, '--md-hr-border', THEME.color.border);

    const isDarkLike = (() => {
      const hexColor = String(bg || '').toLowerCase();
      // 较深的背景可视作暗色
      return hexColor.includes('#0') || hexColor.includes('#1') || hexColor.includes('#2') || hexColor.includes('#3');
    })();

    // 更新运行时主题
    const runtime = {
      color: {
        border,
        borderHover: border,
        text,
        tooltipText: isDarkLike ? THEME.color.tooltipTextDark : THEME.color.tooltipText,
        lineSplit: split,
        backgroundColor: bg,
        tooltipBg: isDarkLike ? bg : 'white',
        emphasis: THEME.color.emphasis,
      },
      shadow: { ...THEME.shadow },
      fontSize: { ...THEME.fontSize },
    };
    this.themeRuntime = runtime;

    // 返回echarts.init要传入的主题对象
    const echartsTheme = {
      backgroundColor: bg,
      textStyle: { color: text },
      title: { textStyle: { color: text } },
      legend: { textStyle: { color: text } },
      tooltip: {
        backgroundColor: this.$theme().color.tooltipBg,
        borderColor: border,
        textStyle: { color: this.$theme().color.tooltipText },
      },
      categoryAxis: {
        axisLine: { lineStyle: { color: text } },
        axisLabel: { color: text },
        splitLine: { lineStyle: { color: split } },
      },
      valueAxis: {
        axisLine: { lineStyle: { color: text } },
        axisLabel: { color: text },
        splitLine: { lineStyle: { color: split } },
      },
      color: this.$palette(),
    };
    this.themeCache.set(cacheKey, { echarts: echartsTheme, runtime });
    return echartsTheme;
  }

  /**
   * 获取当前运行时主题
   */
  $theme() {
    return this.themeRuntime || THEME;
  }

  /**
   * 获取 Cherry 根容器
   */
  $getCherryRoot(container = null) {
    if (container) {
      const root = container.closest('.cherry') || container.closest('.cherry-markdown');
      if (root) return root;
    }
    return document.querySelector('.cherry') || document.querySelector('.cherry-markdown') || document.body;
  }

  /**
   * 启用主题变更观察器
   */
  $enableThemeObserver(container) {
    const root = this.$getCherryRoot(container);
    if (!root) return;
    if (this.themeObservers.has(root)) return;
    const observer = new MutationObserver(() => {
      this.$buildEchartsThemeFromCss(root);
      Array.from(this.instances).forEach((inst) => {
        this.$setInstanceTheme(inst);
      });
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    this.themeObservers.set(root, observer);
  }

  /**
   * 通过 echartsInstance.setOption 刷新主题
   * @param {*} instance ECharts 实例
   */
  $setInstanceTheme(instance) {
    if (!instance || typeof instance.getDom !== 'function') return;
    const container = instance.getDom();
    if (!container) return;
    const root = this.$getCherryRoot(container);
    // 从缓存读取主题对象
    const cacheKey = this.$themeCacheKey(root);
    const cached = this.themeCache.get(cacheKey);
    const themeObj = cached && cached.echarts;
    if (!themeObj) return;
    const option = this.$chartOptionsFromDataset(container) || {};
    instance.setOption(option, true);
    this.$tagEchartsSvg(container);
  }

  $generateChartOptions(type, tableObject, options) {
    const handler = {
      bar: BarChartOptionsHandler,
      line: LineChartOptionsHandler,
      radar: RadarChartOptionsHandler,
      map: MapChartOptionsHandler,
      heatmap: HeatmapChartOptionsHandler,
      pie: PieChartOptionsHandler,
      scatter: ScatterChartOptionsHandler,
    }[type];
    options.engine = this;
    return handler ? generateOptions(handler, tableObject, options) : {};
  }

  /**
   * 从容器 `data-*` 属性解析并生成 Option 图表配置
   */
  $chartOptionsFromDataset(container) {
    const type = container.getAttribute('data-chart-type');
    const tableDataStr = container.getAttribute('data-table-data');
    const chartOptionsStr = container.getAttribute('data-chart-options');
    let tableData = null;
    let chartOptions = {};
    try {
      tableData = tableDataStr ? JSON.parse(tableDataStr) : null;
    } catch (e) {
      tableData = null;
    }
    try {
      chartOptions = chartOptionsStr ? JSON.parse(chartOptionsStr) : {};
    } catch (e) {
      chartOptions = {};
    }
    if (!type || !tableData) return {};
    return this.$generateChartOptions(type, tableData, chartOptions);
  }

  /**
   * 定向重建一组容器对应的图表
   */
  $rehydrateChartsForContainers(containersSet, rootEl) {
    const root = rootEl || this.$getCherryRoot();
    const themeObj = this.$buildEchartsThemeFromCss(root);
    containersSet.forEach((container) => {
      if (!(container instanceof Element) || !container.isConnected) return;
      const type = container.getAttribute('data-chart-type');
      const option = this.$chartOptionsFromDataset(container);
      try {
        this.destroyChart(container);
        this.createChart(container, option, type, themeObj);
      } catch (e) {
        Logger.warn('rehydrate (partial) chart failed:', e);
      }
    });
  }

  /**
   * 启用导出完成事件观察器
   * 一旦收到导出完成事件，则定向重建当前根容器下的所有图表容器
   */
  $enableExportObserver(container) {
    const root = this.$getCherryRoot(container);
    if (!root) return;
    if (this.exportObservers.has(root)) return;
    const handler = () => {
      try {
        const containersSet = new Set();
        const found = root.querySelectorAll('.cherry-echarts-wrapper');
        if (found && found.length) Array.from(found).forEach((el) => containersSet.add(el));
        if (containersSet.size) this.$rehydrateChartsForContainers(containersSet, root);
      } catch (e) {
        Logger.warn('rehydrate after export failed:', e);
      }
    };
    // 监听全局导出完成事件
    window.addEventListener('cherry:export:done', handler);
    this.exportObservers.set(root, handler);
  }

  /**
   * 渲染入口：将表格数据渲染为指定类型图表，并返回 HTML 容器片段
   */
  render(type, options, tableObject) {
    // Logger.log('Rendering chart:', type, options, tableObject);

    // 生成唯一ID和简化的配置数据
    const chartId = `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    // 序列化数据用于存储
    const tableDataStr = JSON.stringify(tableObject);
    const chartOptionsStr = JSON.stringify(options);

    options.chartId = chartId;
    const chartOption = this.$generateChartOptions(type, tableObject, options);
    // Logger.log('Chart options:', chartOption);

    // 创建一个包含所有必要信息的HTML结构
    const htmlContent = `
      <div class="cherry-echarts-wrapper" 
           style="width: ${this.options.width}px; height: ${
             this.options.height
           }px; min-height: 300px; display: block; position: relative; border: 1px solid var(--md-table-border);" 
           id="${chartId}"
           data-chart-type="${type}"
           data-table-data="${tableDataStr.replace(/"/g, '&quot;')}"
           data-chart-options="${chartOptionsStr.replace(/"/g, '&quot;')}">
      </div>
    `;

    // 延迟到下一轮事件循环再执行；只重试一次
    setTimeout(() => {
      const container = document.getElementById(chartId);
      if (!container || !this.echartsRef) return;
      if (this.echartsRef.getInstanceByDom(container)) return;
      try {
        this.createChart(container, chartOption, type);
        Logger.log('Chart initialized successfully:', chartId);
      } catch (error) {
        Logger.error('Failed to render chart:', error);
        Logger.error('Chart options:', chartOption);
        Logger.error('Container:', container);
        container.innerHTML = `<div style="text-align: center; line-height: 300px; color: red;">
          图表渲染失败<br/>
          <span style="font-size: 12px; color: #666;">错误: ${error.message}</span>
        </div>`;
      }
    }, 50);

    return htmlContent;
  }

  // 添加点击高亮效果
  addClickHighlightEffect(chartInstance, chartType) {
    let selectedDataIndex = null;
    chartInstance.on('click', (params) => {
      Logger.log('Chart clicked:', params);
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
    if (this.instances && this.instances.size > 0) {
      this.instances.forEach((inst) => {
        this.destroyChart(inst);
      });
      this.instances.clear();
    }
    if (this.themeObservers && this.themeObservers.size) {
      this.themeObservers.forEach((observer) => {
        observer.disconnect();
      });
      this.themeObservers.clear();
    }
    if (this.exportObservers && this.exportObservers.size) {
      this.exportObservers.forEach((handler) => {
        window.removeEventListener('cherry:export:done', handler);
      });
      this.exportObservers.clear();
    }
    if (this.dom) {
      const inst = this.echartsRef.getInstanceByDom(this.dom);
      if (inst && !inst.isDisposed()) inst.dispose();
      this.dom = null;
    }
  }
}

// Handler-based chart configuration system from PR #1349, enhanced with PR #1362 features
const TitleOptionsHandler = {
  options(tableObject, options) {
    return options.title
      ? {
          title: {
            text: options.title.replace(/\s*,\s*$/, ''),
            left: 'center',
            top: 'bottom',
            textStyle: {
              color: options.engine.$theme().color.tooltipText,
              fontSize: 16,
            },
          },
        }
      : {};
  },
};

const BaseChartOptionsHandler = {
  components: [TitleOptionsHandler],
  options(tableObject, options) {
    const { engine } = options;
    return {
      aria: {
        show: true,
      },
      backgroundColor: engine.$theme().color.backgroundColor,
      color: engine.$palette(),
      tooltip: {
        trigger: 'item',
        backgroundColor: engine.$theme().color.tooltipBg,
        borderColor: engine.$theme().color.border,
        borderWidth: 1,
        textStyle: {
          color: engine.$theme().color.tooltipText,
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
          // dataView: { show: true, readOnly: false, title: '数据视图', lang: ['数据视图', '关闭', '刷新'] },
          // restore: { show: true, title: '重置' },
          saveAsImage: {
            show: true,
            title: '保存为图片',
            type: engine.options.renderer === 'svg' ? 'svg' : 'png', // renderer 类型为svg，默认只支持输出svg
            backgroundColor: '#fff',
          },
        },
        iconStyle: { borderColor: engine.$theme().color.border },
        emphasis: { iconStyle: { borderColor: engine.$theme().color.borderHover } },
      },
    };
  },
};

const LegendOptionsHandler = {
  options(tableObject, options) {
    const { engine } = options;
    return {
      legend: {
        type: 'scroll',
        orient: 'horizontal',
        left: 'center',
        top: 'top',
        textStyle: { color: engine.$theme().color.text, fontSize: engine.$theme().fontSize.base },
        itemWidth: 12,
        itemHeight: 12,
        selectedMode: 'multiple',
        selectorLabel: { color: engine.$theme().color.text, borderColor: engine.$theme().color.border },
        data: tableObject.rows.map((row) => row[0]),
      },
    };
  },
};

const AxisOptionsHandler = {
  components: [BaseChartOptionsHandler, LegendOptionsHandler],
  options(tableObject, options) {
    const { engine } = options;
    const data = [];
    const series = [];
    tableObject.rows.forEach((row) => {
      // console.log('Processing row:', row);
      data.push(row[0]);
      series.push({
        name: row[0],
        data: row.slice(1).map((data) => engine.$num(data)),
      });
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          label: { backgroundColor: '#6a7985' },
          crossStyle: { color: '#999' },
        },
        formatter: (params) => {
          const header = params?.[0]?.axisValueLabel ?? '';
          let result = `<div style="margin-bottom:4px;font-weight:bold;">${header}</div>`;
          params.forEach((item) => {
            result += '<div style="margin:2px 0;">';
            result += `${engine.$dot(item.color)}`;
            result += `<span style="font-weight:bold;">${item.seriesName}</span>`;
            result += `<span style="float:right;margin-left:20px;font-weight:bold;">${item.value}</span>`;
            result += '</div>';
          });
          return result;
        },
      },
      legend: { data },
      series,
      xAxis: engine.$axis('category', {
        data: tableObject.header.slice(1),
        axisTick: { alignWithLabel: true },
        axisLabel: {
          textStyle: { color: engine.$theme().color.text },
          rotate: tableObject.header.slice(1).some((h) => h.length > 4) ? 45 : 0,
          interval: 0,
        },
      }),
      yAxis: engine.$axis('value', {
        axisLabel: {
          textStyle: { color: engine.$theme().color.text },
          formatter(value) {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value;
          },
        },
        nameTextStyle: { color: engine.$theme().color.text },
      }),
      grid: engine.$grid({ left: '3%', top: '15%' }),
      dataZoom: engine.$dataZoom(tableObject.header.length > 8),
    };
  },
};

const LineChartOptionsHandler = {
  components: [AxisOptionsHandler],
  options(tableObject, options) {
    const { engine } = options;
    return {
      'tooltip.axisPointer.type': 'cross',
      'series.$item': engine.$baseSeries('line'),
    };
  },
};

const BarChartOptionsHandler = {
  components: [AxisOptionsHandler],
  options(tableObject, options) {
    const { engine } = options;
    return {
      'tooltip.axisPointer.type': 'shadow',
      'series.$item': engine.$baseSeries('bar'),
      // 'series.$item': engine.$baseSeries('bar', { barWidth: '60%' }),
      // brush: { toolbox: ['rect', 'polygon', 'lineX', 'lineY', 'keep', 'clear'], xAxisIndex: 0 },
    };
  },
};

const RadarChartOptionsHandler = {
  components: [BaseChartOptionsHandler, LegendOptionsHandler],
  options(tableObject, options) {
    const { engine } = options;
    const indicator = tableObject.header.slice(1).map((header) => {
      const maxValue = Math.max(
        ...tableObject.rows.map((row) => {
          const index = tableObject.header.indexOf(header);
          return engine.$num(row[index]);
        }),
      );
      return {
        name: header,
        max: Math.ceil(maxValue * 1.2),
      };
    });

    const seriesData = tableObject.rows.map((row, index) => ({
      name: row[0],
      value: row.slice(1).map((data) => engine.$num(data)),
      areaStyle: { opacity: 0.1 + index * 0.05 },
      lineStyle: { width: 2 },
      itemStyle: { borderWidth: 2 },
    }));

    return {
      'tooltip.formatter'(params) {
        let result = `<div style="margin-bottom:4px;font-weight:bold;">${engine.$dot(params.color)}${
          params.name
        }</div>`;
        params.value.forEach((value, index) => {
          result += '<div style="margin:2px 0;">';
          result += `<span style="font-weight:bold;">${indicator[index].name}</span>`;
          result += `<span style="float:right;margin-left:20px;font-weight:bold;">${value}</span>`;
          result += '</div>';
        });
        return result;
      },
      radar: {
        name: {
          textStyle: { color: engine.$theme().color.text, fontSize: 12, fontWeight: 'bold' },
          formatter(name) {
            return name.length > 6 ? `${name.substr(0, 6)}...` : name;
          },
        },
        indicator,
        radius: '60%',
        center: ['50%', '50%'],
        splitNumber: 5,
        shape: 'polygon',
        splitArea: { areaStyle: { color: engine.$palette('radar').reverse() } },
        axisName: { color: engine.$theme().color.text },
        axisLine: { lineStyle: { color: 'rgba(211, 253, 250, 0.8)' } },
        splitLine: { lineStyle: { color: 'rgba(211, 253, 250, 0.8)' } },
      },
      series: [
        engine.$baseSeries('radar', {
          name: '雷达图数据',
          data: seriesData,
          emphasis: { lineStyle: { width: 4 }, areaStyle: { opacity: 0.3 } },
        }),
      ],
    };
  },
};

const HeatmapChartOptionsHandler = {
  components: [BaseChartOptionsHandler],
  options(tableObject, options) {
    const { engine } = options;
    const xAxisData = tableObject.header.slice(1);
    const yAxisData = tableObject.rows.map((row) => row[0]);
    const data = [];

    tableObject.rows.forEach((row, yIndex) => {
      row.slice(1).forEach((value, xIndex) => {
        data.push([xIndex, yIndex, engine.$num(value)]);
      });
    });

    const values = data.map((item) => item[2]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    return {
      'tooltip.formatter'(params) {
        return `${yAxisData[params.data[1]]}<br/>${xAxisData[params.data[0]]}: <strong>${params.data[2]}</strong>`;
      },
      grid: engine.$grid({ height: '50%', top: '10%', left: '10%', right: '10%' }),
      xAxis: engine.$axis('category', { data: xAxisData, splitArea: { show: true } }),
      yAxis: engine.$axis('category', { data: yAxisData, splitArea: { show: true } }),
      visualMap: {
        min: minValue,
        max: maxValue,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%',
        inRange: { color: engine.$palette('heatmap') },
        textStyle: { color: engine.$theme().color.text, fontSize: engine.$theme().fontSize.base },
      },
      series: [
        engine.$baseSeries('heatmap', {
          name: '热力图数据',
          data,
          label: { show: true, fontSize: 10 },
          emphasis: {
            itemStyle: {
              shadowBlur: engine.$theme().shadow.blur,
              shadowColor: engine.$theme().shadow.color,
              borderWidth: 2,
              borderColor: engine.$theme().color.emphasis,
            },
          },
          select: { itemStyle: { borderWidth: 2, borderColor: engine.$theme().color.emphasis, opacity: 1 } },
          selectedMode: 'single',
          animationEasing: 'cubicOut',
        }),
      ],
      'toolbox.top': 'bottom',
    };
  },
};

const PieChartOptionsHandler = {
  components: [BaseChartOptionsHandler, LegendOptionsHandler],
  options(tableObject, options) {
    const { engine } = options;
    const data = tableObject.rows.map((row) => ({ name: row[0], value: engine.$num(row[1]) }));

    return {
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      series: [
        engine.$baseSeries('pie', {
          name: '数据分布',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: '18', fontWeight: 'bold' },
            itemStyle: {
              shadowBlur: engine.$theme().shadow.blur,
              shadowOffsetX: 0,
              shadowColor: engine.$theme().shadow.color,
              borderWidth: 3,
              borderColor: engine.$theme().color.emphasis,
            },
          },
          select: { itemStyle: { borderWidth: 3, borderColor: engine.$theme().color.emphasis, opacity: 1 } },
          selectedMode: 'single',
          labelLine: { show: false },
          data,
          animationEasing: 'cubicOut',
        }),
      ],
    };
  },
};

// Scatter chart handler integrated from PR #1362
const ScatterChartOptionsHandler = {
  components: [BaseChartOptionsHandler, LegendOptionsHandler],
  // 新的 options 函数
  options(tableObject, options) {
    const { engine } = options;
    let parsedRows = [];
    let hasSizeColumn = false;
    let hasGroupColumn = false;
    const mapping = options['cherry:mapping'];
    // 步骤一：逻辑分叉
    if (mapping && typeof mapping === 'object') {
      // 新版显式映射逻辑
      const headers = tableObject.header;

      // 1. 构建列名到索引的映射
      const headerIndexMap = new Map();
      headers.forEach((header, index) => {
        headerIndexMap.set(header.trim(), index);
      });

      // 2. 根据 cherry:mapping 查找各维度的列索引
      const getColumnIndex = (dimensionName) => headerIndexMap.get(mapping[dimensionName]);
      const xCol = getColumnIndex('x');
      const yCol = getColumnIndex('y');
      const sizeCol = getColumnIndex('size');
      const groupCol = getColumnIndex('group') || getColumnIndex('series');

      hasSizeColumn = typeof sizeCol === 'number';
      hasGroupColumn = typeof groupCol === 'number';

      // 3. 遍历数据行，生成 parsedRows
      parsedRows = tableObject.rows.map((row) => {
        const x = typeof xCol === 'number' ? engine.$num(row[xCol]) : 0;
        const y = typeof yCol === 'number' ? engine.$num(row[yCol]) : 0;
        const size = hasSizeColumn ? engine.$num(row[sizeCol]) : undefined;
        const seriesName = hasGroupColumn ? String(row[groupCol] ?? '').trim() || '系列1' : null;
        return { name: row[0], x, y, size, seriesName };
      });
    } else {
      // 否则，回退到旧版智能推断逻辑
      // (将在步骤四中实现)
      // 回退到旧的智能推断逻辑
      Logger.warn(
        'DEPRECATION WARNING: The scatter chart syntax relying on header keywords is outdated and will be removed in a future version. Please use the "cherry:mapping" option for explicit mapping.\n' +
          `e.g., Change '...| X | Y |' to '...{ "cherry:mapping": { "x": "X", "y": "Y" } }'.`,
      );

      const headers = tableObject.header;
      const findHeader = (candidates) =>
        headers.findIndex((h, i) => i > 0 && candidates.some((c) => String(h).toLowerCase().includes(c)));

      const xCol = findHeader(['x']);
      const yCol = findHeader(['y']);
      const sizeCol = findHeader(['size', '大小']);
      let groupCol = findHeader(['series', 'group', '分组', '系列']);
      if (groupCol <= 0 && headers.length >= 5) {
        groupCol = headers.length - 1;
      }

      hasSizeColumn = sizeCol > 0;
      hasGroupColumn = groupCol > 0;

      parsedRows = tableObject.rows.map((row) => {
        const x = engine.$num(row[xCol > 0 ? xCol : 1]);
        const y = engine.$num(row[yCol > 0 ? yCol : 2]);
        const size = hasSizeColumn ? engine.$num(row[sizeCol]) : undefined;
        const seriesName = hasGroupColumn ? String(row[groupCol] ?? '').trim() || '系列1' : null;
        return { name: row[0], x, y, size, seriesName };
      });
    }
    // 调用公共辅助函数来构建 series
    const series = this.buildSeriesFromParsedRows(parsedRows, hasSizeColumn, hasGroupColumn, engine);
    // 组装并返回最终的 ECharts 配置
    return {
      tooltip: {
        trigger: 'item',
        formatter(params) {
          const [x, y] = params.value || [];
          return `${params.name}<br/>x: <strong>${x}</strong><br/>y: <strong>${y}</strong>`;
        },
      },
      grid: engine.$grid(),
      xAxis: engine.$axis('value'),
      yAxis: engine.$axis('value'),
      series,
    };
  },
  // ... 其他辅助函数
  /**
   * @private
   * 辅助函数：根据解析好的数据行构建 ECharts series
   */
  buildSeriesFromParsedRows(parsedRows, hasSizeColumn, hasGroupColumn, engine) {
    // 此处代码基本是从旧实现中完整迁移过来的，负责尺寸归一化和数据分组
    // 1. 尺寸归一化
    let minSize = Infinity;
    let maxSize = -Infinity;
    if (hasSizeColumn) {
      parsedRows.forEach((r) => {
        if (typeof r.size === 'number' && !Number.isNaN(r.size)) {
          minSize = Math.min(minSize, r.size);
          maxSize = Math.max(maxSize, r.size);
        }
      });
      if (!Number.isFinite(minSize) || !Number.isFinite(maxSize)) {
        minSize = 0;
        maxSize = 0;
      }
    }

    // 2. 根据是否存在分组来构建 series
    let series = [];
    if (hasGroupColumn) {
      // 多系列逻辑 (分组)
      const groupMap = new Map();
      parsedRows.forEach((r) => {
        const item = { value: [r.x, r.y], name: r.name };
        if (hasSizeColumn) {
          if (maxSize === minSize) item.symbolSize = 12;
          else if (typeof r.size === 'number' && !Number.isNaN(r.size)) {
            const t = (r.size - minSize) / (maxSize - minSize);
            item.symbolSize = Math.round(6 + t * (28 - 6));
          } else item.symbolSize = 10;
        }
        const key = r.seriesName;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key).push(item);
      });
      series = Array.from(groupMap.entries()).map(([name, data]) =>
        engine.$baseSeries('scatter', { name, data, /* ...样式 */ }),
      );
    } else {
      // 单系列逻辑
      const data = parsedRows.map((r) => {
        const item = { value: [r.x, r.y], name: r.name };
        if (hasSizeColumn) {
          if (maxSize === minSize) item.symbolSize = 12;
          else if (typeof r.size === 'number' && !Number.isNaN(r.size)) {
            const t = (r.size - minSize) / (maxSize - minSize);
            item.symbolSize = Math.round(6 + t * (28 - 6));
          } else item.symbolSize = 10;
        }
        return item;
      });
      series = [engine.$baseSeries('scatter', { name: '散点', data, /* ...样式 */ })];
    }
    return series;
  },
};

// Map chart handlers from PR #1349 with PR #1362 integration
const MapChartLoadingOptionsHandler = {
  options(tableObject, options) {
    // console.log('Rendering map chart:', tableObject);

    return typeof window.echarts === 'undefined'
      ? {
          title: {
            text: '地图渲染失败: ECharts 库未加载',
            left: 'center',
            textStyle: { color: '#ff0000' },
          },
        }
      : {
          title: {
            text: '正在加载地图数据...',
            left: 'center',
            top: 'middle',
            textStyle: { color: '#666', fontSize: 16 },
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
  },
};

const MapChartCompleteOptionsHandler = {
  components: [BaseChartOptionsHandler],
  options(tableObject, options) {
    const { engine } = options;
    const mapData = tableObject.rows.map((row) => {
      const originalName = row[0];
      const standardName = normalizeProvinceName(originalName);
      const value = engine.$num(row[1]);
      return { name: standardName, value };
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
        inRange: { color: engine.$palette('map') },
        textStyle: {
          color: engine.$theme().color.text,
          fontSize: engine.$theme().fontSize.base,
        },
      },
      series: [
        {
          name: '地图数据',
          type: 'map',
          map: options.mapDataSource || 'china',
          roam: true,
          label: { show: true, fontSize: 12 },
          data: mapData,
          emphasis: {
            label: {
              show: true,
              fontSize: engine.$theme().fontSize.base,
              fontWeight: 'bold',
            },
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' },
          },
        },
      ],
    };
  },
};

const MapChartOptionsHandler = {
  options(tableObject, options) {
    this.$loadMapData(tableObject, options);
    return generateOptions(MapChartLoadingOptionsHandler, tableObject, options);
  },
  $loadMapData(tableObject, options) {
    let paths = [];
    if (options && options.mapDataSource) {
      paths.push(options.mapDataSource);
    }
    if (options?.engine?.cherryOptions?.toolbars?.config?.mapTable?.sourceUrl) {
      paths = paths.concat(options.engine.cherryOptions.toolbars.config.mapTable.sourceUrl);
    }
    paths = paths.concat(['https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json', './assets/data/china.json']);
    this.$tryLoadMapDataFromPaths(paths, 0, options);
  },
  $tryLoadMapDataFromPaths(paths, index, options) {
    if (index >= paths.length) {
      // console.error('所有地图数据源都加载失败');
      return;
    }

    const url = paths[index];
    // console.log(`尝试加载地图数据: ${url}`);

    this.$fetchMapData(url)
      .then((geoJson) => {
        window.echarts.registerMap(url, geoJson);
        // console.log(`地图数据加载成功！来源: ${url}`);
        this.$refreshMapChart(options.chartId, url, options.engine);
        return geoJson;
      })
      .catch((error) => {
        // console.warn(`地图数据加载失败 (${url}):`, error.message);
        this.$tryLoadMapDataFromPaths(paths, index + 1, options);
      });
  },
  $fetchMapData(url) {
    return fetch(url, { referrerPolicy: 'no-referrer' }).then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for ${url}`);
      }
      return response.json();
    });
  },
  $refreshMapChart(chartId, url, engine) {
    const container = document.querySelector(`[id="${chartId}"][data-chart-type="map"]`);
    const tableDataStr = container.getAttribute('data-table-data');
    const chartOptionsStr = container.getAttribute('data-chart-options');

    if (tableDataStr && engine.echartsRef) {
      try {
        const tableData = JSON.parse(tableDataStr);
        const chartOptions = chartOptionsStr ? JSON.parse(chartOptionsStr) : {};
        chartOptions.engine = engine;
        deepMerge(chartOptions, { mapDataSource: url });

        const chartOption = generateOptions(MapChartCompleteOptionsHandler, tableData, chartOptions);
        const existingChart = engine.echartsRef.getInstanceByDom(container);

        if (existingChart) {
          existingChart.setOption(chartOption, true);
          // console.log('Map chart refreshed successfully:', chartId);
        } else {
          const newChart = engine.echartsRef.init(container);
          newChart.setOption(chartOption);
          // console.log('Map chart recreated:', chartId);
        }
      } catch (error) {
        // console.error('Failed to refresh map chart:', chartId, error);
      }
    }
  },
};

// Province name mapping from PR #1349
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

const normalizeProvinceName = (inputName) => {
  const cleanName = inputName.trim();
  if (provinceNameMap[cleanName]) return provinceNameMap[cleanName];
  if (
    cleanName.endsWith('市') ||
    cleanName.endsWith('省') ||
    cleanName.endsWith('自治区') ||
    cleanName.endsWith('特别行政区')
  ) {
    return cleanName;
  }
  for (const [shortName, fullName] of Object.entries(provinceNameMap)) {
    if (fullName.includes(cleanName) || cleanName.includes(shortName)) {
      return fullName;
    }
  }
  // console.warn(`Province name not matched: ${inputName}`);
  return cleanName;
};

/**
 * Generate chart options with handler composition from PR #1349
 */
function generateOptions(handler, tableObject, options) {
  let result;
  if (!handler.components || handler.components.length === 0) {
    result = {};
  } else {
    result = generateOptions(handler.components[0], tableObject, options);
    for (const handler2 of handler.components.slice(1)) {
      deepMerge(result, generateOptions(handler2, tableObject, options));
    }
  }
  deepMerge(result, handler.options(tableObject, options));
  return result;
}

/**
 * Deep merge utility from PR #1349
 */
function deepMerge(target, source) {
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
      if (Array.isArray(target2) && key3 === '$item') {
        for (const item of target2) {
          deepMerge(item, source[key]);
        }
      } else if (typeof target2[key3] === 'object' && typeof source[key] === 'object') {
        deepMerge(target2[key3], source[key]);
      } else {
        target2[key3] = source[key];
      }
    }
  }
  return target;
}
