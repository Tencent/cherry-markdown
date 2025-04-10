export const SHIFT_KEY: "Shift";
export const ALT_KEY: "Alt";
export const CONTROL_KEY: "Meta" | "Control";
export const META_KEY: "Meta";
export const ENTER_KEY: "Enter";
export const ESCAPE_KEY: "Escape";
export const BACKSPACE_KEY: "Backspace";
export const shortKey2UnPlatformKey: {
    [x: string]: (isMac: boolean) => {
        text: string;
        tip: string;
    };
    Shift: (isMac: boolean) => {
        text: string;
        tip: string;
    };
    Alt: (isMac: boolean) => {
        text: string;
        tip: string;
    };
    Meta: (isMac: boolean) => {
        text: string;
        tip: string;
    };
};
export function getAllowedShortcutKey(event: KeyboardEvent, customForbiddenKeys?: string[]): string[];
export function keyStackIsModifierkeys(keyStack: string[]): boolean;
export function setDisableShortcutKey(nameSpace: any, value?: string): void;
export function isEnableShortcutKey(nameSpace: any): boolean;
export function storageKeyMap(nameSpace: string, keyMap: import('@/toolbars/MenuBase').HookShortcutKeyMap): void;
export function getStorageKeyMap(nameSpace: string): Record<string, import("../../types/cherry").ShortcutKeyMapStruct>;
export function keyStack2UniqueString(keyStack: string[]): string;
export function shortcutCode2Key(code: string, isMac: boolean): {
    text: string;
    tip: string;
};
export function keyStack2UnPlatformUniqueString(keyStack: string[], isMac: boolean): string;
export function getKeyCode(key: string | number): string;
