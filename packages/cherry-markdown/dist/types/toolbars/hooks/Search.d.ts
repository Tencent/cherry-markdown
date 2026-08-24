export default class Search extends MenuBase {
    /**
     * @param {object} $cherry Cherry 实例
     *
     * Mod+H 仅在 `enableReplace !== false` 时注册（构造时读取配置，改配置需重新 new Cherry）。
     */
    constructor($cherry: object);
    shortcutKeyMap: {
        [x: string]: {
            hookName: string;
            aliasName: string;
        };
    };
    /** 遍历所有搜索工具栏按钮（toolbar / sidebar 可能各有一个） */
    forEachSearchButton(callback: any): void;
    /** 根据 enableReplace 同步 tooltip：「搜索」或「搜索/替换」 */
    syncToolbarLabel(): void;
    /** @param {HTMLElement} btnDom */
    afterInit(btnDom: HTMLElement): void;
    /** @param {boolean} active */
    setToolbarActive(active: boolean): void;
    /** 再次点击工具栏按钮时关闭面板 */
    toggleToolbarPanel(): boolean;
    /** @param {string} selection @param {string} [aliasName] */
    onClick(selection: string, aliasName?: string): void;
}
import MenuBase from '../../toolbars/MenuBase';
