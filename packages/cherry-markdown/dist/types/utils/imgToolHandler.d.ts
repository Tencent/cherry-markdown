export default imgToolHandler;
declare namespace imgToolHandler {
    namespace position {
        let x: number;
        let y: number;
    }
    function getImgPosition(): {
        bottom: number;
        top: number;
        height: any;
        width: any;
        right: number;
        left: number;
        x: number;
        y: number;
    };
    function showBubble(img: any, container: any, previewerDom: any, event: any, locale: any, options?: {}): void;
    function emit(type: any, event?: {}): void;
    function $isTargetValid(): any;
    function $clearPreviewUpdateTimer(): void;
    function previewUpdate(callback: any): void;
    function refreshTarget(): void;
    function remove(): void;
    /**
     * 更新工具栏位置，用于预览区更新或编辑器大小变化后重新定位
     */
    function updatePosition(): void;
    function dealScroll(event: any): void;
    function bindChange(func: any): void;
}
