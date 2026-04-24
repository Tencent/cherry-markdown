import { Image } from './image';
import { Theme } from './window';
/**
 * Application metadata and related APIs.
 *
 * @module
 */
/**
 * Gets the application version.
 * @example
 * ```typescript
 * import { getVersion } from '@tauri-apps/api/app';
 * const appVersion = await getVersion();
 * ```
 *
 * @since 1.0.0
 */
declare function getVersion(): Promise<string>;
/**
 * Gets the application name.
 * @example
 * ```typescript
 * import { getName } from '@tauri-apps/api/app';
 * const appName = await getName();
 * ```
 *
 * @since 1.0.0
 */
declare function getName(): Promise<string>;
/**
 * Gets the Tauri version.
 *
 * @example
 * ```typescript
 * import { getTauriVersion } from '@tauri-apps/api/app';
 * const tauriVersion = await getTauriVersion();
 * ```
 *
 * @since 1.0.0
 */
declare function getTauriVersion(): Promise<string>;
/**
 * Shows the application on macOS. This function does not automatically focus any specific app window.
 *
 * @example
 * ```typescript
 * import { show } from '@tauri-apps/api/app';
 * await show();
 * ```
 *
 * @since 1.2.0
 */
declare function show(): Promise<void>;
/**
 * Hides the application on macOS.
 *
 * @example
 * ```typescript
 * import { hide } from '@tauri-apps/api/app';
 * await hide();
 * ```
 *
 * @since 1.2.0
 */
declare function hide(): Promise<void>;
/**
 * Get the default window icon.
 *
 * @example
 * ```typescript
 * import { defaultWindowIcon } from '@tauri-apps/api/app';
 * await defaultWindowIcon();
 * ```
 *
 * @since 2.0.0
 */
declare function defaultWindowIcon(): Promise<Image | null>;
/**
 * Set app's theme, pass in `null` or `undefined` to follow system theme
 *
 * @example
 * ```typescript
 * import { setTheme } from '@tauri-apps/api/app';
 * await setTheme('dark');
 * ```
 *
 * #### Platform-specific
 *
 * - **iOS / Android:** Unsupported.
 *
 * @since 2.0.0
 */
declare function setTheme(theme?: Theme | null): Promise<void>;
export { getName, getVersion, getTauriVersion, show, hide, defaultWindowIcon, setTheme };
