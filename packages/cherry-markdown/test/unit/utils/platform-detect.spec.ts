/**
 * 平台检测替代方案测试
 *
 * 当前 shortcutKey.js 和 ShortcutKeyConfigPanel.js 依赖：
 *   import { mac } from 'codemirror/src/util/browser'
 *
 * 当前 Suggester.js 依赖：
 *   import { Pass } from 'codemirror/src/util/misc'
 *
 * CM6 中这些内部模块不再存在，需要用标准 Web API 替代：
 * - mac 检测 → navigator.platform / navigator.userAgent
 * - Pass 常量 → 在 CM6 keymap 中用不同方式表示"不处理此键"
 *
 * 本文件测试替代实现的正确性
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ============================================================================
// 平台检测替代实现
// 这些函数将在升级时替代 `import { mac } from 'codemirror/src/util/browser'`
// ============================================================================

/**
 * 检测当前是否为 macOS 平台
 * 替代 codemirror/src/util/browser 中的 mac 变量
 */
function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;

  // navigator.platform 在大多数浏览器中可用（虽然已 deprecated）
  if (navigator.platform) {
    return /Mac/.test(navigator.platform);
  }

  // fallback: 使用 userAgentData (新标准)
  if ('userAgentData' in navigator && (navigator as any).userAgentData?.platform) {
    return (navigator as any).userAgentData.platform === 'macOS';
  }

  // fallback: userAgent
  return /Mac/.test(navigator.userAgent);
}

/**
 * 检测当前是否为 iOS
 */
function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/.test(navigator.platform) || /iPhone|iPad|iPod/.test(navigator.userAgent);
}

/**
 * 检测当前是否为 Windows
 */
function isWindows(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Win/.test(navigator.platform);
}

/**
 * 检测当前是否为 Linux
 */
function isLinux(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Linux/.test(navigator.platform);
}

/**
 * 获取平台控制键
 * 替代 shortcutKey.js 中的 getPlatformControlKey
 */
function getPlatformControlKey(): string {
  return isMac() ? 'Meta' : 'Control';
}

// ============================================================================
// Pass 常量替代方案
// CM5: import { Pass } from 'codemirror/src/util/misc'
// 在 CM5 的 extraKeys 中返回 Pass 表示"不处理此按键"
// CM6: 在 keymap 中返回 false 或不匹配即可
// ============================================================================

/**
 * CM5 Pass 常量的模拟
 * 用于兼容模式，最终升级 CM6 后应移除
 */
const PASS = Symbol('PASS');

/**
 * 判断一个键处理结果是否为"不处理"
 */
function isPassThrough(result: any): boolean {
  // CM5 中 Pass 是 codemirror.Pass
  // 替代方案中可以用 undefined / false / PASS symbol
  return result === undefined || result === false || result === PASS;
}

// ============================================================================
// 测试
// ============================================================================

