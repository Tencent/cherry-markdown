export default class ShortcutKeyConfigPanel {
    /**
     *
     * @param {Partial<import('@/Cherry').default> & {$currentMenuOptions?:import('~types/menus').CustomMenuConfig}} $cherry
     */
    constructor($cherry: Partial<import('@/Cherry').default> & {
        $currentMenuOptions?: import('~types/menus').CustomMenuConfig;
    });
    $cherry: Partial<import("@/Cherry").default> & {
        $currentMenuOptions?: import('~types/menus').CustomMenuConfig;
    };
    shortcutUlClassName: string;
    shortcutUlId: string;
    shortcutConfigPanelKbdClassName: string;
    shortcutKeyboardKeyClassName: string;
    activeTab: string;
    editingItem: HTMLElement;
    keyStack: any[];
    originalKeyStack: string[];
    handleTabClick: (e: MouseEvent) => void;
    handleEditBtnClick: (e: MouseEvent, item: HTMLElement) => void;
    handleDbClick: (e: MouseEvent) => void;
    handleSaveBtnClick: (e: MouseEvent, item: HTMLElement) => void;
    handleCancelBtnClick: (e: MouseEvent, item: HTMLElement) => void;
    handleKeyDown: (e: KeyboardEvent) => void;
    clickSettingsDisableBtn: () => void;
    clickSettingsRecoverBtn: () => void;
    /**
     * 开始编辑快捷键
     * @param {HTMLElement} item
     */
    startEdit(item: HTMLElement): void;
    handleClickOutside: (e: MouseEvent) => void;
    /**
     * 处理单个按键，返回对应的 HTML 字符串
     * @param {string} key 按键字符串
     * @param {boolean} [withCode=true] 是否包含 data-code 属性
     * @returns {string} 生成的 HTML 字符串
     */
    processKeyToSpan(key: string, withCode?: boolean): string;
    /**
     * 将按键数组转换为带分隔符的 HTML 字符串
     * @param {string[]} keys 按键数组
     * @param {boolean} [withCode=true] 是否在按键 span 中包含 data-code 属性
     * @returns {string} 生成的 HTML 字符串
     */
    processKeysToHtml(keys: string[], withCode?: boolean): string;
    /**
     * 更新快捷键显示内容
     * @param {HTMLElement} kbdContainer 快捷键容器元素
     * @param {string[]} keys 快捷键数组
     */
    updateKeyboardContainer(kbdContainer: HTMLElement, keys: string[]): void;
    /**
     * 更新提示文本
     * @param {'default' | 'editing' | 'static'} type 提示类型
     */
    updateTipText(type?: 'default' | 'editing' | 'static'): void;
    /**
     * 取消编辑的快捷键
     * @param {HTMLElement} item
     */
    cancelEdit(item: HTMLElement): void;
    /**
     * 保存编辑的快捷键
     * @param {HTMLElement} item
     */
    saveEdit(item: HTMLElement): void;
    /**
     * 更新编辑中的快捷键显示
     */
    updateEditingKeys(): void;
    /**
     * 切换快捷键配置面板的tab
     * @param {string} tabId
     */
    switchTab(tabId: string): void;
    /**
     * 初始化快捷键配置面板
     */
    init(): void;
    dom: HTMLDivElement;
    /**
     * 生成快捷键span标签HTML字符串
     * @param {Object} params 参数对象
     * @param {string} params.title 提示文本
     * @param {string} [params.code] 按键代码（可选）
     * @param {string} params.text 显示文本
     * @returns {string} 生成的HTML字符串
     */
    generateKeyboardKeySpan({ title, code, text }: {
        title: string;
        code?: string;
        text: string;
    }): string;
    /**
     * 获取快捷键的别名i18n
     * @param {string} aliasName
     * @returns {string} 别名
     */
    getAliasLocale(aliasName: string): string;
    /**
     * 生成快捷键配置面板HTML字符串
     * @returns {string} 生成的HTML字符串
     */
    generateShortcutKeyConfigPanelHtmlStr(): string;
    /**
     * 定义不支持修改的快捷键信息（是codemirror提供的类sublime快捷键）
     */
    $getStaticShortcut(): string;
    /**
     * 显示快捷键配置面板
     */
    show(): void;
    handleClick: (e: MouseEvent) => void;
    /**
     * 隐藏快捷键配置面板
     */
    hide(): void;
    isShow(): boolean;
    isHide(): boolean;
    /**
     * 展示/隐藏快捷键配置面板
     * @param {HTMLElement} settingsDom
     */
    toggle(settingsDom: HTMLElement): void;
}
