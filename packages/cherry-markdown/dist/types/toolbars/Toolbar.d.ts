/**
 * @typedef {()=>void} Bold 向cherry编辑器中插入粗体语法
 * @typedef {()=>void} Italic 向cherry编辑器中插入斜体语法
 * @typedef {(level:1|2|3|4|5|'1'|'2'|'3'|'4'|'5')=>void} Header  向cherry编辑器中插入标题语法
 * - level 标题等级 1~5
 * @typedef {()=>void} Strikethrough 向cherry编辑器中插入删除线语法
 * @typedef {(type:'ol'|'ul'|'checklist'|1|2|3|'1'|'2'|'3')=>void} List 向cherry编辑器中插入有序、无序列表或者checklist语法
 * - ol(1)有序
 * - ul(2)无序列表
 * - checklist(3)checklist
 * @typedef {`normal-table-${number}*${number}`} normalTableRowCol 插入表格语法约束
 * @typedef {(insert:'hr'|'br'|'code'|'formula'|'checklist'|'toc'|'link'|'image'|'video'|'audio'|'normal-table'|normalTableRowCol)=>void} Insert 向cherry编辑器中插入特定语法(需要在`toolbar`中预先配置功能)
 * - hr 水平分割线
 * - br 换行
 * - code 代码块
 * - formula 公式
 * - checklist 检查项
 * - toc 目录
 * - link 链接
 * - image 图片
 * - video 视频
 * - audio 音频
 * - normal-table 插入3行5列的表格
 * - normal-table-row*col 如normal-table-2*4插入2行(包含表头是3行)4列的表格
 * @typedef {(type:'1'|'2'|'3'|'4'|'5'|'6'|1|2|3|4|5|6|'flow'|'sequence'|'state'|'class'|'pie'|'gantt')=>void} Graph 向cherry编辑器中插入画图语法
 * - flow(1) 流程图
 * - sequence(2) 时序图
 * - state(3)状态图
 * - class(4)类图
 * - pie(5)饼图
 * - gantt(6)甘特图
 */
export default class Toolbar {
    constructor(options: any);
    /**
     * @typedef {{
     * bold?:Bold;
     * italic?:Italic;
     * header?:Header;
     * strikethrough?:Strikethrough;
     * list?:List;
     * insert?:Insert;
     * graph?:Graph;
     * [key:string]:any;
     * }} ToolbarHandlers
     * @type ToolbarHandlers 外部获取 toolbarHandlers 的部分功能
     */
    toolbarHandlers: {
        [key: string]: any;
        bold?: Bold;
        italic?: Italic;
        header?: Header;
        strikethrough?: Strikethrough;
        list?: List;
        insert?: Insert;
        graph?: Graph;
    };
    menus: HookCenter;
    shortcutKeyMap: {};
    subMenus: {};
    currentActiveSubMenu: any;
    options: {
        dom: HTMLDivElement;
        buttonConfig: string[];
        customMenu: any[];
    };
    $cherry: any;
    instanceId: any;
    init(): void;
    previewOnly(): void;
    showToolbar(): void;
    isHasLevel2Menu(name: any): string[];
    isHasConfigMenu(name: any): import("./MenuBase").SubMenuConfigItem[];
    /**
     * 判断是否有子菜单，目前有两种子菜单配置方式：1、通过`subMenuConfig`属性 2、通过`buttonConfig`配置属性
     * @param {string} name
     * @returns {boolean} 是否有子菜单
     */
    isHasSubMenu(name: string): boolean;
    /**
     * 根据配置画出来一级工具栏
     */
    drawMenus(): void;
    isPointerDown: boolean;
    appendMenusToDom(menus: any): void;
    setSubMenuPosition(menuObj: any, subMenuObj: any): void;
    drawSubMenus(name: any): void;
    /**
     * 处理点击事件
     */
    onClick(event: any, name: any, focusEvent?: boolean): void;
    /**
     * 激活二级菜单添加选中颜色
     * @param {string} name
     */
    activeSubMenuItem(name: string): void;
    updateSubMenuPosition(): void;
    /**
     * 展开/收起二级菜单
     */
    toggleSubMenu(name: any): void;
    /**
     * 隐藏所有的二级菜单
     */
    hideAllSubMenu(): void;
    /**
     * 收集工具栏的各项信息，主要有：
     *   this.toolbarHandlers
     *   this.menus.hooks
     *   this.shortcutKeyMap
     * @param {Toolbar} toolbarObj 工具栏对象
     */
    collectMenuInfo(toolbarObj: Toolbar): void;
    /**
     * 收集快捷键
     * @param {boolean} useUserSettings 是否使用用户配置的快捷键
     */
    collectShortcutKey(useUserSettings?: boolean): void;
    /**
     * 更新快捷键映射
     * @param {string} oldShortcutKey 旧的快捷键
     * @param {string} newShortcutKey 新的快捷键
     */
    updateShortcutKeyMap(oldShortcutKey: string, newShortcutKey: string): boolean;
    collectToolbarHandler(): void;
    /**
     * 监测是否有对应的快捷键
     * @param {KeyboardEvent} evt keydown 事件
     * @returns {boolean} 是否有对应的快捷键
     */
    matchShortcutKey(evt: KeyboardEvent): boolean;
    /**
     * 触发对应快捷键的事件
     * @param {KeyboardEvent} evt
     * @returns {boolean} 是否需要阻塞后续事件，true: 阻塞；false: 不阻塞
     */
    fireShortcutKey(evt: KeyboardEvent): boolean;
}
/**
 * 向cherry编辑器中插入粗体语法
 */
export type Bold = () => void;
/**
 * 向cherry编辑器中插入斜体语法
 */
export type Italic = () => void;
/**
 * 向cherry编辑器中插入标题语法
 * - level 标题等级 1~5
 */
export type Header = (level: 1 | 2 | 3 | 4 | 5 | '1' | '2' | '3' | '4' | '5') => void;
/**
 * 向cherry编辑器中插入删除线语法
 */
export type Strikethrough = () => void;
/**
 * 向cherry编辑器中插入有序、无序列表或者checklist语法
 * - ol(1)有序
 * - ul(2)无序列表
 * - checklist(3)checklist
 */
export type List = (type: 'ol' | 'ul' | 'checklist' | 1 | 2 | 3 | '1' | '2' | '3') => void;
/**
 * 插入表格语法约束
 */
export type normalTableRowCol = `normal-table-${number}*${number}`;
/**
 * 向cherry编辑器中插入特定语法(需要在`toolbar`中预先配置功能)
 * - hr 水平分割线
 * - br 换行
 * - code 代码块
 * - formula 公式
 * - checklist 检查项
 * - toc 目录
 * - link 链接
 * - image 图片
 * - video 视频
 * - audio 音频
 * - normal-table 插入3行5列的表格
 * - normal-table-row*col 如normal-table-2*4插入2行(包含表头是3行)4列的表格
 */
export type Insert = (insert: 'hr' | 'br' | 'code' | 'formula' | 'checklist' | 'toc' | 'link' | 'image' | 'video' | 'audio' | 'normal-table' | normalTableRowCol) => void;
/**
 * 向cherry编辑器中插入画图语法
 * - flow(1) 流程图
 * - sequence(2) 时序图
 * - state(3)状态图
 * - class(4)类图
 * - pie(5)饼图
 * - gantt(6)甘特图
 */
export type Graph = (type: '1' | '2' | '3' | '4' | '5' | '6' | 1 | 2 | 3 | 4 | 5 | 6 | 'flow' | 'sequence' | 'state' | 'class' | 'pie' | 'gantt') => void;
import HookCenter from "./HookCenter";
