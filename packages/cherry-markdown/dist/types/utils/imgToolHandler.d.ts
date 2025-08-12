export default imgToolHandler;
declare namespace imgToolHandler {
    const mouseResize: {};
    namespace position {
        const x: number;
        const y: number;
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
    function showBubble(img: any, container: any, previewerDom: any, event: any, locale: any): void;
    function showBubble(img: any, container: any, previewerDom: any, event: any, locale: any): void;
    function emit(type: any, event?: {}): void;
    function emit(type: any, event?: {}): void;
    function previewUpdate(callback: any): void;
    function previewUpdate(callback: any): void;
    function remove(): void;
    function remove(): void;
    function $isResizing(): any;
    function $isResizing(): any;
    function dealScroll(event: any): void;
    function dealScroll(event: any): void;
    function change(): void;
    function change(): void;
    function bindChange(func: any): void;
    function bindChange(func: any): void;
}
