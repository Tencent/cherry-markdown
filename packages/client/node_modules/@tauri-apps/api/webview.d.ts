/**
 * Provides APIs to create webviews, communicate with other webviews and manipulate the current webview.
 *
 * #### Webview events
 *
 * Events can be listened to using {@link Webview.listen}:
 * ```typescript
 * import { getCurrentWebview } from "@tauri-apps/api/webview";
 * getCurrentWebview().listen("my-webview-event", ({ event, payload }) => { });
 * ```
 *
 * @module
 */
import { PhysicalPosition, PhysicalSize } from './dpi';
import type { LogicalPosition, LogicalSize } from './dpi';
import { Position, Size } from './dpi';
import type { EventName, EventCallback, UnlistenFn } from './event';
import { type EventTarget } from './event';
import { Color, Window } from './window';
import { WebviewWindow } from './webviewWindow';
/** The drag and drop event types. */
type DragDropEvent = {
    type: 'enter';
    paths: string[];
    position: PhysicalPosition;
} | {
    type: 'over';
    position: PhysicalPosition;
} | {
    type: 'drop';
    paths: string[];
    position: PhysicalPosition;
} | {
    type: 'leave';
};
/**
 * Get an instance of `Webview` for the current webview.
 *
 * @since 2.0.0
 */
declare function getCurrentWebview(): Webview;
/**
 * Gets a list of instances of `Webview` for all available webviews.
 *
 * @since 2.0.0
 */
declare function getAllWebviews(): Promise<Webview[]>;
/** @ignore */
export type WebviewLabel = string;
/**
 * Create new webview or get a handle to an existing one.
 *
 * Webviews are identified by a *label*  a unique identifier that can be used to reference it later.
 * It may only contain alphanumeric characters `a-zA-Z` plus the following special characters `-`, `/`, `:` and `_`.
 *
 * @example
 * ```typescript
 * import { Window } from "@tauri-apps/api/window"
 * import { Webview } from "@tauri-apps/api/webview"
 *
 * const appWindow = new Window('uniqueLabel');
 *
 * // loading embedded asset:
 * const webview = new Webview(appWindow, 'theUniqueLabel', {
 *   url: 'path/to/page.html'
 * });
 * // alternatively, load a remote URL:
 * const webview = new Webview(appWindow, 'theUniqueLabel', {
 *   url: 'https://github.com/tauri-apps/tauri'
 * });
 *
 * webview.once('tauri://created', function () {
 *  // webview successfully created
 * });
 * webview.once('tauri://error', function (e) {
 *  // an error happened creating the webview
 * });
 *
 * // emit an event to the backend
 * await webview.emit("some-event", "data");
 * // listen to an event from the backend
 * const unlisten = await webview.listen("event-name", e => {});
 * unlisten();
 * ```
 *
 * @since 2.0.0
 */
