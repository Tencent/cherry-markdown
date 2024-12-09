export default class HookCenter {
    constructor(toolbar: any);
    toolbar: any;
    /**
     * @type {{[key: string]: import('@/toolbars/MenuBase').default}} 保存所有菜单实例
     */
    hooks: {
        [key: string]: import("@/toolbars/MenuBase").default;
    };
    /**
     * @type {string[]} 所有注册的菜单名称
     */
    allMenusName: string[];
    /**
     * @type {string[]} 一级菜单的名称
     */
    level1MenusName: string[];
    /**
     * @type {{ [parentName: string]: string[]}} 二级菜单的名称, e.g. {一级菜单名称: [二级菜单名称1, 二级菜单名称2]}
     */
    level2MenusName: {
        [parentName: string]: string[];
    };
    menuOptionsKey: string[];
    /**
     * 实例化菜单
     * @param {string} name 菜单名称
     * @param {null|import('../../types/menus').CustomMenuConfig} options 菜单配置项
     * @returns
     */
    $newMenu(name: string, options?: null | import('../../types/menus').CustomMenuConfig): void;
    /**
     * 根据配置动态渲染、绑定工具栏
     * @returns
     */
    init(): void;
}
