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

export function buildExportCode(defaultConfig, configState) {
  const config = generateConfig(defaultConfig, configState);
  // 插件运行时注入的实现由 Cherry 自动合并，不属于用户需要维护的配置。
  delete config.engine.syntax.table.chartRenderEngine;
  delete config.engine.syntax.codeBlock.customRenderer;
  return 'const config = ' + formatConfigValue(config, 0, 'config') + ';';
}

const FUNCTION_SOURCE_OVERRIDES = {
  // UMD 构建产物中的这个函数引用了私有迭代器助手，不能直接使用 toString() 导出。
  'config.callback.fileUploadMulti': `function fileUploadMulti(files, callback) {
    const fileType = files[0].type;
    const promises = Array.prototype.map.call(files, file => new Promise(resolve => {
      if (/video/i.test(fileType)) {
        resolve({ url: 'images/demo-dog.png', params: {
          name: file.name.replace(/\\.[^.]+$/, ''), poster: 'images/demo-dog.png?poster=true',
          isBorder: true, isShadow: true, isRadius: true,
        } });
      } else if (/image/i.test(fileType)) {
        const reader = new FileReader();
        reader.onload = event => resolve({ url: event.target.result, params: {
          name: file.name.replace(/\\.[^.]+$/, ''), isShadow: true, width: '60%', height: 'auto',
        } });
        reader.readAsDataURL(file);
      } else if (/audio/i.test(fileType)) {
        resolve({ url: 'images/demo-dog.png', params: {
          name: file.name.replace(/\\.[^.]+$/, ''), poster: 'images/demo-dog.png?poster=true',
          isBorder: true, isShadow: true, isRadius: true,
        } });
      } else {
        resolve({ url: 'images/demo-dog.png', params: file });
      }
    }));
    Promise.all(promises).then(callback);
  }`,
};

function formatConfigValue(value, indent, defaultPath) {
  const spaces = '  '.repeat(indent);
  const innerSpaces = '  '.repeat(indent + 1);
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return FUNCTION_SOURCE_OVERRIDES[defaultPath] || value.toString();
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return `new Date(${JSON.stringify(value.toISOString())})`;
  if (value instanceof RegExp) return value.toString();
  if (value.rawCode) return value.rawCode;
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const entries = value.map((entry, index) => formatConfigValue(entry, indent + 1, `${defaultPath}[${index}]`));
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
    return `${innerSpaces}${property}: ${formatConfigValue(entry, indent + 1, path)}`;
  });
  return `{\n${lines.join(',\n')}\n${spaces}}`;
}
