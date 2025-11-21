export default class EChartsTableEngine {
    static install(cherryOptions: any, ...args: any[]): void;
    constructor(echartsOptions?: {});
    options: {
        renderer: string;
        width: number;
        height: number;
    };
    echartsRef: any;
    dom: any;
    cherryOptions: any;
    cherry: any;
    instances: Set<any>;
    themeObservers: Map<any, any>;
    themeRuntime: any;
    themeCache: Map<any, any>;
    exportObservers: Map<any, any>;
    /**
     * 获取调色盘颜色，用于图表的配色
     */
    $palette(type?: string): string[];
    /**
     * 构建网格配置
     * @param {Object} [overrides]
     * @returns {Object}
     */
    $grid(overrides?: any): any;
    /**
     * 构建坐标轴配置
     */
    $axis(type?: string, overrides?: {}): {
        type: string;
        axisLine: {
            lineStyle: {
                color: any;
            };
        };
        axisLabel: {
            color: any;
            fontSize: any;
        };
        splitLine: {
            lineStyle: {
                color: any;
                type: string;
            };
        };
    };
    /**
     * 构建数据缩放配置
     */
    $dataZoom(showSlider?: boolean, overrides?: {}): {
        type: string;
        xAxisIndex: number[];
        start: number;
        end: number;
    }[];
    /**
     * 数值解析
     * @param {any} value 输入值
     * @returns {number} 数字（无法解析则为 0）
     */
    $num(value: any): number;
    /**
     * 构建统一系列基础属性
     */
    $baseSeries(type: any, overrides?: {}): any;
    /**
     * 获取带有颜色的指示器圆点HTML片段
     */
    $dot(color: any): string;
    /**
     * 为容器下的svg额外添加类名标签, 避免figure svg深色模式下的选择器影响ECharts
     */
    $tagEchartsSvg(container: any): void;
    /**
     * 清理无效的图表实例（图表不在DOM中，但仍被this.instances保存，需要清理）
     */
    cleanupInvalidInstances(): void;
    /**
     * 销毁图表实例
     */
    destroyChart(target: any): void;
    /**
     * 创建或复用图表实例
     * @param {Element} container 容器元素
     * @param {Object} [option] ECharts 配置
     * @param {*} [type] 图表类型（用于附加交互等）
     * @returns {*}
     */
    createChart(container: Element, option?: any, type?: any): any;
    /**
     * 读取 CSS 变量
     */
    $readCssVar(el: any, name: any, fallback: any): any;
    /**
     * 从 classList 中提取主题名 theme__xxx -> xxx
     */
    $extractThemeNameFromClassList(classList: any): any;
    /**
     * 基于容器所在根节点获取主题缓存 key
     */
    $themeCacheKey(rootEl: any): any;
    /**
     * 基于CSS变量构建ECharts运行时主题
     */
    $buildEchartsThemeFromCss(rootEl: any): void;
    /**
     * 获取当前运行时主题
     */
    $theme(): any;
    /**
     * 获取 Cherry 根容器
     */
    $getCherryRoot(container?: any): any;
    /**
     * 启用主题变更观察器
     */
    $enableThemeObserver(container: any): void;
    /**
     * 通过 echartsInstance.setOption 刷新主题
     * @param {*} instance ECharts 实例
     */
    $setInstanceTheme(instance: any): void;
    $generateChartOptions(type: any, tableObject: any, options: any): any;
    /**
     * 从容器 `data-*` 属性解析并生成 Option 图表配置
     */
    $chartOptionsFromDataset(container: any): any;
    /**
     * 定向重建一组容器对应的图表
     */
    $rehydrateChartsForContainers(containersSet: any, rootEl: any): void;
    /**
     * 重建根容器下的所有图表
     */
    $rebuildAllCharts(root: any): void;
    /**
     * 启用语言变更观察器
     */
    $enableLocaleObserver(): void;
    /**
     * 启用导出完成事件观察器
     * 一旦收到导出完成事件，则定向重建当前根容器下的所有图表容器
     */
    $enableExportObserver(container: any): void;
    /**
     * 渲染入口：将表格数据渲染为指定类型图表，并返回 HTML 容器片段
     */
    render(type: any, options: any, tableObject: any): string;
    addClickHighlightEffect(chartInstance: any, chartType: any): void;
    clearHighlight(chartInstance: any, chartType: any): void;
    onDestroy(): void;
}
