/**
 * 用于在表格上出现编辑区，并提供拖拽行列的功能
 */
export default class TableHandler {
    constructor(trigger: any, target: any, container: any, previewerDom: any, codeMirror: any, tableElement: any, cherry: any);
    /**
     * 用来存放所有的数据
     */
    tableEditor: {
        info: {};
        tableCodes: any[];
        footnoteTableCodes: any[];
        editorDom: {};
    };
    trigger: any;
    target: any;
    previewerDom: any;
    container: any;
    codeMirror: any;
    tableElement: any;
    $cherry: any;
    emit(type: any, event?: {}, callback?: () => void): void;
    $tryRemoveMe(event: any, callback: any): void;
    /**
     * 获取目标dom的位置信息和尺寸信息
     */
    $getPosition(node?: any): {
        top: number;
        height: any;
        width: any;
        left: number;
        maxHeight: any;
    };
    setStyle(element: any, property: any, value: any): void;
    /**
     * 通用的边界检查方法
     * @param {number} index - 要检查的索引
     * @param {number} maxLength - 最大长度
     * @param {string} context - 上下文信息（用于错误日志）
     * @returns {boolean} 是否在有效范围内
     */
    $validateBounds(index: number, maxLength: number, context?: string): boolean;
    /**
     * TODO: 这里是分别对文本框、操作符号和选项设置偏移，应该作为一个整体来设置
     */
    $setInputOffset(): void;
    /**
     * 刷新定位
     */
    $refreshPosition(): void;
    $remove(): void;
    boundaryCache: {
        tableRect?: undefined;
        colBoundaries?: undefined;
        rowBoundaries?: undefined;
        firstRowCellCount?: undefined;
        rowCount?: undefined;
    } | {
        tableRect: {
            top: any;
            left: any;
            width: any;
            height: any;
        };
        colBoundaries: {
            index: any;
            pos: any;
        }[];
        rowBoundaries: {
            index: number;
            pos: any;
        }[];
        firstRowCellCount: any;
        rowCount: any;
    };
    boundaryTableRef: any;
    boundaryMouseMoveHandlerRef: (e: any) => void;
    boundaryGlobalMoveRef: (evt: any) => void;
    /**
     * 收集编辑器中的表格语法，并记录表格语法的开始的offset
     * 支持markdown表格语法和HTML table标签
     */
    $collectTableCode(): void;
    /**
     * 获取预览区域被点击的table对象，并记录table的顺位
     * 支持cherry-table类的表格和原生HTML table标签
     */
    $collectTableDom(): boolean;
    /**
     * 选中对应单元格、所在行、所在列的内容
     * @param {Number} index
     * @param {String} type 'td': 当前单元格, 'table': 当前表格
     * @param {Boolean} select 是否选中编辑器中的代码
     */
    $setSelection(index: number, type?: string, select?: boolean): void;
    /**
     * 获取对应单元格的偏移量
     * @param {String} tableCode
     * @param {Boolean} isTHead
     * @param {Number} trIndex
     * @param {Number} tdIndex
     * @param {Boolean} isInBlock
     */
    $getTdOffset(tableCode: string, isTHead: boolean, trIndex: number, tdIndex: number, isInBlock?: boolean): {
        preLine: number;
        preCh: number;
        plusCh: number;
        currentTd: string;
    };
    /**
     * 获取引用语法中表格对应单元格的偏移量
     * @param {String} tableCode
     * @param {Boolean} isTHead
     * @param {Number} trIndex
     * @param {Number} tdIndex
     */
    $getBlockquoteTdOffset(tableCode: string, isTHead: boolean, trIndex: number, tdIndex: number): {
        preLine: number;
        preCh: number;
        plusCh: number;
        currentTd: string;
    };
    /**
     * 获取HTML表格中对应单元格的偏移量
     * @param {String} tableCode HTML表格代码
     * @param {Number} trIndex 行索引
     * @param {Number} tdIndex 列索引
     */
    $getHtmlTdOffset(tableCode: string, trIndex: number, tdIndex: number): {
        preLine: number;
        preCh: number;
        plusCh: number;
        currentTd: string;
    };
    /**
     * 在编辑器里找到对应的表格源码，并让编辑器选中
     * 支持markdown表格语法和HTML table标签的定位
     */
    $findTableInEditor(): boolean;
    $initReg(): void;
    tableReg: any;
    codeBlockReg: any;
    htmlTableReg: RegExp;
    blockquoteHtmlTableReg: RegExp;
    /**
     * 收集HTML table标签
     */
    $collectHtmlTableCode(editorValue: any, tableCodes: any, footnoteTableCodes: any, isInFootnote: any): void;
    /**
     * 基于表格内容进行智能匹配
     */
    $findTableByContent(): number;
    /**
     * 从HTML表格代码中提取纯文本内容
     */
    $extractHtmlTableText(htmlCode: any): string;
    /**
     * 获取引用语法中HTML表格对应单元格的偏移量
     * @param {String} tableCode 引用块中的HTML表格代码
     * @param {Number} trIndex 行索引
     * @param {Number} tdIndex 列索引
     */
    $getBlockquoteHtmlTdOffset(tableCode: string, trIndex: number, tdIndex: number): {
        preLine: number;
        preCh: number;
        plusCh: number;
        currentTd: string;
    };
    showBubble(): void;
    /**
     * 把表格上的input单行文本框和操作符号画出来
     */
    $drawEditor(): void;
    $onInputChange(e: any): void;
    /**
     * 更新编辑器的位置（尺寸和位置）
     */
    $updateEditorPosition(): void;
    $getClosestNode(node: any, targetNodeName: any): any;
    /**
     * 绘制插入行列操作符号
     */
    $drawSymbol(): void;
    /**
     * 根据当前表格刷新 添加行列按钮 的位置
     */
    $updateBoundaryTriggerPosition(): void;
    /**
     * 执行表格操作后的通用清理工作
     */
    $afterTableOperation(): void;
    /**
     * 添加行
     * @param {string|number} position - 插入位置：'top' | 'bottom' | number (中间插入的行索引)
     */
    $insertRow(position: string | number): void;
    /**
     * 获取单元格对齐方式
     * @param {*} cells 单元格数组
     * @param {*} index 单元格索引
     * @returns {string} 单元格对齐方式，如果是false则表示不生成对齐方式
     */
    $getTdAlign(cells: any, index: any, cellsIndex: any): string;
    /**
     * 添加列
     * 有两种风格的表格，需要分别处理
     * 风格一（type1）：
     * | Header | Header | Header | Header |
     * |:---|:---:|---:| ------ |
     * | Sample | Sample | Sample | Sample |
     * | Sample | Sample | Sample | Sample |
     * | Sample | Sample | Sample | Sample |
     * 风格二（type2）：
     * Header | Header | Header
     * ------ | ------ | ------
     * Sample |111e | Sample
     * Sample | Sample | Sample
     */
    $insertCol(): void;
    /**
     * 菜单按钮
     */
    $drawMenu(): void;
    /**
     * 为菜单按钮添加拖拽功能
     * @param {HTMLElement} button - 菜单按钮元素
     * @param {string} type - 按钮类型 ('top', 'left')
     */
    $addDragFunctionalityToMenuButton(button: HTMLElement, type: string): void;
    /**
     * 为按钮添加行拖拽功能
     * @param {HTMLElement} button - 菜单按钮元素
     */
    $addRowDragFunctionality(button: HTMLElement): void;
    /**
     * 为顶部按钮添加列拖拽功能
     * @param {HTMLElement} button - 菜单按钮元素
     */
    $addColumnDragFunctionality(button: HTMLElement): void;
    /**
     * 高亮当前列
     */
    $highlightCurrentColumn(): void;
    /**
     * 取消高亮当前列
     */
    $unhighlightCurrentColumn(): void;
    /**
     * 清除所有高光效果（包括边框和背景）
     */
    $clearAllBorders(): void;
    /**
     * 清除指定表格的所有高光效果
     * @param {HTMLTableElement} table - 表格元素
     */
    $clearTableHighlights(table: HTMLTableElement): void;
    /**
     * 高亮一列单元格的指定边框
     * @param {number} columnIndex
     * @param {'left'|'right'|'top'|'bottom'} position
     */
    $highlightColumnCellsDom(columnIndex: number, position: "left" | "right" | "top" | "bottom"): void;
    /**
     * 高亮当前列
     */
    $highlightColumn(): void;
    /**
     * 取消高亮当前列
     */
    $cancelHighlightColumn(): void;
    /**
     * 高亮当前行
     */
    $highlightRow(): void;
    /**
     * 取消高亮当前行
     */
    $cancelHighlightRow(): void;
    $applyRowHighlight(add: any): void;
    /**
     * 设置菜单按钮的位置
     */
    $setMenuButtonPosition(): void;
    /**
     * 创建菜单气泡
     */
    $createMenuBubble(type: any): HTMLDivElement;
    /**
     * 获取表格菜单配置
     */
    $getMenuConfig(type: any): ({
        id: string;
        icon: string;
        title: any;
        action: string;
        highlight: string;
        showIn: string[];
    } | {
        id: string;
        icon: string;
        title: string;
        action: string;
        showIn: string[];
        highlight?: undefined;
    })[];
    /**
     * 创建菜单选项
     */
    $createMenuOption(config: any, type: any): HTMLDivElement;
    /**
     * 执行菜单动作
     */
    $executeMenuAction(action: any, type: any): void;
    /**
     * 列对齐方法
     * @param {string} alignment - 对齐方式：'left', 'center', 'right'
     */
    $alignColumn(alignment: string): void;
    /**
     * 在markdown表格中设置列对齐（支持普通表格和引用表格）
     * @param {Array} lines - 表格行数组
     * @param {number} columnIndex - 列索引
     * @param {string} alignment - 对齐方式
     */
    $alignColumnInMarkdownTable(lines: any[], columnIndex: number, alignment: string): void;
    /**
     * 高亮元素
     */
    $highlightElement(elementType: any): void;
    /**
     * 取消高亮元素
     */
    $cancelHighlightElement(elementType: any): void;
    /**
     * 切换菜单气泡显示状态
     */
    $toggleMenuBubble(button: any, bubble: any): void;
    /**
     * 显示菜单气泡
     */
    $showMenuBubble(button: any, bubble: any): void;
    /**
     * 隐藏菜单气泡
     */
    $hideMenuBubble(bubble: any): void;
    /**
     * 删除当前行
     */
    $deleteCurrentRow(): void;
    /**
     * 删除当前列
     */
    $deleteCurrentColumn(): void;
    /**
     * 拖拽列
     */
    $dragCol(): void;
    /**
     * 拖拽行
     */
    $dragLine(): void;
    /**
     * 拖拽过程中的视觉反馈
     * @param {HTMLElement} objTarget - 目标元素
     * @param {number} oldIndex - 原始索引
     * @param {number} index - 新索引
     * @param {string} type - 类型 ('Col' 或 'Line')
     */
    $dragSymbol(objTarget: HTMLElement, oldIndex: number, index: number, type: string): void;
    /**
     * 显示列拖拽的视觉反馈
     * @param {HTMLElement} objTarget - 目标元素
     * @param {number} oldIndex - 原始索引
     * @param {number} index - 新索引
     */
    $showColumnDragFeedback(objTarget: HTMLElement, oldIndex: number, index: number): void;
    /**
     * 显示行拖拽的视觉反馈
     * @param {HTMLElement} objTarget - 目标元素
     * @param {number} oldIndex - 原始索引
     * @param {number} index - 新索引
     */
    $showRowDragFeedback(objTarget: HTMLElement, oldIndex: number, index: number): void;
    $operateLines(oldIndex: any, index: any, lines: any): any;
}
