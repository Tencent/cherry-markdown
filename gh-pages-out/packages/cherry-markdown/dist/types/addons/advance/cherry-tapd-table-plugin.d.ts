/**
 * [TAPD](https://tapd.cn)的简单表格语法
 * 该表格语法不是markdown通用的表格语法，请谨慎使用
 * 该简单表格语法特点：
 *    1、轻量，不需要强制指定表头和对齐方式
 *    2、支持单元格合并，打开合并开关后，多个连续相同的cell会自动进行单元格合并
 * 例子：
 *    带标题：
 *    ||~项目                       ||~价格(居中)~   ||数量（右对齐）~  ||
 *    || 计算机 <br >(包括笔记本)  || $1600  ||   5    ||
 *    || 手机                       || $12    ||   5    ||
 *    || 管线                       || $1     ||   5    ||
 *    不带标题：
 *    || 计算机 <br >(包括笔记本)  || $1600  ||   5    ||
 *    || 手机                       || $12    ||   5    ||
 *    || 管线                       || $1     ||   5    ||
 *    自动合并：
 *    |||~项目                      ||价格   ||数量  ||
 *    || 计算机  || $3600（高配）  ||   20    ||
 *    || 笔记本  || $2600（中配）  ||   30    ||
 *    || 笔记本  || $1600（低配）  ||   40    ||
 *    || 总计                       || $214000   ||   90    ||
 */
export default class TapdTablePlugin extends ParagraphBase {
    constructor();
    cacheMap: {};
    sentenceMakeFunc: any;
    /**
     * 根据当前坐标，获取同一行下一列的坐标
     * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
     * @returns {string} 新坐标
     */
    $nextTdKey(key: string): string;
    /**
     * 根据当前坐标，获取同一行上一列的坐标
     * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
     * @returns {string} 新坐标
     */
    $prevTdKey(key: string): string;
    /**
     * 根据当前坐标，获取同一列下一行的坐标
     * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
     * @returns {string} 新坐标
     */
    $nextTrKey(key: string): string;
    /**
     * 根据当前坐标，获取同一列上一行的坐标
     * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
     * @returns {string} 新坐标
     */
    $prevTrKey(key: string): string;
    /**
     * 设置每一个cell的colspan属性
     * @param {Object} map 存储每一个cell对应的rowspan和colspan值
     * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
     * @returns {Object} map
     */
    $setColMapVal(map: any, key: string): any;
    /**
     * 设置每一个cell的rowspan属性
     * @param {Object} map 存储每一个cell对应的rowspan和colspan值
     * @param {string} key 坐标，数据格式为：行坐标-列坐标；也可以理解为 tr.num-td.num
     * @returns {Object} map
     */
    $setRowMapVal(map: any, key: string): any;
    $dealColSpan(trIndex: any, tdIndex: any, tr: any, spanMap: any): any;
    $dealRowSpan(trIndex: any, tdIndex: any, trs: any, spanMap: any): any;
    $getSpanKey(trIndex: any, tdIndex: any): string;
    $getColAndRowSpanMap(trs: any): {};
    $convertTrsString2Array(trs: any): any;
    $isMeerged(span: any, key: any): boolean;
    $getTdSpan(spanMap: any, key: any): string;
    $dealTh(oneTh: any): {
        style: string;
        content: string;
    };
    makeHtml(html: any, sentenceMakeFunc: any): any;
    rule(): {};
}
import ParagraphBase from '@/core/ParagraphBase';
