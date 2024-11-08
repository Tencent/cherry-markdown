import { mac } from 'codemirror/src/util/browser';

export const SHIFT_KEY = 'Shift';
export const ALT_KEY = 'Alt';
// mac的command(meta)键，windows的ctrl键
export const CONTROL_KEY = mac ? 'Meta' : 'Control';
export const META_KEY = 'Meta';
export const ENTER_KEY = 'Enter';
export const ESCAPE_KEY = 'Escape';
export const BACKSPACE_KEY = 'Backspace';

export const shortKey2UnPlatformKey = {
  [SHIFT_KEY]: (/** @type {boolean} */ isMac) => {
    if (isMac) {
      return {
        text: '⇧',
        tip: 'Shift',
      };
    }
    return {
      text: '⇧',
      tip: 'Shift',
    };
  },
  [CONTROL_KEY]: (/** @type {boolean} */ isMac) => {
    if (isMac) {
      return {
        text: '⌃',
        tip: 'Control',
      };
    }
    return {
      text: 'Ctrl',
      tip: 'Control',
    };
  },
  [ALT_KEY]: (/** @type {boolean} */ isMac) => {
    if (isMac) {
      return {
        text: '⌥',
        tip: 'Option',
      };
    }
    return {
      text: 'Alt',
      tip: 'Alt',
    };
  },
  [META_KEY]: (/** @type {boolean} */ isMac) => {
    if (isMac) {
      return {
        text: '⌘',
        tip: 'Command',
      };
    }
    return {
      text: '⊞',
      tip: 'Windows',
    };
  },
};

/**
 * 编辑属性的快捷键
 * @type {string[]}
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/UI_Events/Keyboard_event_key_values#editing_keys
 */
const editingKeys = [
  'Backspace',
  'Clear',
  'Copy',
  'CrSel',
  'Cut',
  'Delete',
  'EraseEof',
  'ExSel',
  'Insert',
  'Paste',
  'Redo',
  'Undo',
];

/**
 * 导航快捷键
 * @type {string[]}
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/UI_Events/Keyboard_event_key_values#navigation_keys
 */
const navigationKeys = ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Home', 'PageDown', 'PageUp'];

/**
 * whitespace_keys
 * @type {string[]}
 * @see https://developer.mozilla.org/zh-CN/docs/Web/API/UI_Events/Keyboard_event_key_values#whitespace_keys
 */
const whiteSpaceKeys = [' ', 'Tab', 'Enter'];

/**
 * 默认禁止的快捷键，主要是一些会对编辑器造成影响的快捷键
 * @type {string[]}
 */
const defaultForbiddenKeys = [...editingKeys, ...navigationKeys, ...whiteSpaceKeys];

/**
 * 获取合法的快捷键
 * @param {KeyboardEvent} event 键盘事件
 * @param {string[]} customForbiddenKeys 自定义的禁止的快捷键
 */
export const getAllowedShortcutKey = (event, customForbiddenKeys = []) => {
  const finalForbiddenKeys = [...defaultForbiddenKeys, ...customForbiddenKeys];
  /** @type {string[]} */
  const keyStack = [];
  const isSpecialKey = event.metaKey || event.ctrlKey || event.altKey || event.shiftKey;
  /**
   * 这里用 key 是因为 code 带有布局特征
   */
  if (finalForbiddenKeys.includes(event.key)) {
    return keyStack;
  }
  /**
   * 这个逻辑体内就规定了特殊按键的顺序：Meta > Control > Alt > Shift，从而保证了快捷键的顺序而不会重复
   * 也就是说这四个特殊键无论怎么按下，都会按照这个顺序排列
   */
  if (isSpecialKey) {
    if (event.metaKey) {
      keyStack.push(META_KEY);
    }
    if (event.ctrlKey) {
      keyStack.push(CONTROL_KEY);
    }
    if (event.altKey) {
      keyStack.push(ALT_KEY);
    }
    if (event.shiftKey) {
      keyStack.push(SHIFT_KEY);
    }
  }
  // 这里排除掉上面 isSpecialKey 的键，追加其他键
  if (!keyStack.includes(event.key)) {
    /**
     * 这里用 code 的原因在于要抹平不同浏览器对键值的不同处理，以及按下Shift键时key的表示不同
     * shfit、alt 等调节性键，在按下时，key的值会不同，但code的值是相同的
     * @see https://developer.mozilla.org/zh-CN/docs/Web/API/KeyboardEvent/code
     */
    // 当前键是否是重复按下的
    if (event.repeat) {
      keyStack.push(event.code);
      return keyStack;
    }
    keyStack.push(event.code);
  }
  return keyStack;
};

