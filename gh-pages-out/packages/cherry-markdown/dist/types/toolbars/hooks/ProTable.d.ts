/**
 * 图表表格工具栏组合
 */
export default class ProTable extends MenuBase {
    constructor($cherry: any);
    localeName: any;
    /**
     * 获取子菜单数组
     * @returns {Array} 返回子菜单
     */
    getSubMenuConfig(): any[];
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
    /**
     * 插入散点图表格
     */
    insertScatterTable(selection: any): string;
    /**
     * 插入桑基图表格
     */
    insertSankeyTable(selection: any): string;
}
import MenuBase from '@/toolbars/MenuBase';
