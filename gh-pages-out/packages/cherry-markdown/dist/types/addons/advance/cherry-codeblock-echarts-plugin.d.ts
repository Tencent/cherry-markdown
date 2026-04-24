export default class EChartsCodeBlockEngine {
    static install(cherryOptions: any, ...args: any[]): void;
    constructor(echartsOptions?: {});
    size: any;
    enableJs: any;
    echartsRef: any;
    srcCache: Map<any, any>;
    /**
     * 解析 ECharts option 字符串。
     * 优先使用 JSON5.parse（仅支持纯数据）。
     * 失败后 fallback 到 new Function 执行 JS 对象字面量（支持函数、正则等 JS 语法），
     * @param {string} src 代码块源码
     * @returns {object} 解析后的 ECharts option 对象
     */
    parseOption(src: string): object;
    render(src: any, sign: any, $engine: any, language: any): string;
}
