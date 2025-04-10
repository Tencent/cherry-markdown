/**
 * 事件管理
 */
export default class Event {
    constructor(instanceId: any);
    instanceId: any;
    /**
     * 事件列表
     * @property
     */
    Events: {
        previewerClose: string;
        previewerOpen: string;
        editorClose: string;
        editorOpen: string;
        toolbarHide: string;
        toolbarShow: string;
        cleanAllSubMenus: string;
        afterChange: string;
        afterInit: string;
        focus: string;
        blur: string;
        selectionChange: string;
        afterChangeLocale: string;
        changeMainTheme: string;
        changeCodeBlockTheme: string;
    };
    /**
     * @property
     * @private
     * @type {import('mitt').Emitter}
     */
    private emitter;
    setInstanceId(instanceId: any): void;
    getInstanceId(): any;
    clearAll(): void;
    bindCallbacksByOptions(options: any): void;
    /**
     * 注册监听事件
     * @param {string} event 要注册监听的事件
     * @param {(event: any) => void} handler 事件回调
     */
    on(event: string, handler: (event: any) => void): void;
    off(event: any, handler: any): void;
    /**
     * 触发事件
     * @param {string} event 要触发的事件
     * @param {object} msg 消息体
     */
    emit(event: string, msg: object): void;
}
