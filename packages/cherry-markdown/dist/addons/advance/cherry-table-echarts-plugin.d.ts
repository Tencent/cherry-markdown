export default class EChartsTableEngine {
    static install(cherryOptions: any, ...args: any[]): void;
    constructor(echartsOptions?: {});
    options: {
        renderer: string;
        width: number;
        height: number;
    };
    echartsRef: any;
    dom: HTMLDivElement;
    cherryOptions: any;
    getInstance(): any;
    render(type: any, options: any, tableObject: any): string;
    renderBarChart(tableObject: any, options: any): any;
    renderLineChart(tableObject: any, options: any): any;
    renderRadarChart(tableObject: any, options: any): {
        backgroundColor: string;
        color: string[];
        tooltip: {
            trigger: string;
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
            textStyle: {
                color: string;
                fontSize: number;
            };
            formatter(params: any): string;
            extraCssText: string;
        };
        legend: {
            data: any;
            orient: string;
            left: string;
            top: string;
            textStyle: {
                fontSize: number;
            };
            itemWidth: number;
            itemHeight: number;
            selectedMode: string;
            selector: {
                type: string;
                title: string;
            }[];
        };
        toolbox: {
            show: boolean;
            orient: string;
            left: string;
            top: string;
            feature: {
                dataView: {
                    show: boolean;
                    readOnly: boolean;
                    title: string;
                    lang: string[];
                };
                restore: {
                    show: boolean;
                    title: string;
                };
                saveAsImage: {
                    show: boolean;
                    title: string;
                    type: string;
                    backgroundColor: string;
                };
            };
            iconStyle: {
                borderColor: string;
            };
            emphasis: {
                iconStyle: {
                    borderColor: string;
                };
            };
        };
        radar: {
            name: {
                textStyle: {
                    color: string;
                    fontSize: number;
                    fontWeight: string;
                };
                formatter(name: any): any;
            };
            indicator: any;
            radius: string;
            center: string[];
            splitNumber: number;
            shape: string;
            splitArea: {
                areaStyle: {
                    color: string[];
                };
            };
            axisLine: {
                lineStyle: {
                    color: string;
                };
            };
            splitLine: {
                lineStyle: {
                    color: string;
                };
            };
        };
        series: {
            name: string;
            type: string;
            data: any;
            emphasis: {
                lineStyle: {
                    width: number;
                };
                areaStyle: {
                    opacity: number;
                };
            };
            animation: boolean;
            animationDuration: number;
            animationEasing: string;
        }[];
        graphic: {
            elements: {
                type: string;
                left: string;
                top: string;
                style: {
                    text: string;
                    fontSize: number;
                    fontWeight: string;
                    fill: string;
                };
            }[];
        };
    };
    renderHeatmapChart(tableObject: any, options: any): {
        backgroundColor: string;
        tooltip: {
            trigger: string;
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
            textStyle: {
                color: string;
                fontSize: number;
            };
            formatter(params: any): string;
            extraCssText: string;
        };
        grid: {
            height: string;
            top: string;
            left: string;
            right: string;
        };
        xAxis: {
            type: string;
            data: any;
            splitArea: {
                show: boolean;
            };
            axisLabel: {
                fontSize: number;
            };
        };
        yAxis: {
            type: string;
            data: any;
            splitArea: {
                show: boolean;
            };
            axisLabel: {
                fontSize: number;
            };
        };
        visualMap: {
            min: number;
            max: number;
            calculable: boolean;
            orient: string;
            left: string;
            bottom: string;
            inRange: {
                color: string[];
            };
            textStyle: {
                fontSize: number;
            };
        };
        series: {
            name: string;
            type: string;
            data: any[];
            label: {
                show: boolean;
                fontSize: number;
            };
            emphasis: {
                itemStyle: {
                    shadowBlur: number;
                    shadowColor: string;
                    borderWidth: number;
                    borderColor: string;
                };
            };
            select: {
                itemStyle: {
                    borderWidth: number;
                    borderColor: string;
                    opacity: number;
                };
            };
            selectedMode: string;
            animation: boolean;
            animationDuration: number;
            animationEasing: string;
        }[];
        toolbox: {
            show: boolean;
            orient: string;
            left: string;
            top: string;
            feature: {
                dataView: {
                    show: boolean;
                    readOnly: boolean;
                    title: string;
                    lang: string[];
                };
                restore: {
                    show: boolean;
                    title: string;
                };
                saveAsImage: {
                    show: boolean;
                    title: string;
                    type: string;
                    backgroundColor: string;
                };
            };
            iconStyle: {
                borderColor: string;
            };
            emphasis: {
                iconStyle: {
                    borderColor: string;
                };
            };
        };
    };
    renderPieChart(tableObject: any, options: any): {
        backgroundColor: string;
        tooltip: {
            trigger: string;
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
            textStyle: {
                color: string;
                fontSize: number;
            };
            formatter: string;
            extraCssText: string;
        };
        legend: {
            orient: string;
            left: string;
            top: string;
            textStyle: {
                fontSize: number;
            };
        };
        series: {
            name: string;
            type: string;
            radius: string[];
            center: string[];
            avoidLabelOverlap: boolean;
            label: {
                show: boolean;
                position: string;
            };
            emphasis: {
                label: {
                    show: boolean;
                    fontSize: string;
                    fontWeight: string;
                };
                itemStyle: {
                    shadowBlur: number;
                    shadowOffsetX: number;
                    shadowColor: string;
                    borderWidth: number;
                    borderColor: string;
                };
            };
            select: {
                itemStyle: {
                    borderWidth: number;
                    borderColor: string;
                    opacity: number;
                };
            };
            selectedMode: string;
            labelLine: {
                show: boolean;
            };
            data: any;
            animation: boolean;
            animationDuration: number;
            animationEasing: string;
        }[];
        toolbox: {
            show: boolean;
            orient: string;
            left: string;
            top: string;
            feature: {
                dataView: {
                    show: boolean;
                    readOnly: boolean;
                    title: string;
                    lang: string[];
                };
                restore: {
                    show: boolean;
                    title: string;
                };
                saveAsImage: {
                    show: boolean;
                    title: string;
                    type: string;
                    backgroundColor: string;
                };
            };
            iconStyle: {
                borderColor: string;
            };
            emphasis: {
                iconStyle: {
                    borderColor: string;
                };
            };
        };
    };
    $renderRadarChartCommon(tableObject: any, options: any): {
        backgroundColor: string;
        color: string[];
        tooltip: {
            trigger: string;
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
            textStyle: {
                color: string;
                fontSize: number;
            };
            formatter(params: any): string;
            extraCssText: string;
        };
        legend: {
            data: any;
            orient: string;
            left: string;
            top: string;
            textStyle: {
                fontSize: number;
            };
            itemWidth: number;
            itemHeight: number;
            selectedMode: string;
            selector: {
                type: string;
                title: string;
            }[];
        };
        toolbox: {
            show: boolean;
            orient: string;
            left: string;
            top: string;
            feature: {
                dataView: {
                    show: boolean;
                    readOnly: boolean;
                    title: string;
                    lang: string[];
                };
                restore: {
                    show: boolean;
                    title: string;
                };
                saveAsImage: {
                    show: boolean;
                    title: string;
                    type: string;
                    backgroundColor: string;
                };
            };
            iconStyle: {
                borderColor: string;
            };
            emphasis: {
                iconStyle: {
                    borderColor: string;
                };
            };
        };
        radar: {
            name: {
                textStyle: {
                    color: string;
                    fontSize: number;
                    fontWeight: string;
                };
                formatter(name: any): any;
            };
            indicator: any;
            radius: string;
            center: string[];
            splitNumber: number;
            shape: string;
            splitArea: {
                areaStyle: {
                    color: string[];
                };
            };
            axisLine: {
                lineStyle: {
                    color: string;
                };
            };
            splitLine: {
                lineStyle: {
                    color: string;
                };
            };
        };
        series: {
            name: string;
            type: string;
            data: any;
            emphasis: {
                lineStyle: {
                    width: number;
                };
                areaStyle: {
                    opacity: number;
                };
            };
            animation: boolean;
            animationDuration: number;
            animationEasing: string;
        }[];
        graphic: {
            elements: {
                type: string;
                left: string;
                top: string;
                style: {
                    text: string;
                    fontSize: number;
                    fontWeight: string;
                    fill: string;
                };
            }[];
        };
    };
    $renderHeatmapChartCommon(tableObject: any, options: any): {
        backgroundColor: string;
        tooltip: {
            trigger: string;
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
            textStyle: {
                color: string;
                fontSize: number;
            };
            formatter(params: any): string;
            extraCssText: string;
        };
        grid: {
            height: string;
            top: string;
            left: string;
            right: string;
        };
        xAxis: {
            type: string;
            data: any;
            splitArea: {
                show: boolean;
            };
            axisLabel: {
                fontSize: number;
            };
        };
        yAxis: {
            type: string;
            data: any;
            splitArea: {
                show: boolean;
            };
            axisLabel: {
                fontSize: number;
            };
        };
        visualMap: {
            min: number;
            max: number;
            calculable: boolean;
            orient: string;
            left: string;
            bottom: string;
            inRange: {
                color: string[];
            };
            textStyle: {
                fontSize: number;
            };
        };
        series: {
            name: string;
            type: string;
            data: any[];
            label: {
                show: boolean;
                fontSize: number;
            };
            emphasis: {
                itemStyle: {
                    shadowBlur: number;
                    shadowColor: string;
                    borderWidth: number;
                    borderColor: string;
                };
            };
            select: {
                itemStyle: {
                    borderWidth: number;
                    borderColor: string;
                    opacity: number;
                };
            };
            selectedMode: string;
            animation: boolean;
            animationDuration: number;
            animationEasing: string;
        }[];
        toolbox: {
            show: boolean;
            orient: string;
            left: string;
            top: string;
            feature: {
                dataView: {
                    show: boolean;
                    readOnly: boolean;
                    title: string;
                    lang: string[];
                };
                restore: {
                    show: boolean;
                    title: string;
                };
                saveAsImage: {
                    show: boolean;
                    title: string;
                    type: string;
                    backgroundColor: string;
                };
            };
            iconStyle: {
                borderColor: string;
            };
            emphasis: {
                iconStyle: {
                    borderColor: string;
                };
            };
        };
    };
    $renderPieChartCommon(tableObject: any, options: any): {
        backgroundColor: string;
        tooltip: {
            trigger: string;
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
            textStyle: {
                color: string;
                fontSize: number;
            };
            formatter: string;
            extraCssText: string;
        };
        legend: {
            orient: string;
            left: string;
            top: string;
            textStyle: {
                fontSize: number;
            };
        };
        series: {
            name: string;
            type: string;
            radius: string[];
            center: string[];
            avoidLabelOverlap: boolean;
            label: {
                show: boolean;
                position: string;
            };
            emphasis: {
                label: {
                    show: boolean;
                    fontSize: string;
                    fontWeight: string;
                };
                itemStyle: {
                    shadowBlur: number;
                    shadowOffsetX: number;
                    shadowColor: string;
                    borderWidth: number;
                    borderColor: string;
                };
            };
            select: {
                itemStyle: {
                    borderWidth: number;
                    borderColor: string;
                    opacity: number;
                };
            };
            selectedMode: string;
            labelLine: {
                show: boolean;
            };
            data: any;
            animation: boolean;
            animationDuration: number;
            animationEasing: string;
        }[];
        toolbox: {
            show: boolean;
            orient: string;
            left: string;
            top: string;
            feature: {
                dataView: {
                    show: boolean;
                    readOnly: boolean;
                    title: string;
                    lang: string[];
                };
                restore: {
                    show: boolean;
                    title: string;
                };
                saveAsImage: {
                    show: boolean;
                    title: string;
                    type: string;
                    backgroundColor: string;
                };
            };
            iconStyle: {
                borderColor: string;
            };
            emphasis: {
                iconStyle: {
                    borderColor: string;
                };
            };
        };
    };
    renderMapChart(tableObject: any, options: any): {
        backgroundColor: string;
        title: {
            text: string;
            left: string;
            top: string;
            textStyle: {
                fontSize: number;
                fontWeight: string;
                color: string;
            };
        };
        tooltip: {
            trigger: string;
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
            textStyle: {
                color: string;
                fontSize: number;
            };
            formatter(params: any): string;
            extraCssText: string;
        };
        visualMap: {
            min: number;
            max: number;
            left: string;
            top: string;
            text: string[];
            calculable: boolean;
            inRange: {
                color: string[];
            };
            textStyle: {
                fontSize: number;
            };
        };
        series: {
            name: string;
            type: string;
            map: string;
            roam: boolean;
            label: {
                show: boolean;
                fontSize: number;
            };
            emphasis: {
                label: {
                    show: boolean;
                    fontSize: number;
                    fontWeight: string;
                };
                itemStyle: {
                    areaColor: string;
                };
            };
            data: any;
            itemStyle: {
                areaColor: string;
                borderColor: string;
                borderWidth: number;
            };
        }[];
        toolbox: {
            show: boolean;
            orient: string;
            left: string;
            top: string;
            feature: {
                dataView: {
                    show: boolean;
                    readOnly: boolean;
                    title: string;
                    lang: string[];
                };
                restore: {
                    show: boolean;
                    title: string;
                };
                saveAsImage: {
                    show: boolean;
                    title: string;
                    type: string;
                    backgroundColor: string;
                };
            };
            iconStyle: {
                borderColor: string;
            };
            emphasis: {
                iconStyle: {
                    borderColor: string;
                };
            };
        };
    } | {
        title: {
            text: string;
            left: string;
            textStyle: {
                color: string;
                fontSize?: undefined;
            };
            top?: undefined;
        };
        graphic?: undefined;
    } | {
        title: {
            text: string;
            left: string;
            top: string;
            textStyle: {
                color: string;
                fontSize: number;
            };
        };
        graphic: {
            elements: {
                type: string;
                left: string;
                top: string;
                style: {
                    text: string;
                    font: string;
                    fill: string;
                };
            }[];
        };
    };
    /**
     * 加载中国地图数据
     */
    $loadChinaMapData(): void;
    /**
     * 尝试从多个路径加载地图数据
     */
    $tryLoadMapDataFromPaths(paths: any, index: any): void;
    /**
     * 获取地图数据
     */
    $fetchMapData(url: any): Promise<any>;
    /**
     * 加载自定义地图数据
     * @param {string} mapUrl - 地图数据URL
     * @param {boolean} forceReload - 是否强制重新加载
     */
    $loadCustomMapData(mapUrl: string, forceReload?: boolean): void;
    /**
     * 刷新页面中的地图图表
     */
    $refreshMapCharts(): void;
    $renderMapChartCommon(tableObject: any, options: any): {
        backgroundColor: string;
        title: {
            text: string;
            left: string;
            top: string;
            textStyle: {
                fontSize: number;
                fontWeight: string;
                color: string;
            };
        };
        tooltip: {
            trigger: string;
            backgroundColor: string;
            borderColor: string;
            borderWidth: number;
            textStyle: {
                color: string;
                fontSize: number;
            };
            formatter(params: any): string;
            extraCssText: string;
        };
        visualMap: {
            min: number;
            max: number;
            left: string;
            top: string;
            text: string[];
            calculable: boolean;
            inRange: {
                color: string[];
            };
            textStyle: {
                fontSize: number;
            };
        };
        series: {
            name: string;
            type: string;
            map: string;
            roam: boolean;
            label: {
                show: boolean;
                fontSize: number;
            };
            emphasis: {
                label: {
                    show: boolean;
                    fontSize: number;
                    fontWeight: string;
                };
                itemStyle: {
                    areaColor: string;
                };
            };
            data: any;
            itemStyle: {
                areaColor: string;
                borderColor: string;
                borderWidth: number;
            };
        }[];
        toolbox: {
            show: boolean;
            orient: string;
            left: string;
            top: string;
            feature: {
                dataView: {
                    show: boolean;
                    readOnly: boolean;
                    title: string;
                    lang: string[];
                };
                restore: {
                    show: boolean;
                    title: string;
                };
                saveAsImage: {
                    show: boolean;
                    title: string;
                    type: string;
                    backgroundColor: string;
                };
            };
            iconStyle: {
                borderColor: string;
            };
            emphasis: {
                iconStyle: {
                    borderColor: string;
                };
            };
        };
    } | {
        title: {
            text: string;
            left: string;
            textStyle: {
                color: string;
                fontSize?: undefined;
            };
            top?: undefined;
        };
        graphic?: undefined;
    } | {
        title: {
            text: string;
            left: string;
            top: string;
            textStyle: {
                color: string;
                fontSize: number;
            };
        };
        graphic: {
            elements: {
                type: string;
                left: string;
                top: string;
                style: {
                    text: string;
                    font: string;
                    fill: string;
                };
            }[];
        };
    };
    $renderChartCommon(tableObject: any, options: any, type: any): any;
    addClickHighlightEffect(chartInstance: any, chartType: any): void;
    clearHighlight(chartInstance: any, chartType: any): void;
    onDestroy(): void;
}