declare class Webview {
    /** The webview label. It is a unique identifier for the webview, can be used to reference it later. */
    label: WebviewLabel;
    /** The window hosting this webview. */
    window: Window;
    /** Local event listeners. */
    listeners: Record<string, Array<EventCallback<any>>>;
    /**
     * Creates a new Webview.
     * @example
     * ```typescript
     * import { Window } from '@tauri-apps/api/window'
     * import { Webview } from '@tauri-apps/api/webview'
     * const appWindow = new Window('my-label')
     * const webview = new Webview(appWindow, 'my-label', {
     *   url: 'https://github.com/tauri-apps/tauri'
     * });
     * webview.once('tauri://created', function () {
     *  // webview successfully created
     * });
     * webview.once('tauri://error', function (e) {
     *  // an error happened creating the webview
     * });
     * ```
     *
     * @param window the window to add this webview to.
     * @param label The unique webview label. Must be alphanumeric: `a-zA-Z-/:_`.
     * @returns The {@link Webview} instance to communicate with the webview.
     */
    constructor(window: Window, label: WebviewLabel, options: WebviewOptions);
    /**
     * Gets the Webview for the webview associated with the given label.
     * @example
     * ```typescript
     * import { Webview } from '@tauri-apps/api/webview';
     * const mainWebview = Webview.getByLabel('main');
     * ```
     *
     * @param label The webview label.
     * @returns The Webview instance to communicate with the webview or null if the webview doesn't exist.
     */
    static getByLabel(label: string): Promise<Webview | null>;
    /**
     * Get an instance of `Webview` for the current webview.
     */
    static getCurrent(): Webview;
    /**
     * Gets a list of instances of `Webview` for all available webviews.
     */
    static getAll(): Promise<Webview[]>;
    /**
     * Listen to an emitted event on this webview.
     *
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * const unlisten = await getCurrentWebview().listen<string>('state-changed', (event) => {
     *   console.log(`Got error: ${payload}`);
     * });
     *
     * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
     * unlisten();
     * ```
     *
     * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
     * @param handler Event handler.
     * @returns A promise resolving to a function to unlisten to the event.
     * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
     */
    listen<T>(event: EventName, handler: EventCallback<T>): Promise<UnlistenFn>;
    /**
     * Listen to an emitted event on this webview only once.
     *
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * const unlisten = await getCurrent().once<null>('initialized', (event) => {
     *   console.log(`Webview initialized!`);
     * });
     *
     * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
     * unlisten();
     * ```
     *
     * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
     * @param handler Event handler.
     * @returns A promise resolving to a function to unlisten to the event.
     * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
     */
    once<T>(event: EventName, handler: EventCallback<T>): Promise<UnlistenFn>;
    /**
     * Emits an event to all {@link EventTarget|targets}.
     *
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * await getCurrentWebview().emit('webview-loaded', { loggedIn: true, token: 'authToken' });
     * ```
     *
     * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
     * @param payload Event payload.
     */
    emit(event: string, payload?: unknown): Promise<void>;
    /**
     * Emits an event to all {@link EventTarget|targets} matching the given target.
     *
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * await getCurrentWebview().emitTo('main', 'webview-loaded', { loggedIn: true, token: 'authToken' });
     * ```
     *
     * @param target Label of the target Window/Webview/WebviewWindow or raw {@link EventTarget} object.
     * @param event Event name. Must include only alphanumeric characters, `-`, `/`, `:` and `_`.
     * @param payload Event payload.
     */
    emitTo(target: string | EventTarget, event: string, payload?: unknown): Promise<void>;
    /** @ignore */
    _handleTauriEvent<T>(event: string, handler: EventCallback<T>): boolean;
    /**
     * The position of the top-left hand corner of the webview's client area relative to the top-left hand corner of the desktop.
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * const position = await getCurrentWebview().position();
     * ```
     *
     * @returns The webview's position.
     */
    position(): Promise<PhysicalPosition>;
    /**
     * The physical size of the webview's client area.
     * The client area is the content of the webview, excluding the title bar and borders.
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * const size = await getCurrentWebview().size();
     * ```
     *
     * @returns The webview's size.
     */
    size(): Promise<PhysicalSize>;
    /**
     * Closes the webview.
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * await getCurrentWebview().close();
     * ```
     *
     * @returns A promise indicating the success or failure of the operation.
     */
    close(): Promise<void>;
    /**
     * Resizes the webview.
     * @example
     * ```typescript
     * import { getCurrent, LogicalSize } from '@tauri-apps/api/webview';
     * await getCurrentWebview().setSize(new LogicalSize(600, 500));
     * ```
     *
     * @param size The logical or physical size.
     * @returns A promise indicating the success or failure of the operation.
     */
    setSize(size: LogicalSize | PhysicalSize | Size): Promise<void>;
    /**
     * Sets the webview position.
     * @example
     * ```typescript
     * import { getCurrent, LogicalPosition } from '@tauri-apps/api/webview';
     * await getCurrentWebview().setPosition(new LogicalPosition(600, 500));
     * ```
     *
     * @param position The new position, in logical or physical pixels.
     * @returns A promise indicating the success or failure of the operation.
     */
    setPosition(position: LogicalPosition | PhysicalPosition | Position): Promise<void>;
    /**
     * Bring the webview to front and focus.
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * await getCurrentWebview().setFocus();
     * ```
     *
     * @returns A promise indicating the success or failure of the operation.
     */
    setFocus(): Promise<void>;
    /**
     * Hide the webview.
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * await getCurrentWebview().hide();
     * ```
     *
     * @returns A promise indicating the success or failure of the operation.
     */
    hide(): Promise<void>;
    /**
     * Show the webview.
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * await getCurrentWebview().show();
     * ```
     *
     * @returns A promise indicating the success or failure of the operation.
     */
    show(): Promise<void>;
    /**
     * Set webview zoom level.
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * await getCurrentWebview().setZoom(1.5);
     * ```
     *
     * @returns A promise indicating the success or failure of the operation.
     */
    setZoom(scaleFactor: number): Promise<void>;
    /**
     * Moves this webview to the given label.
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * await getCurrentWebview().reparent('other-window');
     * ```
     *
     * @returns A promise indicating the success or failure of the operation.
     */
    reparent(window: Window | WebviewWindow | string): Promise<void>;
    /**
     * Clears all browsing data for this webview.
     * @example
     * ```typescript
     * import { getCurrentWebview } from '@tauri-apps/api/webview';
     * await getCurrentWebview().clearAllBrowsingData();
     * ```
     *
     * @returns A promise indicating the success or failure of the operation.
     */
    clearAllBrowsingData(): Promise<void>;
    /**
     * Specify the webview background color.
     *
     * #### Platfrom-specific:
     *
     * - **macOS / iOS**: Not implemented.
     * - **Windows**:
     *   - On Windows 7, transparency is not supported and the alpha value will be ignored.
     *   - On Windows higher than 7: translucent colors are not supported so any alpha value other than `0` will be replaced by `255`
     *
     * @returns A promise indicating the success or failure of the operation.
     *
     * @since 2.1.0
     */
    setBackgroundColor(color: Color | null): Promise<void>;
    /**
     * Listen to a file drop event.
     * The listener is triggered when the user hovers the selected files on the webview,
     * drops the files or cancels the operation.
     *
     * @example
     * ```typescript
     * import { getCurrentWebview } from "@tauri-apps/api/webview";
     * const unlisten = await getCurrentWebview().onDragDropEvent((event) => {
     *  if (event.payload.type === 'over') {
     *    console.log('User hovering', event.payload.position);
     *  } else if (event.payload.type === 'drop') {
     *    console.log('User dropped', event.payload.paths);
     *  } else {
     *    console.log('File drop cancelled');
     *  }
     * });
     *
     * // you need to call unlisten if your handler goes out of scope e.g. the component is unmounted
     * unlisten();
     * ```
     *
     * When the debugger panel is open, the drop position of this event may be inaccurate due to a known limitation.
     * To retrieve the correct drop position, please detach the debugger.
     *
     * @returns A promise resolving to a function to unlisten to the event.
     * Note that removing the listener is required if your listener goes out of scope e.g. the component is unmounted.
     */
    onDragDropEvent(handler: EventCallback<DragDropEvent>): Promise<UnlistenFn>;
}
/**
 * Configuration for the webview to create.
 *
 * @since 2.0.0
 */
