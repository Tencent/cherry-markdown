export default imgSizeHandler;
declare namespace imgSizeHandler {
    const mouseResize: {};
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
    function initBubbleButtons(): {
        points: {
            arr: string[];
            arrInfo: {
                leftTop: {
                    name: string;
                    left: number;
                    top: number;
                };
                leftBottom: {
                    name: string;
                    left: number;
                    top: number;
                };
                rightTop: {
                    name: string;
                    left: number;
                    top: number;
                };
                rightBottom: {
                    name: string;
                    left: number;
                    top: number;
                };
                leftMiddle: {
                    name: string;
                    left: number;
                    top: number;
                };
                middleBottom: {
                    name: string;
                    left: number;
                    top: number;
                };
                middleTop: {
                    name: string;
                    left: number;
                    top: number;
                };
                rightMiddle: {
                    name: string;
                    left: number;
                    top: number;
                };
            };
        };
        imgSrc: any;
        style: {
            width: any;
            height: any;
            left: number;
            top: number;
            marginTop: number;
            marginLeft: number;
        };
        scrollTop: any;
        position: {
            bottom: number;
            top: number;
            height: any;
            width: any;
            right: number;
            left: number;
            x: number;
            y: number;
        };
    };
    function initBubbleButtons(): {
        points: {
            arr: string[];
            arrInfo: {
                leftTop: {
                    name: string;
                    left: number;
                    top: number;
                };
                leftBottom: {
                    name: string;
                    left: number;
                    top: number;
                };
                rightTop: {
                    name: string;
                    left: number;
                    top: number;
                };
                rightBottom: {
                    name: string;
                    left: number;
                    top: number;
                };
                leftMiddle: {
                    name: string;
                    left: number;
                    top: number;
                };
                middleBottom: {
                    name: string;
                    left: number;
                    top: number;
                };
                middleTop: {
                    name: string;
                    left: number;
                    top: number;
                };
                rightMiddle: {
                    name: string;
                    left: number;
                    top: number;
                };
            };
        };
        imgSrc: any;
        style: {
            width: any;
            height: any;
            left: number;
            top: number;
            marginTop: number;
            marginLeft: number;
        };
        scrollTop: any;
        position: {
            bottom: number;
            top: number;
            height: any;
            width: any;
            right: number;
            left: number;
            x: number;
            y: number;
        };
    };
    function showBubble(img: any, container: any, previewerDom: any): void;
    function showBubble(img: any, container: any, previewerDom: any): void;
    function emit(type: any, event?: {}): boolean | void;
    function emit(type: any, event?: {}): boolean | void;
    function previewUpdate(callback: any): void;
    function previewUpdate(callback: any): void;
    function drawBubbleButs(): void;
    function drawBubbleButs(): void;
    function remove(): void;
    function remove(): void;
    function updateBubbleButs(): void;
    function updateBubbleButs(): void;
    function $updatePointsInfo(): void;
    function $updatePointsInfo(): void;
    function $getPointsInfo(left: any, top: any): {
        leftTop: {
            left: number;
            top: number;
        };
        leftBottom: {
            left: number;
            top: any;
        };
        rightTop: {
            left: any;
            top: number;
        };
        rightBottom: {
            left: any;
            top: any;
        };
        leftMiddle: {
            left: number;
            top: number;
        };
        middleBottom: {
            left: number;
            top: any;
        };
        middleTop: {
            left: number;
            top: number;
        };
        rightMiddle: {
            left: any;
            top: number;
        };
    };
    function $getPointsInfo(left: any, top: any): {
        leftTop: {
            left: number;
            top: number;
        };
        leftBottom: {
            left: number;
            top: any;
        };
        rightTop: {
            left: any;
            top: number;
        };
        rightBottom: {
            left: any;
            top: any;
        };
        leftMiddle: {
            left: number;
            top: number;
        };
        middleBottom: {
            left: number;
            top: any;
        };
        middleTop: {
            left: number;
            top: number;
        };
        rightMiddle: {
            left: any;
            top: number;
        };
    };
    function $isResizing(): any;
    function $isResizing(): any;
    function dealScroll(event: any): void;
    function dealScroll(event: any): void;
    function initMouse(): {
        left: number;
        top: number;
        resize: boolean;
        name: string;
    };
    function initMouse(): {
        left: number;
        top: number;
        resize: boolean;
        name: string;
    };
    function resizeBegin(event: any): boolean;
    function resizeBegin(event: any): boolean;
    function resizeStop(event: any, buts: any, editor: any, menu: any): boolean;
    function resizeStop(event: any, buts: any, editor: any, menu: any): boolean;
    function resizeWorking(event: any, buts: any): void;
    function resizeWorking(event: any, buts: any): void;
    function change(): void;
    function change(): void;
    function bindChange(func: any): void;
    function bindChange(func: any): void;
    /**
     * 根据宽（x）或高（y）来进行等比例缩放
     * @param {number} x 宽度
     * @param {number} y 高度
     * @param {string} type 类型，以宽/高为基准做等比例缩放
     * @returns
     */
    function $getChange(x: number, y: number, type: string): {
        changeX: number;
        changeY: number;
    };
    /**
     * 根据宽（x）或高（y）来进行等比例缩放
     * @param {number} x 宽度
     * @param {number} y 高度
     * @param {string} type 类型，以宽/高为基准做等比例缩放
     * @returns
     */
    function $getChange(x: number, y: number, type: string): {
        changeX: number;
        changeY: number;
    };
}
