/**
 * 设置按钮
 */
export default class Settings extends MenuBase {
    /**
     * TODO: 需要优化参数传入方式
     */
    constructor($cherry: any);
    engine: any;
    instanceId: any;
    shortcutKeyMap: {
        [x: string]: {
            hookName: string;
            sub: string;
            aliasName: any;
        };
    };
    /**
     * 获取子菜单数组
     * @returns {Array} 返回子菜单
     */
    getSubMenuConfig(): any[];
    /**
     * 监听快捷键，并触发回调
     * @param {string} shortCut 快捷键
     * @param {string} selection 编辑区选中的内容
     * @param {boolean} [async] 是否异步
     * @param {Function} [callback] 回调函数
     * @returns
     */
    bindSubClick(shortCut: string, selection: string, async?: boolean, callback?: Function): string;
    /**
     * 切换预览按钮
     * @param {boolean} isOpen 预览模式是否打开
     */
    togglePreviewBtn(isOpen: boolean): void;
    /**
     * 绑定预览事件
     */
    attachEventListeners(): void;
    /**
     * 响应点击事件
     * @param {string} selection 编辑区选中的内容
     * @param {string} shortKey 快捷键
     * @param {Function} [callback] 回调函数
     * @returns
     */
    onClick(selection: string, shortKey?: string, callback?: Function): string;
    shortcutKeyConfigPanel: ShortcutKeyConfigPanel;
    /**
     * 解析快捷键
     * @param {string} shortcutKey 快捷键
     * @returns
     */
    matchShortcutKey(shortcutKey: string): string;
    /**
     * 切换Toolbar显示状态
     */
    toggleToolbar(): void;
}
import MenuBase from "@/toolbars/MenuBase";
import ShortcutKeyConfigPanel from "@/toolbars/ShortcutKeyConfigPanel";
