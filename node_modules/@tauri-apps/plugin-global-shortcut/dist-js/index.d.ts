export interface ShortcutEvent {
    shortcut: string;
    id: number;
    state: 'Released' | 'Pressed';
}
export type ShortcutHandler = (event: ShortcutEvent) => void;
/**
 * Register a global shortcut or a list of shortcuts.
 *
 * The handler is called when any of the registered shortcuts are pressed by the user.
 *
 * If the shortcut is already taken by another application, the handler will not be triggered.
 * Make sure the shortcut is as unique as possible while still taking user experience into consideration.
 *
 * @example
 * ```typescript
 * import { register } from '@tauri-apps/plugin-global-shortcut';
 *
 * // register a single hotkey
 * await register('CommandOrControl+Shift+C', (event) => {
 *   if (event.state === "Pressed") {
 *       console.log('Shortcut triggered');
 *   }
 * });
 *
 * // or register multiple hotkeys at once
 * await register(['CommandOrControl+Shift+C', 'Alt+A'], (event) => {
 *   console.log(`Shortcut ${event.shortcut} triggered`);
 * });
 * ```
 *
 * @param shortcut Shortcut definition, modifiers and key separated by "+" e.g. CmdOrControl+Q
 * @param handler Shortcut handler callback - takes the triggered shortcut as argument
 *
 * @since 2.0.0
 */
declare function register(shortcuts: string | string[], handler: ShortcutHandler): Promise<void>;
/**
 * Unregister a global shortcut or a list of shortcuts.
 *
 * @example
 * ```typescript
 * import { unregister } from '@tauri-apps/plugin-global-shortcut';
 *
 * // unregister a single hotkey
 * await unregister('CmdOrControl+Space');
 *
 * // or unregister multiple hotkeys at the same time
 * await unregister(['CmdOrControl+Space', 'Alt+A']);
 * ```
 *
 * @param shortcut shortcut definition (modifiers and key separated by "+" e.g. CmdOrControl+Q), also accepts a list of shortcuts
 *
 * @since 2.0.0
 */
declare function unregister(shortcuts: string | string[]): Promise<void>;
/**
 * Unregister all global shortcuts.
 *
 * @example
 * ```typescript
 * import { unregisterAll } from '@tauri-apps/plugin-global-shortcut';
 * await unregisterAll();
 * ```
 * @since 2.0.0
 */
declare function unregisterAll(): Promise<void>;
/**
 * Determines whether the given shortcut is registered by this application or not.
 *
 * If the shortcut is registered by another application, it will still return `false`.
 *
 * @example
 * ```typescript
 * import { isRegistered } from '@tauri-apps/plugin-global-shortcut';
 * const isRegistered = await isRegistered('CommandOrControl+P');
 * ```
 *
 * @param shortcut shortcut definition, modifiers and key separated by "+" e.g. CmdOrControl+Q
 *
 * @since 2.0.0
 */
declare function isRegistered(shortcut: string): Promise<boolean>;
export { register, unregister, unregisterAll, isRegistered };
