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
     * TODO: 这里是分别对文本框、操作符号和选项设置偏移，应该作为一个整体来设置
     */
    $setInputOffset(): void;
    /**
     * 刷新操作符位置
     */
    $setSymbolOffset(): void;
    /**
     * 刷新定位
     */
    $refreshPosition(): void;
    $remove(): void;
    /**
     * 收集编辑器中的表格语法，并记录表格语法的开始的offset
     */
    $collectTableCode(): void;
    /**
     * 获取预览区域被点击的table对象，并记录table的顺位
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
     */
    $getTdOffset(tableCode: string, isTHead: boolean, trIndex: number, tdIndex: number): {
        preLine: number;
        preCh: number;
        plusCh: number;
        currentTd: string;
    };
    /**
     * 在编辑器里找到对应的表格源码，并让编辑器选中
     */
    $findTableInEditor(): boolean;
    $initReg(): void;
    tableReg: any;
    codeBlockReg: any;
    showBubble(): void;
    /**
     * 判断是否处于编辑状态
     * @returns {boolean}
     */
    $isEditing(): boolean;
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
     * 绘制操作符号
     */
    $drawSymbol(): void;
    $drawSortSymbol(): void;
    $setSortSymbolsPosition(): void;
    /**
     * 添加上一行
     */
    $addLastRow(): void;
    /**
     * 添加下一行
     */
    $addNextRow(): void;
    /**
     * 添加上一列
     */
    $addLastCol(): void;
    /**
     * 添加下一列
     */
    $addNextCol(): void;
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
    $doHighlightRow(style?: string): void;
    /**
     * 添加删除按钮
     */
    $drawDelete(): void;
    /**
     * 设置删除按钮的位置
     */
    $setDeleteButtonPosition(): void;
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
    $dragSymbol(objTarget: any, oldIndex: any, index: any, type: any): void;
    $operateLines(oldIndex: any, index: any, lines: any): any;
}
