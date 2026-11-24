/**
 * 语法注册中心
 */
export default class HookCenter {
    /**
     *
     * @param {(typeof SyntaxBase | typeof ParagraphBase)[]} hooksConfig
     * @param {CherryOptions} editorConfig
     */
    constructor(hooksConfig: (typeof SyntaxBase | typeof ParagraphBase)[], editorConfig: CherryOptions, cherry: any);
    $locale: any;
    $cherry: any;
    /**
     * @property
     * @type {Record<import('./SyntaxBase').HookType, SyntaxBase[]>} hookList hook 名称 -> hook 类型的映射
     */
    hookList: Record<import("./SyntaxBase.js").HookType, SyntaxBase[]>;
    /**
     * @property
     * @type {Record<string, { type: import('./SyntaxBase').HookType }>} hookNameList hook 名称 -> hook 类型的映射
     */
    hookNameList: Record<string, {
        type: import("./SyntaxBase.js").HookType;
    }>;
    /**
     * 注册系统默认的语法hook
     * @param {any[]} hooksConfig 在hookconfig.js里定义的配置
     * @param {CherryOptions} editorConfig 编辑器配置
     */
    registerInternalHooks(hooksConfig: any[], editorConfig: CherryOptions): void;
    /**
     * 注册第三方的语法hook
     * @param {CherryEngineOptions['customSyntax']} customHooks 用户传入的配置
     * @param {CherryOptions} editorConfig 编辑器配置
     */
    registerCustomHooks(customHooks: CherryEngineOptions["customSyntax"], editorConfig: CherryOptions): void;
    getHookList(): Record<import("../../../types/syntax.js").HookType, SyntaxBase[]>;
    getHookNameList(): Record<string, {
        type: import("./SyntaxBase.js").HookType;
    }>;
    /**
     *
     * @param {((...args: any[]) => any) | typeof SyntaxBase | typeof ParagraphBase} HookClass
     * @param {CherryOptions} editorConfig
     * @param {Omit<CustomSyntaxRegConfig, 'syntaxClass'>} [customHookConfig]
     * @returns
     */
    register(HookClass: ((...args: any[]) => any) | typeof SyntaxBase | typeof ParagraphBase, editorConfig: CherryOptions, customHookConfig?: Omit<CustomSyntaxRegConfig, "syntaxClass">): -1 | -2;
}
export type CherryOptions = import("../../../types/cherry.js").CherryOptions;
export type CherryEngineOptions = import("../../../types/cherry.js").CherryEngineOptions;
export type CustomSyntaxRegConfig = import("../../../types/cherry.js").CustomSyntaxRegConfig;
export type CustomSyntax = (SyntaxBase | ParagraphBase) & {
    Cherry$$CUSTOM: true;
};
export type CustomSyntaxClass = (typeof SyntaxBase | typeof ParagraphBase) & {
    Cherry$$CUSTOM: true;
};
import SyntaxBase from './SyntaxBase.js';
import ParagraphBase from './ParagraphBase.js';
