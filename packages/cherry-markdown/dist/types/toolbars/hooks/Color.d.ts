/**
 * 插入字体颜色或者字体背景颜色的按钮
 */
export default class Color extends MenuBase {
    constructor($cherry: any);
    bubbleColor: BubbleColor;
    /**
     * 响应点击事件
     * @param {string} selection 被用户选中的文本内容
     * @param {string} shortKey 快捷键参数，color: #000000 | background-color: #000000
     * @param {Event & {target:HTMLElement}} event 点击事件，用来从被点击的调色盘中获得对应的颜色
     * @returns {string | undefined} 回填到编辑器光标位置/选中文本区域的内容
     */
    onClick(selection: string, shortKey: string, event: Event & {
        target: HTMLElement;
    }): string | undefined;
    /**
     * 计算调色盘应该显示的位置
     * @param {Event & {target:HTMLElement}} event 点击事件
     * @returns {{left: number, top: number}} 位置坐标
     */
    calculatePickerPosition(event: Event & {
        target: HTMLElement;
    }): {
        left: number;
        top: number;
    };
    /**
     * 解析颜色语法
     * @param {string} selection 选中的文本
     * @returns {{textColor: string|null, bgColor: string|null, text: string}}
     */
    parseAppliedColors(selection: string): {
        textColor: string | null;
        bgColor: string | null;
        text: string;
    };
    /**
     * 根据传入的颜色构建最终的样式字符串
     * @param {string|null} textColor 文字颜色
     * @param {string|null} bgColor 背景颜色
     * @param {string} text 文本内容
     * @returns {string}
     */
    buildStyleString(textColor: string | null, bgColor: string | null, text: string): string;
    $testIsShortKey(shortKey: any): boolean;
    $getTypeAndColor(shortKey: any): boolean | {
        type: string;
        color: any;
    };
    hideOtherSubMenu(hideAllSubMenu: any): void;
}
import MenuBase from '@/toolbars/MenuBase';
/**
 * 调色盘
 */
declare class BubbleColor {
    constructor($cherry: any);
    /**
     * 定义调色盘每个色块的颜色值
     */
    presetColors: string[][];
    editor: any;
    $cherry: any;
    locale: any;
    currentColor: string;
    currentType: string;
    currentHue: number;
    currentSaturation: number;
    currentBrightness: number;
    isDragging: string;
    cachedElements: Map<any, any>;
    recentColors: any;
    init(): void;
    dom: HTMLDivElement;
    /**
     * 获取并缓存DOM元素，避免重复查询
     * @param {string} selector CSS选择器
     * @returns {HTMLElement|null} DOM元素
     */
    getElement(selector: string): HTMLElement | null;
    /**
     * 清理DOM元素缓存
     */
    clearElementCache(): void;
    getDom(): HTMLDivElement;
    /**
     * 创建颜色选择器主体区域
     */
    createColorPicker(): string;
    /**
     * 创建颜色项的通用方法
     * @param {string} color 颜色值
     * @param {boolean} isEmpty 是否为空项
     * @param {string} itemClass 项目类名
     * @returns {string} HTML字符串
     */
    createColorItem(color: string, isEmpty?: boolean, itemClass?: string): string;
    /**
     * 创建最近使用颜色区域
     */
    createRecentColors(): string;
    /**
     * 创建预设颜色区域
     */
    createPresetColors(): string;
    initAction(): void;
    /**
     * 设置鼠标交互事件
     */
    setupMouseInteractions(): void;
    /**
     * 检查元素是否属于颜色选择器的特定区域
     */
    isColorPickerElement(target: any, type: any): any;
    /**
     * 处理颜色交互（点击或拖拽）
     */
    handleColorInteraction(evt: any, type: any): void;
    /**
     * 设置点击事件处理器
     */
    setupClickHandlers(): void;
    /**
     * 处理文字颜色/背景颜色切换
     */
    handleTabSwitch(target: any): void;
    /**
     * 处理清除颜色
     */
    handleClearColor(): void;
    /**
     * 处理颜色项点击
     */
    handleColorItemClick(target: any): void;
    /**
     * 在对应的坐标展示/关闭调色盘
     * @param {object} [options={}]
     * @param {number} [options.left] 调色盘显示的左边距位置（像素）
     * @param {number} [options.top] 调色盘显示的上边距位置（像素）
     * @param {object} [options.$color] 颜色组件实例的引用
     * @param {boolean} [options.forceHide=false] 强制隐藏调色盘。主要用于清除颜色操作后强制关闭面板
     */
    toggle({ left, top, $color, forceHide }?: {
        left?: number;
        top?: number;
        $color?: object;
        forceHide?: boolean;
    }): void;
    $color: any;
    /**
     * 设置颜色并更新HSV值
     */
    setColor(color: any): void;
    /**
     * 更新颜色相关的所有显示元素
     * @param {string} color 颜色值
     */
    updateColorDisplay(color: string): void;
    /**
     * 从HSV值更新当前颜色
     */
    updateColorFromHsv(): void;
    /**
     * 从颜色选择器获取颜色
     * 根据鼠标在饱和度/明度区域的位置计算对应的颜色值
     * @param {MouseEvent} e 鼠标事件，用于获取点击位置
     * @returns {string} 计算得到的十六进制颜色值
     */
    getColorFromPicker(e: MouseEvent): string;
    /**
     * 从色相条获取色相值
     * 根据鼠标在色相条上的位置计算对应的色相值
     * @param {MouseEvent} e 鼠标事件，用于获取点击位置
     * @returns {string} 计算得到的十六进制颜色值
     */
    getHueFromPicker(e: MouseEvent): string;
    /**
     * 更新颜色选择
     */
    updateColorSelection(color: any): void;
    /**
     * 更新颜色指针位置
     */
    updatePointers(): void;
    /**
     * 更新色相条背景
     */
    updateHueBackground(): void;
    /**
     * 更新最近使用颜色的显示
     */
    updateRecentColorsDisplay(): void;
    /**
     * 获取最近使用的颜色
     */
    getRecentColors(): any;
    /**
     * 保存最近使用的颜色
     */
    saveRecentColor(color: any): void;
}
export {};
