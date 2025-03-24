export default class CodeBlockHandler {
    constructor(trigger: any, target: any, container: any, previewerDom: any, codeMirror: any, parent: any);
    /**
     * 用来存放所有的数据
     */
    codeBlockEditor: {
        info: {};
        editorDom: {};
    };
    trigger: any;
    target: any;
    previewerDom: any;
    container: any;
    codeMirror: any;
    $cherry: any;
    parent: any;
    $initReg(): void;
    codeBlockReg: any;
    emit(type: any, event?: {}, callback?: () => void): void;
    $remove(): void;
    $tryRemoveMe(event: any, callback: any): void;
    editing: boolean;
    /**
     * 定位代码块源代码在左侧Editor的位置
     */
    $findCodeInEditor(selectLang?: boolean): void;
    /**
     * 找到预览区被点击编辑按钮的代码块，并记录这个代码块在预览区域所有代码块中的顺位
     */
    $collectCodeBlockDom(): void;
    $collectCodeBlockCode(): void;
    $setBlockSelection(index: any): void;
    $setLangSelection(index: any): void;
    showBubble(isEnableBubbleAndEditorShow?: boolean): void;
    /**
     * 展示代码块编辑区的编辑器
     */
    $showContentEditor(): void;
    /**
     * 展示代码块区域的按钮
     */
    $showBtn(isEnableBubbleAndEditorShow: any): void;
    changeLangDom: any;
    editDom: HTMLDivElement;
    copyDom: HTMLDivElement;
    codeBlockCustomBtns: any[];
    unExpandDom: HTMLDivElement;
    $hideAllBtn(): void;
    /**
     * 切换代码块的语言
     */
    $changeLang(lang: any): void;
    $drawEditor(): void;
    /**
     * 处理扩展、缩起代码块的操作
     */
    $expandCodeBlock(isExpand?: boolean): void;
    /**
     * 处理复制代码块的操作
     */
    $copyCodeBlock(): boolean;
    /**
     * 更新代码块复制、编辑等按钮的位置
     */
    $updateContainerPosition(): void;
    /**
     * 更新编辑器的位置（尺寸和位置）
     */
    $updateEditorPosition(): void;
    /**
     * 设置codemirror偏移
     */
    $setInputOffset(): void;
    setStyle(element: any, property: any, value: any): void;
    $getPosition(): {
        top: number;
        height: any;
        width: any;
        left: number;
        maxHeight: any;
    };
}
