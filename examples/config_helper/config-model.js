import { CONFIG_CATEGORIES } from './config-data.js';

const EXTERNAL_GLOBALS = {
  'externals.echarts': 'echarts',
  'externals.MathJax': 'MathJax',
  'externals.katex': 'katex',
};

export function cloneConfigValue(value, seen = new WeakMap()) {
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) return value;

  const copy = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  Object.entries(value).forEach(([key, entry]) => {
    copy[key] = cloneConfigValue(entry, seen);
  });
  return copy;
}

function getDefaultValue(defaultConfig, path) {
  return path.split('.').reduce((value, part) => value?.[part], defaultConfig);
}

// 配置面板只保存可编辑项的状态；完整配置始终从默认配置复制生成。
export function createConfigState(defaultConfig) {
  const configState = {};
  CONFIG_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      const defaultValue = getDefaultValue(defaultConfig, item.path);
      if (defaultValue === undefined && item.initialValue === undefined && !EXTERNAL_GLOBALS[item.key]) {
        throw new Error(`Cherry.config.defaults 中缺少 ${item.path}`);
      }
      // initialValue 只用于示例专属字段，以及默认关闭的工具栏重新启用时的候选按钮。
      configState[item.key] = {
        enabled: defaultValue !== undefined && defaultValue !== false,
        value: cloneConfigValue(item.inputType === 'toolbar-select' && !Array.isArray(defaultValue)
          ? item.initialValue : defaultValue ?? item.initialValue ?? false),
        subItems: item.subItems ? item.subItems.map(sub => ({
          ...sub,
          value: cloneConfigValue(defaultValue?.[sub.key]),
        })) : null,
        canDisable: !!item.canDisable,
        disabled: !!item.canDisable && defaultValue === false,
      };
    });
  });
  return configState;
}

export function getToolbarItemKey(value) {
  return typeof value === 'string' ? value : Object.keys(value)[0];
}

export function generateConfig(defaultConfig, configState, forPreview = false) {
  const config = cloneConfigValue(defaultConfig);

  CONFIG_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      const state = configState[item.key];
      if (EXTERNAL_GLOBALS[item.key] && !state.enabled) return;

      const path = item.path.split('.');
      let target = config;

      for (let i = 0; i < path.length - 1; i++) {
        if (!target[path[i]]) target[path[i]] = {};
        target = target[path[i]];
      }

      const lastKey = path[path.length - 1];

      if (item.type === 'boolean') {
        target[lastKey] = state.value;
      } else if (EXTERNAL_GLOBALS[item.key]) {
        const globalName = EXTERNAL_GLOBALS[item.key];
        if (!forPreview) {
          target[lastKey] = { rawCode: `window.${globalName}` };
        } else if (globalThis[globalName]) {
          target[lastKey] = globalThis[globalName];
        }
      } else if (item.type === 'array') {
        target[lastKey] = item.canDisable && state.disabled ? false : cloneConfigValue(state.value);
      } else if (item.type === 'object' && state.subItems) {
        if (state.enabled) {
          const obj = target[lastKey] && typeof target[lastKey] === 'object' ? target[lastKey] : {};
          state.subItems.forEach(sub => {
            obj[sub.key] = sub.value;
          });
          target[lastKey] = obj;
        } else {
          target[lastKey] = false;
        }
      } else {
        target[lastKey] = state.value;
      }
    });
  });

  return config;
}

export function createExportSerializer(defaultConfig, sourceText) {
  // 原始文件中的 callbacks 是顶层声明。保留整段源码，避免导出构建产物的私有助手。
  const callbackDeclaration = sourceText.match(/^const callbacks = \{[\s\S]*?^\};/m)?.[0];
  if (!callbackDeclaration) throw new Error('Cherry.config.js 中缺少 callbacks 声明');
  const callbackReferences = new Map(
    Array.from(sourceText.matchAll(/\b(\w+):\s*callbacks\.(\w+)/g), match => [match[1], match[2]]),
  );
  return configState => {
    const config = generateConfig(defaultConfig, configState);
    // 插件运行时注入的实现由 Cherry 自动合并，不属于用户需要维护的配置。
    delete config.engine.syntax.table.chartRenderEngine;
    delete config.engine.syntax.codeBlock.customRenderer;
    return callbackDeclaration + '\n\nconst config = ' + formatConfigValue(config, 0, 'config', callbackReferences) + ';';
  };
}

function formatFunction(value) {
  const source = value.toString();
  // 方法简写不能直接放在 key: 后，转换为函数表达式；箭头和普通函数保持原样。
  return /^(?:async\s+)?\*?[\w$]+\s*\([\s\S]*?\)\s*\{/.test(source)
    ? source.replace(/^(async\s+)?(\*)?/, '$1function $2') : source;
}

function formatConfigValue(value, indent, defaultPath, callbackReferences) {
  const spaces = '  '.repeat(indent);
  const innerSpaces = '  '.repeat(indent + 1);
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') {
    const callbackKey = defaultPath.match(/^config\.(?:callback|event)\.(\w+)$/)?.[1];
    const reference = callbackReferences.get(callbackKey);
    return reference ? `callbacks.${reference}` : formatFunction(value);
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return `new Date(${JSON.stringify(value.toISOString())})`;
  if (value instanceof RegExp) return value.toString();
  if (value.rawCode) return value.rawCode;
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const entries = value.map((entry, index) => formatConfigValue(entry, indent + 1, `${defaultPath}[${index}]`, callbackReferences));
    if (entries.every(entry => !entry.includes('\n')) && entries.join(', ').length <= 80) {
      return `[${entries.join(', ')}]`;
    }
    return `[\n${entries.map(entry => `${innerSpaces}${entry}`).join(',\n')}\n${spaces}]`;
  }
  const entries = Object.entries(value);
  if (entries.length === 0) return '{}';
  const lines = entries.map(([key, entry]) => {
    const property = /^[A-Za-z_$][\w$]*$/.test(key) ? key : JSON.stringify(key);
    const path = /^[A-Za-z_$][\w$]*$/.test(key) ? `${defaultPath}.${key}` : `${defaultPath}[${JSON.stringify(key)}]`;
    return `${innerSpaces}${property}: ${formatConfigValue(entry, indent + 1, path, callbackReferences)}`;
  });
  return `{\n${lines.join(',\n')}\n${spaces}}`;
}
