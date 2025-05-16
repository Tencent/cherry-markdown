/**
 * 用于管理语法块异步渲染
 */
export default class AsyncRenderHandler {
    /**
     * @param {import('../Cherry').default} cherry Cherry实例
     */
    constructor(cherry: import('../Cherry').default);
    pendingRenderers: Set<any>;
    originMd: string;
    md: string;
    $cherry: import("../Cherry").default;
    handleSyncRenderStart(md?: string): void;
    handleSyncRenderCompleted(md?: string): void;
    add(sign: any): void;
    done(sign: any, { replacer }?: {
        replacer?: (v: any) => any;
    }): void;
    clear(): void;
    handleAllCompleted(): void;
}
