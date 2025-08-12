/**
 * 图表表格工具栏组合
 */
export default class ProTable extends MenuBase {
    constructor($cherry: any);
    /**
     * 获取子菜单数组
     * @returns {Array} 返回子菜单
     */
    getSubMenuConfig(): any[];
    /**
     * 绑定子菜单点击事件
     * @param {string} type 图表类型
     * @param {string} selection 编辑区选中的内容
     * @param {boolean} [async] 是否异步
     * @param {Function} [callback] 回调函数
     */
    bindSubClick(type: string, selection: string, async?: boolean, callback?: Function): string;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键或子菜单类型
     * @returns {string} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey?: string): string;
    /**
     * 插入折线图表格
     */
    insertLineTable(selection: any): string;
    /**
     * 插入柱状图表格
     */
    insertBarTable(selection: any): string;
    /**
     * 插入雷达图表格
     */
    insertRadarTable(selection: any): string;
    /**
     * 插入地图表格
     */
    insertMapTable(selection: any): string;
    /**
     * 插入热力图表格
     */
    insertHeatmapTable(selection: any): string;
    /**
     * 插入饼图表格
     */
    insertPieTable(selection: any): string;
}
import MenuBase from "@/toolbars/MenuBase";
