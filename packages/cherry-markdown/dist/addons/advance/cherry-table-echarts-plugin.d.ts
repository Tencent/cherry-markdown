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
    getInstance(): any;
    render(type: any, options: any, tableObject: any): any;
    renderBarChart(tableObject: any, options: any): any;
    renderLineChart(tableObject: any, options: any): any;
    $renderChartCommon(tableObject: any, options: any, type: any): any;
    onDestroy(): void;
}
