export function createSyntaxHook(name: any, type: any, options: any): {
    new (editorConfig?: {}): {
        config: any;
        beforeMakeHtml(...args: any[]): any;
        makeHtml(...args: any[]): any;
        afterMakeHtml(...args: any[]): any;
        test(...args: any[]): any;
        rule(...args: any[]): any;
    };
    HOOK_NAME: any;
};
export function createMenuHook(name: any, options: any): {
    new (editorInstance: any): {
        noIcon: boolean;
        name: any;
        subMenuConfig: any;
        afterInit(...args: any[]): any;
        onClick(...args: any[]): any;
        get shortcutKeys(): any;
        _onClick: MenuBase["fire"];
        $cherry: import("./toolbars/MenuBase").MenuBaseConstructorParams;
        bubbleMenu: boolean;
        subMenu: any;
        $currentMenuOptions: import("../types/menus").CustomMenuConfig;
        iconName: string;
        iconType: import("../types/menus").MenuIconType;
        editor: import("./Editor").default;
        locale: any;
        dom: HTMLSpanElement;
        updateMarkdown: boolean;
        cacheOnce: boolean;
        positionModel: "absolute" | "fixed" | "sidebar";
        fire(event?: MouseEvent | KeyboardEvent | undefined, shortKey?: string): void;
        shortcutKeyMap: import("./toolbars/MenuBase").HookShortcutKeyMap;
        getSubMenuConfig(): import("./toolbars/MenuBase").SubMenuConfigItem[];
        setName(name: string, iconName?: string): void;
        setCacheOnce(info: any): void;
        getAndCleanCacheOnce(): boolean;
        hasCacheOnce(): boolean;
        createIconFontIcon(iconName: string, options?: object): HTMLElement;
        createSvgIcon(options: import("../types/menus").CustomMenuIcon): Element;
        createImageIcon(options: import("../types/menus").CustomMenuIcon): HTMLImageElement;
        createBtn(asSubMenu?: boolean): HTMLSpanElement;
        createSubBtnByConfig(config: SubMenuConfigItem): HTMLSpanElement;
        isSelections: boolean;
        $replaceSelectionsWithCursor(replacements: string[]): void;
        $getSelectionRange(): {
            begin: {
                line: number;
                ch: number;
            };
            end: {
                line: number;
                ch: number;
            };
        };
        registerAfterClickCb(cb: Function): void;
        afterClickCb: Function;
        $afterClick(): void;
        setLessSelection(lessBefore: string, lessAfter: string): void;
        getMoreSelection(appendBefore?: string, appendAfter?: string, cb?: Function): void;
        getSelection(selection: string, type?: string, focus?: boolean): string;
        bindSubClick(shortcut: any, selection: any): void;
        updateMenuIcon(options: import("../types/menus").CustomMenuConfig["icon"]): boolean;
        getMenuPosition(): Pick<DOMRect, "top" | "width" | "height" | "left">;
        hide(): void;
        show(): void;
        getActiveSubMenuIndex(subMenuDomPanel: HTMLDivElement): number | number[];
    };
    getTargetParentByButton(dom: HTMLElement): HTMLElement;
};
import MenuBase from './toolbars/MenuBase';
