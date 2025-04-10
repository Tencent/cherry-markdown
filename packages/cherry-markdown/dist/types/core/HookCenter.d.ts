/**
 * 语法注册中心
 */
export default class HookCenter {
    /**
     *
     * @param {(typeof SyntaxBase)[]} hooksConfig
     * @param {CherryOptions} editorConfig
     */
    constructor(hooksConfig: (typeof SyntaxBase)[], editorConfig: CherryOptions, cherry: any);
    $locale: any;
    $cherry: any;
    /**
     * @property
     * @type {Record<import('./SyntaxBase').HookType, SyntaxBase[]>} hookList hook 名称 -> hook 类型的映射
     */
    hookList: Record<import('./SyntaxBase').HookType, SyntaxBase[]>;
    /**
     * @property
     * @type {Record<string, { type: import('./SyntaxBase').HookType }>} hookNameList hook 名称 -> hook 类型的映射
     */
    hookNameList: Record<string, {
        type: import('./SyntaxBase').HookType;
    }>;
    /**
     * 注册系统默认的语法hook
     * @param {any[]} hooksConfig 在hookconfig.js里定义的配置
     * @param {CherryOptions} editorConfig 编辑器配置
     */
    registerInternalHooks(hooksConfig: any[], editorConfig: Partial<import("../../types/cherry")._CherryOptions<import("../../types/cherry").CherryCustomOptions>>): void;
    /**
     * 注册第三方的语法hook
     * @param {CherryEngineOptions['customSyntax']} customHooks 用户传入的配置
     * @param {CherryOptions} editorConfig 编辑器配置
     */
    registerCustomHooks(customHooks: CherryEngineOptions['customSyntax'], editorConfig: Partial<import("../../types/cherry")._CherryOptions<import("../../types/cherry").CherryCustomOptions>>): void;
    getHookList(): Record<import("../../types/syntax").HookType, SyntaxBase[]>;
    getHookNameList(): Record<string, {
        type: import('./SyntaxBase').HookType;
    }>;
    /**
     *
     * @param {((...args: any[]) => any) | typeof SyntaxBase} HookClass
     * @param {CherryOptions} editorConfig
     * @param {Omit<CustomSyntaxRegConfig, 'syntaxClass'>} [customHookConfig]
     * @returns
     */
    register(HookClass: typeof SyntaxBase | ((...args: any[]) => any), editorConfig: Partial<import("../../types/cherry")._CherryOptions<import("../../types/cherry").CherryCustomOptions>>, customHookConfig?: Omit<CustomSyntaxRegConfig, 'syntaxClass'>): -1 | -2;
}
export type CherryOptions = import('../../types/cherry').CherryOptions;
export type CherryEngineOptions = import('../../types/cherry').CherryEngineOptions;
export type CustomSyntaxRegConfig = import('../../types/cherry').CustomSyntaxRegConfig;
export type CustomSyntax = (SyntaxBase | ParagraphBase) & {
    Cherry$$CUSTOM: true;
};
export type CustomSyntaxClass = (typeof SyntaxBase | typeof ParagraphBase) & {
    Cherry$$CUSTOM: true;
};
import SyntaxBase from "./SyntaxBase";
import ParagraphBase from "./ParagraphBase";
