export default class MermaidBubbleSession {
    /**
     * @param {import('./PreviewerBubble').default} host PreviewerBubble 实例
     */
    constructor(host: import("./PreviewerBubble").default);
    host: import("./PreviewerBubble").default;
    /** 重置会话状态（移除操作框时调用） */
    reset(): void;
    anchorBody: string;
    anchorPreviewIndex: number;
    previewIndex: number;
    selfEditing: boolean;
    size: string;
    align: string;
    extendFrom: number;
    extendTo: number;
    hasExtend: boolean;
    langLineNum: number;
    /** 当前是否处于 mermaid 操作框会话 */
    isActive(): any;
    /**
     * 选中 mermaid 时初始化编辑上下文
     * @param {HTMLElement} figureElement
     * @returns {boolean}
     */
    beginEdit(figureElement: HTMLElement): boolean;
    /** 注入 handler 的校验/解析回调 */
    createHandlerOptions(onInvalidTarget: any): {
        onInvalidTarget: any;
        validateTarget: () => boolean;
        resolveTarget: () => HTMLElement;
    };
    /** 绑定 imgSizeHandler 拖拽时同步方向控制器 */
    bindPositionFollow(): void;
    /** 清理 timer 与联动回调（imgSizeHandler.remove 时调用） */
    disposeHandlers(): void;
    /**
     * 按编辑器源码锚点解析 index
     * @returns {number}
     */
    getEditorIndex(): number;
    /**
     * 预览刷新后 rebind figure
     * @returns {HTMLElement | null}
     */
    resolveFigure(): HTMLElement | null;
    /**
     * 校验操作框是否仍有效
     * @param {{ strict?: boolean }} [options]
     * @returns {boolean}
     */
    isValid(options?: {
        strict?: boolean;
    }): boolean;
    /** 同步选择框与方向控制器位置 */
    applyHandlerPositions(): void;
    clearPositionSyncTimer(): void;
    positionSyncTimer: any;
    clearAsyncValidityTimer(): void;
    asyncValidityTimer: any;
    clearPositionTransitionListener(): void;
    positionTransitionFigure: any;
    positionTransitionHandler: () => void;
    /**
     * 等待 figure 过渡结束后统一更新位置
     * @param {() => void} [onInvalidTarget]
     */
    schedulePositionSync(onInvalidTarget?: () => void): void;
    /** 预览 DOM 更新后 */
    onPreviewUpdate(): void;
    /** mermaid 异步渲染 patch DOM 后 */
    onAsyncRenderDone(): void;
    /**
     * fix(MermaidBubbleSession): 邻居块异步恢复会触发布局重排，延迟校验避免误关选中框
     * @param {number} [attempt]
     */
    scheduleAsyncValidityCheck(attempt?: number): void;
    /** 布局编辑完成且 svg 可见时清除 selfEditing 标记 */
    clearSelfEditingIfReady(): void;
    /** 写入布局参数到编辑器语言行 */
    applyLayoutValue(): void;
    /** @param {{ width: number, height: number }} style */
    changeSize(style: {
        width: number;
        height: number;
    }): void;
    /** @param {string} type */
    changeAlign(type: string): void;
}
