/**
 * @typedef {import('@/Editor').default} Editor
 */
/**
 * @typedef {Partial<import('@/Cherry').default> & {$currentMenuOptions?:import('../../types/menus').CustomMenuConfig}} MenuBaseConstructorParams
 */
/**
 * @class MenuBase
 */
export default class MenuBase {
    /**
     * 根据按钮获取按钮的父元素，这里父元素要绕过toolbar-(left|right)那一层
     * @param {HTMLElement} dom 按钮元素
     * @returns {HTMLElement} 父元素
     */
    static getTargetParentByButton(dom: HTMLElement): HTMLElement;
    /**
     * @param {MenuBaseConstructorParams} $cherry
     */
    constructor($cherry: MenuBaseConstructorParams);
    /**
     * @deprecated
     * @type {MenuBase['fire']}
     */
    _onClick: MenuBase['fire'];
    $cherry: MenuBaseConstructorParams;
    bubbleMenu: boolean;
    subMenu: any;
    $currentMenuOptions: import("../../types/menus").CustomMenuConfig;
    name: string;
    iconName: string;
    /** @type {import('../../types/menus').MenuIconType} */
    iconType: import('../../types/menus').MenuIconType;
    editor: import("@/Editor").default;
    locale: any;
    dom: HTMLSpanElement;
    updateMarkdown: boolean;
    /** @type {SubMenuConfigItem[]} */
    subMenuConfig: SubMenuConfigItem[];
    noIcon: boolean;
    cacheOnce: boolean;
    /**
     * 子菜单的定位方式
     * @property
     * @type {'absolute' | 'fixed' | 'sidebar'}
     */
    positionModel: 'absolute' | 'fixed' | 'sidebar';
    /**
     * 处理菜单项点击事件
     * @param {MouseEvent | KeyboardEvent | undefined} [event] 点击事件
     * @returns {void}
     */
    fire(event?: MouseEvent | KeyboardEvent | undefined, shortKey?: string): void;
    /**
     * 快捷键map映射
     * @type {HookShortcutKeyMap}
     */
    shortcutKeyMap: HookShortcutKeyMap;
    getSubMenuConfig(): SubMenuConfigItem[];
    /**
     * 设置菜单
     * @param {string} name 菜单名称
     * @param {string} [iconName] 菜单图标名
     */
    setName(name: string, iconName?: string): void;
    /**
     * 设置一个一次性缓存
     * 使用场景：
     *  当需要异步操作是，比如上传视频、选择字体颜色、通过棋盘插入表格等
     * 实现原理：
     *  1、第一次点击按钮时触发fire()方法，触发选择文件、选择颜色、选择棋盘格的操作。此时onClick()不返回任何数据。
     *  2、当异步操作完成后（如提交了文件、选择了颜色等），调用本方法（setCacheOnce）实现缓存，最后调用fire()方法
     *  3、当fire()方法再次调用onClick()方法时，onClick()方法会返回缓存的数据（getAndCleanCacheOnce）
     *
     * 这么设计的原因：
     *  1、可以复用MenuBase的相关方法
     *  2、避免异步操作直接与codemirror交互
     * @param {*} info
     */
    setCacheOnce(info: any): void;
    getAndCleanCacheOnce(): boolean;
    hasCacheOnce(): boolean;
    /**
     * 创建一个IconFont类型的图标
     * @param {string} iconName
     * @param {object} options
     */
    createIconFontIcon(iconName: string, options?: object): HTMLElement;
    /**
     * 创建一个SVG类型的图标
     * @param {import('../../types/menus').CustomMenuIcon} options
     */
    createSvgIcon(options: import('../../types/menus').CustomMenuIcon): Element;
    /**
     * 创建一个Image类型的图标
     * @param {import('../../types/menus').CustomMenuIcon} options
     */
    createImageIcon(options: import('../../types/menus').CustomMenuIcon): HTMLImageElement;
    /**
     * 创建一个一级菜单
     * @param {boolean} asSubMenu 是否以子菜单的形式创建
     */
    createBtn(asSubMenu?: boolean): HTMLSpanElement;
    /**
     * 通过配置创建一个二级菜单
     * @param {SubMenuConfigItem} config 配置
     */
    createSubBtnByConfig(config: SubMenuConfigItem): HTMLSpanElement;
    isSelections: boolean;
    /**
     * 获取当前选择区域的range
     */
    $getSelectionRange(): {
        begin: import("codemirror").Position;
        end: import("codemirror").Position;
    };
    /**
     * 注册点击事件渲染后的回调函数
     * @param {function} cb
     */
    registerAfterClickCb(cb: Function): void;
    afterClickCb: Function;
    /**
     * 点击事件渲染后的回调函数
     */
    $afterClick(): void;
    /**
     * 选中除了前后语法后的内容
     * @param {String} lessBefore
     * @param {String} lessAfter
     */
    setLessSelection(lessBefore: string, lessAfter: string): void;
    /**
     * 基于当前已选择区域，获取更多的选择区
     * @param {string} [appendBefore] 选择区前面追加的内容
     * @param {string} [appendAfter] 选择区后面追加的内容
     * @param {function} [cb] 回调函数，如果返回false，则恢复原来的选取
     */
    getMoreSelection(appendBefore?: string, appendAfter?: string, cb?: Function): void;
    /**
     * 获取用户选中的文本内容，如果没有选中文本，则返回光标所在的位置的内容
     * @param {string} selection 当前选中的文本内容
     * @param {string} type  'line': 当没有选择文本时，获取光标所在行的内容； 'word': 当没有选择文本时，获取光标所在单词的内容
     * @param {boolean} focus true；强行选中光标处的内容，否则只获取选中的内容
     * @returns {string}
     */
    getSelection(selection: string, type?: string, focus?: boolean): string;
    /**
     * 反转子菜单点击事件参数顺序
     * @deprecated
     */
    bindSubClick(shortcut: any, selection: any): void;
    onClick(selection: any, shortcut: any, callback: any): any;
    /**
     * 兼容之前的写法，但不支持配置
     */
    get shortcutKeys(): any[];
    /**
     * 更新菜单图标
     * @param {import('../../types/menus').CustomMenuConfig['icon']} options 图标配置
     */
    updateMenuIcon(options: import('../../types/menus').CustomMenuConfig['icon']): boolean;
    /**
     * 获取当前菜单的位置
     */
    getMenuPosition(): Pick<DOMRect, "height" | "width" | "left" | "top">;
    hide(): void;
    show(): void;
    /**
     * 绑定子菜单点击事件
     * @param {HTMLDivElement} subMenuDomPanel
     * @returns {number} 当前激活的子菜单索引
     */
    getActiveSubMenuIndex(subMenuDomPanel: HTMLDivElement): number;
}
export type SubMenuConfigItem = {
    /**
     * - 子菜单项名称
     */
    name: string;
    /**
     * - 子菜单项图标名称
     */
    iconName?: string | undefined;
    /**
     * - 子菜单项点击事件
     */
    onclick: (arg0: MouseEvent) => any;
    /**
     * - 子菜单项图标(url)
     */
    icon?: string | undefined;
    /**
     * - 是否禁用后续调用hideAllSubMenu
     */
    disabledHideAllSubMenu?: boolean | undefined;
};
export type HookShortcutKeyMap = Record<string, import('../../types/cherry').ShortcutKeyMapStruct>;
export type Editor = import('@/Editor').default;
export type MenuBaseConstructorParams = Partial<import('@/Cherry').default> & {
    $currentMenuOptions?: import('../../types/menus').CustomMenuConfig;
};
