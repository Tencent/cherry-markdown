/**
 * 面板语法
 * 例：
 *  :::tip
 *  这是一段提示信息
 *  :::
 *  :::warning
 *  这是一段警告信息
 *  :::
 *  :::danger
 *  这是一段危险信息
 *  :::
 */
export default class Panel extends ParagraphBase {
    constructor(options: any);
    enableAlign: any;
    enablePanel: any;
    enableCols: any;
    enableTabs: any;
    enableTimeline: any;
    $tabsSeed: number;
    makeHtml(str: any, sentenceMakeFunc: any): any;
    $getClassByType(type: any): string;
    $getPanelInfo(name: any, str: any, sentenceMakeFunc: any): {
        type: string;
        title: any;
        body: any;
        appendStyle: string;
        className: string;
    };
    /**
     * 从 name 中解析多列排版语法的对齐关键字
     * 例如 name 为 "3cols center" 时返回 "center"
     * @param {string} name panel 头部关键字（例如 "3cols center"）
     * @returns {string} 对齐关键字（left|center|right|justify），未指定或非法时返回 'left'
     */
    $getColsAlign(name: string): string;
    /**
     * 从 name 中解析旧语法固定列数（2cols/3cols）
     * 新语法 cols 返回 0，表示由分隔符数量自动推断列数
     * @param {string} name panel 头部关键字
     * @returns {number} 固定列数（0 表示不固定）
     */
    $getFixedColCount(name: string): number;
    /**
     * 按 :: 分隔符拆分多列排版语法的内容
     * - 新语法（cols）：列数由分隔符数量自动推断，末尾空列会被 trim 掉
     * - 旧语法（2cols/3cols）：将结果补齐/截断到固定列数
     * - tabs 语法复用本方法，仅使用推断模式（fixedColCount = 0）
     * @param {string} str 面板内容
     * @param {number} fixedColCount 固定列数（0 表示由分隔符推断）
     * @returns {string[]} 拆分后的各列内容
     */
    $splitCols(str: string, fixedColCount: number): string[];
    $getTitle(name: any): any;
    $getTargetType(name: any): "left" | "right" | "center" | "primary" | "info" | "warning" | "danger" | "success" | "justify" | "cols" | "tabs" | "timeline";
    /**
     * 按行首的 `::` 标记拆分各个节点（timeline/tabs 共用）
     * 与 cols 不同，这里的 `::` 是行首标记（后面直接跟首行内容），并非独占一行的分隔符
     * 例：
     *   :: 标题/首行内容
     *     后续行1
     *     后续行2
     *   :: 标题/首行内容2
     *
     * @param {string} str 原始 body 文本
     * @returns {{head: string, body: string}[]} 每个节点的首行（`::` 所在行的剩余内容）与后续行
     */
    $splitItemsByColonMark(str: string): {
        head: string;
        body: string;
    }[];
    /**
     * 解析时间线单个节点，提取状态、时间、标题、描述
     * 节点首行（head）形如：[done] 2024-01-15 项目立项
     * @param {string} head 节点首行（`::` 所在行的剩余内容）
     * @param {string} body 节点描述（后续多行）
     * @returns {{status: string, time: string, title: string, desc: string}}
     */
    $parseTimelineItem(head: string, body: string): {
        status: string;
        time: string;
        title: string;
        desc: string;
    };
    /**
     * 规范化时间线状态修饰符
     * @param {string} raw 状态修饰符内容（不含中括号）
     * @returns {string} 规范化后的状态
     */
    $normalizeTimelineStatus(raw: string): string;
    rule(): any;
}
import ParagraphBase from '@/core/ParagraphBase';