interface WebviewOptions {
    /**
     * Remote URL or local file path to open.
     *
     * - URL such as `https://github.com/tauri-apps` is opened directly on a Tauri webview.
     * - data: URL such as `data:text/html,<html>...` is only supported with the `webview-data-url` Cargo feature for the `tauri` dependency.
     * - local file path or route such as `/path/to/page.html` or `/users` is appended to the application URL (the devServer URL on development, or `tauri://localhost/` and `https://tauri.localhost/` on production).
     */
    url?: string;
    /** The initial vertical position. */
    x: number;
    /** The initial horizontal position. */
    y: number;
    /** The initial width. */
    width: number;
    /** The initial height. */
    height: number;
    /**
     * Whether the webview is transparent or not.
     * Note that on `macOS` this requires the `macos-private-api` feature flag, enabled under `tauri.conf.json > app > macOSPrivateApi`.
     * WARNING: Using private APIs on `macOS` prevents your application from being accepted to the `App Store`.
     */
    transparent?: boolean;
    /**
     * Whether the webview should have focus or not
     *
     * @since 2.1.0
     */
    focus?: boolean;
    /**
     * Whether the drag and drop is enabled or not on the webview. By default it is enabled.
     *
     * Disabling it is required to use HTML5 drag and drop on the frontend on Windows.
     */
    dragDropEnabled?: boolean;
    /**
     * Whether clicking an inactive webview also clicks through to the webview on macOS.
     */
    acceptFirstMouse?: boolean;
    /**
     * The user agent for the webview.
     */
    userAgent?: string;
    /**
     * Whether or not the webview should be launched in incognito mode.
     *
     * #### Platform-specific
     *
     * - **Android:** Unsupported.
     */
    incognito?: boolean;
    /**
     * The proxy URL for the WebView for all network requests.
     *
     * Must be either a `http://` or a `socks5://` URL.
     *
     * #### Platform-specific
     *
     * - **macOS**: Requires the `macos-proxy` feature flag and only compiles for macOS 14+.
     * */
    proxyUrl?: string;
    /**
     * Whether page zooming by hotkeys is enabled
     *
     * #### Platform-specific:
     *
     * - **Windows**: Controls WebView2's [`IsZoomControlEnabled`](https://learn.microsoft.com/en-us/microsoft-edge/webview2/reference/winrt/microsoft_web_webview2_core/corewebview2settings?view=webview2-winrt-1.0.2420.47#iszoomcontrolenabled) setting.
     * - **MacOS / Linux**: Injects a polyfill that zooms in and out with `ctrl/command` + `-/=`,
     * 20% in each step, ranging from 20% to 1000%. Requires `webview:allow-set-webview-zoom` permission
     *
     * - **Android / iOS**: Unsupported.
     */
    zoomHotkeysEnabled?: boolean;
    /**
     * Sets whether the custom protocols should use `https://<scheme>.localhost` instead of the default `http://<scheme>.localhost` on Windows and Android. Defaults to `false`.
     *
     * #### Note
     *
     * Using a `https` scheme will NOT allow mixed content when trying to fetch `http` endpoints and therefore will not match the behavior of the `<scheme>://localhost` protocols used on macOS and Linux.
     *
     * #### Warning
     *
     * Changing this value between releases will change the IndexedDB, cookies and localstorage location and your app will not be able to access them.
     *
     * @since 2.1.0
     */
    useHttpsScheme?: boolean;
    /**
     * Whether web inspector, which is usually called browser devtools, is enabled or not. Enabled by default.
     *
     * This API works in **debug** builds, but requires `devtools` feature flag to enable it in **release** builds.
     *
     * #### Platform-specific
     *
     * - macOS: This will call private functions on **macOS**.
     * - Android: Open `chrome://inspect/#devices` in Chrome to get the devtools window. Wry's `WebView` devtools API isn't supported on Android.
     * - iOS: Open Safari > Develop > [Your Device Name] > [Your WebView] to get the devtools window.
     *
     * @since 2.1.0
     */
    devtools?: boolean;
    /**
     * Set the window and webview background color.
     *
     * #### Platform-specific:
     *
     * - **macOS / iOS**: Not implemented.
     * - **Windows**:
     *   - On Windows 7, alpha channel is ignored.
     *   - On Windows 8 and newer, if alpha channel is not `0`, it will be ignored.
     *
     * @since 2.1.0
     */
    backgroundColor?: Color;
}
export { Webview, getCurrentWebview, getAllWebviews };
export type { DragDropEvent, WebviewOptions, Color };
