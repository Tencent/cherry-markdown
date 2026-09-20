/**
 * 根据配置项状态生成 Cherry 配置对象，并格式化为可读的 JS 代码
 */
import type { ConfigCategoryDef, ConfigState, ConfigValue, GeneratedConfig, ItemState } from '../types';

/** 深拷贝（配置数据均为可 JSON 序列化的纯数据） */
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** 根据配置定义初始化运行时状态 */
export function createInitialState(categories: ConfigCategoryDef[]): ConfigState {
  const state: ConfigState = {};
  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      state[item.key] = {
        // 布尔配置项的开关状态必须与实际值一致（数据源里部分项是 enabled: true 但 value: false）
        enabled: item.type === 'boolean' ? Boolean(item.value) : item.enabled,
        value: deepClone(item.value),
        subItems: item.subItems ? item.subItems.map((s) => ({ ...s })) : null,
        canDisable: !!item.canDisable,
        disabled: false,
      };
    });
  });
  return state;
}

/** 应用预设覆盖到一份新状态上 */
export function applyPresetOverrides(
  categories: ConfigCategoryDef[],
  overrides: Record<string, ConfigValue>,
): ConfigState {
  const state = createInitialState(categories);
  Object.entries(overrides).forEach(([key, value]) => {
    const target: ItemState | undefined = state[key];
    if (!target) return;
    // 对于 canDisable 的配置项，false 表示关闭该功能
    if (target.canDisable && value === false) {
      target.disabled = true;
    } else if (typeof value === 'boolean') {
      target.enabled = value;
      target.value = value;
      if (target.canDisable) target.disabled = false;
    } else {
      target.value = deepClone(value);
      if (target.canDisable) target.disabled = false;
    }
  });
  return state;
}

/** 将 text 输入的值按配置项类型归一化 */
function normalizeNumber(value: ConfigValue): ConfigValue {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return value;
}

/** 生成 Cherry 配置对象 */
export function generateConfig(categories: ConfigCategoryDef[], state: ConfigState): GeneratedConfig {
  const config: GeneratedConfig = {};

  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      const itemState = state[item.key];
      if (!itemState) return;

      const isToggleOff = !itemState.enabled && item.inputType === 'toggle' && item.type !== 'boolean';
      // 带子项的对象配置（如 engine.syntax.*）关闭时需要输出 false 来禁用对应语法，不能直接省略；
      // 其余关闭的 toggle（回调函数、externals 等）省略即可
      const isSyntaxLikeObject = item.type === 'object' && !!itemState.subItems;
      if (isToggleOff && !isSyntaxLikeObject) return;

      const path = item.path.split('.');
      let target: GeneratedConfig = config;
      for (let i = 0; i < path.length - 1; i++) {
        const seg = path[i];
        if (!target[seg] || typeof target[seg] !== 'object') target[seg] = {};
        target = target[seg] as GeneratedConfig;
      }
      const lastKey = path[path.length - 1];

      if (item.type === 'boolean') {
        target[lastKey] = itemState.value;
      } else if (item.type === 'function') {
        if (itemState.enabled) target[lastKey] = item.default;
      } else if (item.type === 'array') {
        // 支持 canDisable：当 disabled 为 true 时输出 false 而非数组
        if (item.canDisable && itemState.disabled) {
          target[lastKey] = false;
        } else {
          target[lastKey] = Array.isArray(itemState.value) ? [...itemState.value] : [];
        }
      } else if (item.type === 'object' && itemState.subItems) {
        if (itemState.enabled) {
          const obj: Record<string, unknown> = {};
          itemState.subItems.forEach((sub) => {
            obj[sub.key] = sub.value;
          });
          target[lastKey] = obj;
        } else {
          target[lastKey] = false;
        }
      } else if (item.type === 'number') {
        target[lastKey] = normalizeNumber(itemState.value);
      } else {
        target[lastKey] = itemState.value;
      }
    });
  });

  return config;
}

/** 将配置对象格式化为 JS 对象字面量代码 */
export function formatConfigObject(obj: Record<string, unknown>, indent = 0): string {
  const spaces = '  '.repeat(indent);
  const innerSpaces = '  '.repeat(indent + 1);
  const lines: string[] = ['{'];

  const entries = Object.entries(obj);
  entries.forEach(([key, value], idx) => {
    const comma = idx < entries.length - 1 ? ',' : '';
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      // 函数字符串直接输出
      if (value.includes('=>') || value.startsWith('function')) {
        lines.push(`${innerSpaces}${key}: ${value}${comma}`);
      } else {
        lines.push(`${innerSpaces}${key}: '${value}'${comma}`);
      }
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      lines.push(`${innerSpaces}${key}: ${value}${comma}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${innerSpaces}${key}: []${comma}`);
      } else {
        const items = value.map((v) => (typeof v === 'string' ? `'${v}'` : String(v))).join(', ');
        if (items.length > 60) {
          lines.push(`${innerSpaces}${key}: [`);
          value.forEach((v, i) => {
            const c = i < value.length - 1 ? ',' : '';
            lines.push(`${innerSpaces}  ${typeof v === 'string' ? `'${v}'` : String(v)}${c}`);
          });
          lines.push(`${innerSpaces}]${comma}`);
        } else {
          lines.push(`${innerSpaces}${key}: [${items}]${comma}`);
        }
      }
    } else if (typeof value === 'object') {
      const formatted = formatConfigObject(value as Record<string, unknown>, indent + 1);
      lines.push(`${innerSpaces}${key}: ${formatted}${comma}`);
    }
  });
  lines.push(`${spaces}}`);

  return lines.join('\n');
}

/** 生成可直接粘贴使用的完整代码片段 */
export function buildExportCode(config: GeneratedConfig): string {
  return `const config = ${formatConfigObject(config)};\n\nconst cherry = new Cherry(config);`;
}