/**
 * 判断一个快捷键栈是否只包含了修饰键+输入键
 * @param {string[]} keyStack 快捷键栈
 */
export const keyStackIsModifierkeys = (keyStack) => {
  // 不是数组或长度不为2的肯定不是，(shift/alt)+input
  if (!Array.isArray(keyStack) || keyStack.length !== 2) {
    return false;
  }
  const includeShiftKey = keyStack.includes(SHIFT_KEY);
  const includeAltKey = keyStack.includes(ALT_KEY);
  // 只包含 Shift 和 Alt 的肯定不是
  if (includeShiftKey && includeAltKey && keyStack.length === 2) {
    return false;
  }
  return (includeShiftKey || includeAltKey) && !keyStack.includes(META_KEY) && !keyStack.includes(CONTROL_KEY);
};

export const setDisableShortcutKey = (nameSpace, value = 'disable') => {
  window.localStorage.setItem(`${nameSpace}-disable-cherry-shortcut-key`, value);
};

export const isEnableShortcutKey = (nameSpace) => {
  const disableShortcutKeyStorage = window.localStorage.getItem(`${nameSpace}-disable-cherry-shortcut-key`);
  if (disableShortcutKeyStorage === 'disable') {
    return false;
  }
  return true;
};

/**
 * 缓存快捷键映射
 * @param {string} nameSpace cherry 的缓存命名空间
 * @param {import('@/toolbars/MenuBase').HookShortcutKeyMap} keyMap 快捷键映射
 * @returns
 */
export const storageKeyMap = (nameSpace, keyMap) => {
  if (!keyMap || typeof keyMap !== 'object') {
    throw new Error('keyMap must be a object');
  }
  return window.localStorage.setItem(`${nameSpace}-cherry-shortcut-keymap`, JSON.stringify(keyMap));
};

/**
 * 获取缓存快捷键映射
 * @param {string} nameSpace cherry 的缓存命名空间
 * @returns
 */
export const getStorageKeyMap = (nameSpace) => {
  const shortcutKeyMapStorage = window.localStorage.getItem(`${nameSpace}-cherry-shortcut-keymap`);
  if (shortcutKeyMapStorage) {
    try {
      /** @type {import('@/toolbars/MenuBase').HookShortcutKeyMap} */
      const res = JSON.parse(shortcutKeyMapStorage);
      return res;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
  return null;
};

/**
 * 将快捷键栈转换为唯一字符串
 * @param {string[]} keyStack 快捷键栈
 * @returns
 */
export const keyStack2UniqueString = (keyStack) => {
  if (!Array.isArray(keyStack)) {
    throw new Error('keyStack must be a array');
  }
  return keyStack.join('-');
};

/**
 * 将快捷键代码转换为平台对应的快捷键
 * @param {string} code 源code
 * @param {boolean} isMac 是否是mac平台
 */
export const shortcutCode2Key = (code, isMac) => {
  if (code in shortKey2UnPlatformKey) {
    /** @type {keyof shortKey2UnPlatformKey} */
    // @ts-ignore
    const origin = code;
    const func = shortKey2UnPlatformKey[origin];
    if (typeof func === 'function') {
      return func(isMac);
    }
  }
  // 由于code包含了Key、Digit等，所以需要替换掉
  const text = code.replace(/Key|Digit/g, '');
  return {
    text,
    tip: text,
  };
};

/**
 * 将快捷键栈转换为平台无关的唯一字符串
 * @param {string[]} keyStack 快捷键栈
 * @param {boolean} isMac 是否是mac平台
 * @returns
 */
export const keyStack2UnPlatformUniqueString = (keyStack, isMac) => {
  if (!Array.isArray(keyStack)) {
    throw new Error('keyStack must be a array');
  }
  return keyStack2UniqueString(keyStack.map((code) => shortcutCode2Key(code, isMac).text));
};

/**
 * 获取快捷键
 * @param {string|number} key 易读的键
 * @example [0-9, a-z]
 * @see https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
 */
export const getKeyCode = (key) => {
  if (typeof key === 'number') {
    return `Digit${key}`;
  }
  if (typeof key !== 'string') {
    throw new Error('key must be a string or number');
  }
  // 一次只能输入一个字符
  if (key.length > 1) {
    throw new Error(`key length must be 1, but get ${key.length}`);
  }
  const upperCaseKey = key.toUpperCase();
  // 字符串数字
  if (/\d/.test(upperCaseKey)) {
    return `Digit${upperCaseKey}`;
  }
  // 字符串字母
  if (/[A-Z]/.test(upperCaseKey)) {
    return `Key${upperCaseKey}`;
  }
};