describe('平台检测替代方案测试', () => {
  // ============================================================================
  // macOS 检测
  // ============================================================================
  describe('isMac 检测', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

    afterEach(() => {
      // 恢复 navigator.platform
      if (originalPlatform) {
        Object.defineProperty(navigator, 'platform', originalPlatform);
      } else {
        Object.defineProperty(navigator, 'platform', {
          value: '',
          configurable: true,
          writable: true,
        });
      }
    });

    it('macOS 平台应该返回 true', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      expect(isMac()).toBe(true);
    });

    it('Mac ARM 平台应该返回 true', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacArm',
        configurable: true,
      });
      expect(isMac()).toBe(true);
    });

    it('Windows 平台应该返回 false', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      expect(isMac()).toBe(false);
    });

    it('Linux 平台应该返回 false', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        configurable: true,
      });
      expect(isMac()).toBe(false);
    });
  });

  // ============================================================================
  // getPlatformControlKey
  // ============================================================================
  describe('getPlatformControlKey', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

    afterEach(() => {
      if (originalPlatform) {
        Object.defineProperty(navigator, 'platform', originalPlatform);
      } else {
        Object.defineProperty(navigator, 'platform', {
          value: '',
          configurable: true,
          writable: true,
        });
      }
    });

    it('Mac 上应该返回 Meta', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      expect(getPlatformControlKey()).toBe('Meta');
    });

    it('非 Mac 上应该返回 Control', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      expect(getPlatformControlKey()).toBe('Control');
    });
  });

  // ============================================================================
  // Windows / Linux / iOS 检测
  // ============================================================================
  describe('其他平台检测', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

    afterEach(() => {
      if (originalPlatform) {
        Object.defineProperty(navigator, 'platform', originalPlatform);
      } else {
        Object.defineProperty(navigator, 'platform', {
          value: '',
          configurable: true,
          writable: true,
        });
      }
    });

    it('Win32 应该识别为 Windows', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      expect(isWindows()).toBe(true);
      expect(isMac()).toBe(false);
      expect(isLinux()).toBe(false);
    });

    it('Linux x86_64 应该识别为 Linux', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Linux x86_64',
        configurable: true,
      });
      expect(isLinux()).toBe(true);
      expect(isWindows()).toBe(false);
      expect(isMac()).toBe(false);
    });

    it('iPhone 应该识别为 iOS', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'iPhone',
        configurable: true,
      });
      expect(isIOS()).toBe(true);
    });

    it('iPad 应该识别为 iOS', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'iPad',
        configurable: true,
      });
      expect(isIOS()).toBe(true);
    });
  });

  // ============================================================================
  // Pass 常量替代
  // ============================================================================
  describe('Pass 常量替代方案', () => {
    it('PASS symbol 应该被识别为"不处理"', () => {
      expect(isPassThrough(PASS)).toBe(true);
    });

    it('undefined 应该被识别为"不处理"', () => {
      expect(isPassThrough(undefined)).toBe(true);
    });

    it('false 应该被识别为"不处理"', () => {
      expect(isPassThrough(false)).toBe(true);
    });

    it('true 应该被识别为"已处理"', () => {
      expect(isPassThrough(true)).toBe(false);
    });

    it('其他值应该被识别为"已处理"', () => {
      expect(isPassThrough('handled')).toBe(false);
      expect(isPassThrough(0)).toBe(false);
      expect(isPassThrough(null)).toBe(false);
    });
  });

  // ============================================================================
  // 模拟 shortcutKey.js 中的使用场景
  // ============================================================================
  describe('shortcutKey.js 使用场景回归', () => {
    const originalPlatform = Object.getOwnPropertyDescriptor(navigator, 'platform');

    afterEach(() => {
      if (originalPlatform) {
        Object.defineProperty(navigator, 'platform', originalPlatform);
      } else {
        Object.defineProperty(navigator, 'platform', {
          value: '',
          configurable: true,
          writable: true,
        });
      }
    });

    it('快捷键显示文本在 Mac 和 Windows 上不同', () => {
      // Mac 上快捷键显示 ⌘
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });
      const macKey = getPlatformControlKey();

      // Windows 上快捷键显示 Ctrl
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true,
      });
      const winKey = getPlatformControlKey();

      expect(macKey).not.toBe(winKey);
      expect(macKey).toBe('Meta');
      expect(winKey).toBe('Control');
    });

    it('快捷键事件判断使用正确的修饰键', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true,
      });

      const controlKey = getPlatformControlKey();

      // 模拟键盘事件
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        metaKey: true,  // Mac 上按 ⌘
        ctrlKey: false,
      });

      // 判断是否按了平台控制键
      const isControlPressed = controlKey === 'Meta' ? event.metaKey : event.ctrlKey;
      expect(isControlPressed).toBe(true);
    });
  });

  // ============================================================================
  // 模拟 Suggester.js 中 Pass 的使用场景
  // ============================================================================
  describe('Suggester.js Pass 使用场景回归', () => {
    it('extraKeys 处理函数返回"不处理"时应该 passthrough', () => {
      // 模拟 Suggester 的 extraKeys 回调
      const extraKeys: Record<string, () => any> = {
        Up: () => {
          // 联想列表显示时处理上键
          const isShowingSuggester = false;
          if (isShowingSuggester) {
            // 处理了
            return true;
          }
          // 返回 Pass（不处理，让编辑器默认行为执行）
          return PASS;
        },
        Down: () => {
          return PASS;
        },
        Enter: () => {
          // 选中联想项
          return true;
        },
      };

      expect(isPassThrough(extraKeys.Up())).toBe(true);
      expect(isPassThrough(extraKeys.Down())).toBe(true);
      expect(isPassThrough(extraKeys.Enter())).toBe(false);
    });
  });
});
