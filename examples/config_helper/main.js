/**
 * Cherry Markdown 配置生成器 - 主逻辑模块
 */
import { CONFIG_CATEGORIES, SOURCE_CODE_MAP, PRESETS, CHERRY_CONFIG_SOURCE } from './config-data.js';

// 全局状态
window.cherryInstance = null;
let currentConfig = {};
let configState = {};

// 初始化配置状态（深拷贝）
function initConfigState() {
  configState = {};
  CONFIG_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      configState[item.key] = {
        enabled: item.enabled,
        value: JSON.parse(JSON.stringify(item.value)),
        subItems: item.subItems ? item.subItems.map(s => ({ ...s, value: s.value })) : null,
        canDisable: !!item.canDisable,
        disabled: false, // 当 canDisable 为 true 时，disabled 为 true 表示该配置项被设为 false
      };
    });
  });
}

// ==================== 渲染配置面板 ====================
function renderConfigPanel() {
  const container = document.getElementById('config-categories');
  container.innerHTML = '';

  CONFIG_CATEGORIES.forEach((cat, catIdx) => {
    const catEl = document.createElement('div');
    catEl.className = 'config-category fade-in' + (catIdx < 3 ? ' open' : '');
    catEl.dataset.categoryId = cat.id;
    catEl.style.animationDelay = `${catIdx * 0.05}s`;

    catEl.innerHTML = `
      <div class="category-header">
        <div class="flex items-center gap-3">
          <div class="icon ${cat.iconBg}">
            <i class="${cat.icon} ${cat.iconColor}"></i>
          </div>
          <div>
            <div class="text-sm font-semibold text-gray-800">${cat.name}</div>
            <div class="text-xs text-gray-400">${cat.description}</div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-gray-400">${cat.items.length} 项</span>
          <i class="fa-solid fa-chevron-down chevron"></i>
        </div>
      </div>
      <div class="category-body">
        <div class="config-items-list"></div>
      </div>
    `;

    const itemsList = catEl.querySelector('.config-items-list');
    cat.items.forEach(item => {
      itemsList.appendChild(renderConfigItem(item));
    });

    // 折叠/展开
    catEl.querySelector('.category-header').addEventListener('click', () => {
      catEl.classList.toggle('open');
    });

    container.appendChild(catEl);
  });
}

function renderConfigItem(item) {
  const state = configState[item.key];
  const div = document.createElement('div');
  div.className = 'config-item';
  div.dataset.key = item.key;
  div.dataset.searchText = `${item.name} ${item.path} ${item.description}`.toLowerCase();

  let valueHtml = '';
  if (item.inputType === 'toggle') {
    const checked = state.enabled ? 'checked' : '';
    valueHtml = `
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" class="sr-only peer toggle-input" data-key="${item.key}" ${checked}>
        <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
      </label>
    `;
  } else if (item.inputType === 'select') {
    const opts = item.options.map(o =>
      `<option value="${o}" ${state.value === o ? 'selected' : ''}>${o}</option>`
    ).join('');
    valueHtml = `<select class="config-select value-input" data-key="${item.key}">${opts}</select>`;
  } else if (item.inputType === 'text') {
    valueHtml = `<input type="text" class="config-value-input value-input" data-key="${item.key}" value="${escapeHtml(String(state.value))}">`;
  } else if (item.inputType === 'toolbar-select') {
    // 如果支持 canDisable，增加一个"关闭"开关
    if (item.canDisable) {
      const isDisabled = state.disabled;
      const disableChecked = isDisabled ? '' : 'checked';
      valueHtml = `
        <div class="flex items-center gap-2 mb-1">
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" class="sr-only peer disable-toggle" data-key="${item.key}" ${disableChecked}>
            <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
          </label>
          <span class="text-xs ${isDisabled ? 'text-red-500 font-medium' : 'text-gray-500'}">
            ${isDisabled ? '<i class="fa-solid fa-ban mr-1"></i>已关闭（值为 false）' : '启用中（数组模式）'}
          </span>
        </div>
      `;
      if (!isDisabled) {
        valueHtml += renderToolbarChips(item.key, item.options, state.value);
      }
    } else {
      valueHtml = renderToolbarChips(item.key, item.options, state.value);
    }
  }

  // 子配置项
  let subHtml = '';
  if (state.subItems && state.subItems.length > 0 && state.enabled) {
    subHtml = '<div class="mt-2 pl-2 border-l-2 border-gray-100 space-y-1.5">';
    state.subItems.forEach((sub, idx) => {
      subHtml += renderSubItem(item.key, sub, idx);
    });
    subHtml += '</div>';
  }

  div.innerHTML = `
    <div class="item-info">
      <div class="item-name">
        ${item.name}
        <span class="tag tag-type">${item.canDisable ? item.type + ' | false' : item.type}</span>
        ${item.type === 'function' ? '<span class="tag tag-default">回调</span>' : ''}
      </div>
      <div class="item-path">${item.path}</div>
      <div class="item-desc">${item.description}</div>
      <div class="value-area">${valueHtml}</div>
      ${subHtml}
    </div>
    <div class="item-actions">
      <button class="action-btn source-btn" data-key="${item.key}" title="查看源码">
        <i class="fa-solid fa-code"></i>
      </button>
    </div>
  `;

  // 绑定事件
  setTimeout(() => {
    // canDisable 关闭开关
    const disableToggle = div.querySelector('.disable-toggle');
    if (disableToggle) {
      disableToggle.addEventListener('change', (e) => {
        configState[item.key].disabled = !e.target.checked;
        // 重新渲染该项
        const parent = div.parentElement;
        const newDiv = renderConfigItem(item);
        parent.replaceChild(newDiv, div);
        updatePreview();
        updateCodeOutput();
      });
    }

    // Toggle 开关
    const toggle = div.querySelector('.toggle-input');
    if (toggle) {
      toggle.addEventListener('change', (e) => {
        configState[item.key].enabled = e.target.checked;
        if (item.type === 'boolean') {
          configState[item.key].value = e.target.checked;
        }
        // 重新渲染该项以显示/隐藏子项
        const parent = div.parentElement;
        const newDiv = renderConfigItem(item);
        parent.replaceChild(newDiv, div);
        updatePreview();
        updateCodeOutput();
      });
    }

    // 值输入
    const valueInput = div.querySelector('.value-input');
    if (valueInput) {
      const eventType = valueInput.tagName === 'SELECT' ? 'change' : 'input';
      valueInput.addEventListener(eventType, (e) => {
        configState[item.key].value = e.target.value;
        updatePreview();
        updateCodeOutput();
      });
    }

    // 工具栏芯片（普通按钮toggle）
    div.querySelectorAll('.toolbar-chip:not(.separator-add-btn)').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.parentKey;
        if (configState[key] && configState[key].disabled) return;
        const val = chip.dataset.value;
        const arr = configState[key].value;
        // 普通按钮：toggle（移除所有该值的实例，或添加一个）
        const idx = arr.indexOf(val);
        if (idx > -1) {
          // 移除所有该值的实例
          configState[key].value = arr.filter(v => v !== val);
        } else {
          arr.push(val);
        }
        // 重新渲染该项
        const parent = div.parentElement;
        const newDiv = renderConfigItem(item);
        parent.replaceChild(newDiv, div);
        updatePreview();
        updateCodeOutput();
      });
    });

    // 分割线添加按钮
    div.querySelectorAll('.separator-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.parentKey;
        if (configState[key] && configState[key].disabled) return;
        configState[key].value.push('|');
        const parent = div.parentElement;
        const newDiv = renderConfigItem(item);
        parent.replaceChild(newDiv, div);
        updatePreview();
        updateCodeOutput();
      });
    });

    // 排序区：分割线删除按钮
    div.querySelectorAll('.sort-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = btn.dataset.parentKey;
        const idx = parseInt(btn.dataset.sortIdx);
        configState[key].value.splice(idx, 1);
        const parent = div.parentElement;
        const newDiv = renderConfigItem(item);
        parent.replaceChild(newDiv, div);
        updatePreview();
        updateCodeOutput();
      });
    });

    // 排序区：拖拽排序
    const sortArea = div.querySelector('.toolbar-sort-area');
    if (sortArea) {
      let dragSrcIdx = null;
      sortArea.querySelectorAll('.sort-item').forEach(sortItem => {
        sortItem.addEventListener('dragstart', (e) => {
          dragSrcIdx = parseInt(sortItem.dataset.sortIdx);
          sortItem.classList.add('dragging');
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', dragSrcIdx);
        });
        sortItem.addEventListener('dragend', () => {
          sortItem.classList.remove('dragging');
          sortArea.querySelectorAll('.sort-item').forEach(si => si.classList.remove('drag-over'));
        });
        sortItem.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          sortArea.querySelectorAll('.sort-item').forEach(si => si.classList.remove('drag-over'));
          sortItem.classList.add('drag-over');
        });
        sortItem.addEventListener('dragleave', () => {
          sortItem.classList.remove('drag-over');
        });
        sortItem.addEventListener('drop', (e) => {
          e.preventDefault();
          const targetIdx = parseInt(sortItem.dataset.sortIdx);
          const key = sortItem.dataset.parentKey;
          if (dragSrcIdx !== null && dragSrcIdx !== targetIdx) {
            const arr = configState[key].value;
            const [moved] = arr.splice(dragSrcIdx, 1);
            arr.splice(targetIdx, 0, moved);
            const parent = div.parentElement;
            const newDiv = renderConfigItem(item);
            parent.replaceChild(newDiv, div);
            updatePreview();
            updateCodeOutput();
          }
          dragSrcIdx = null;
        });
      });
    }

    // 子项事件
    div.querySelectorAll('.sub-input').forEach(input => {
      const subIdx = parseInt(input.dataset.subIdx);
      const eventType = input.tagName === 'SELECT' ? 'change' : 'input';
      input.addEventListener(eventType, (e) => {
        const subItems = configState[item.key].subItems;
        if (subItems && subItems[subIdx]) {
          if (input.type === 'checkbox') {
            subItems[subIdx].value = e.target.checked;
          } else if (input.type === 'number') {
            subItems[subIdx].value = parseInt(e.target.value) || 0;
          } else {
            subItems[subIdx].value = e.target.value;
          }
          updatePreview();
          updateCodeOutput();
        }
      });
    });

    // 查看源码按钮
    div.querySelector('.source-btn').addEventListener('click', () => {
      showSourceForKey(item.key);
    });
  }, 0);

  return div;
}

function renderSubItem(parentKey, sub, idx) {
  let inputHtml = '';
  if (sub.type === 'boolean') {
    inputHtml = `
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" class="sr-only peer sub-input" data-parent-key="${parentKey}" data-sub-idx="${idx}" ${sub.value ? 'checked' : ''}>
        <div class="w-7 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-red-400"></div>
      </label>`;
  } else if (sub.type === 'number') {
    inputHtml = `<input type="number" class="config-value-input sub-input" style="max-width:80px" data-parent-key="${parentKey}" data-sub-idx="${idx}" value="${sub.value}">`;
  } else if (sub.type === 'string') {
    inputHtml = `<input type="text" class="config-value-input sub-input" data-parent-key="${parentKey}" data-sub-idx="${idx}" value="${escapeHtml(String(sub.value))}">`;
  } else if (sub.type === 'select') {
    const opts = sub.options.map(o =>
      `<option value="${o}" ${sub.value === o ? 'selected' : ''}>${o}</option>`
    ).join('');
    inputHtml = `<select class="config-select sub-input" data-parent-key="${parentKey}" data-sub-idx="${idx}">${opts}</select>`;
  }

  return `
    <div class="flex items-center justify-between gap-2 py-0.5">
      <span class="text-xs text-gray-500">${sub.name}</span>
      ${inputHtml}
    </div>
  `;
}

// 工具栏按钮名称映射（英文key -> 中文名称）
const TOOLBAR_BUTTON_LABELS = {
  'bold': '加粗',
  'italic': '斜体',
  'strikethrough': '删除线',
  'sub': '下标',
  'sup': '上标',
  'header': '标题',
  'list': '列表',
  'ol': '有序列表',
  'ul': '无序列表',
  'checklist': '检查列表',
  'graph': '图形',
  'size': '尺寸',
  'h1': '一级标题',
  'h2': '二级标题',
  'h3': '三级标题',
  'color': '颜色',
  'quote': '引用',
  'quickTable': '快速表格',
  'togglePreview': '切换预览',
  'code': '代码',
  'inlineCode': '内联代码',
  'codeTheme': '代码主题',
  'export': '导出',
  'settings': '设置',
  'fullScreen': '全屏',
  'mobilePreview': '移动预览',
  'copy': '复制',
  'undo': '撤销',
  'redo': '重做',
  'underline': '下划线',
  'switchModel': '切换模型',
  'image': '图像',
  'audio': '音频',
  'video': '视频',
  'br': '换行',
  'hr': '水平线',
  'formula': '公式',
  'link': '链接',
  'table': '表格',
  'toc': '目录',
  'proTable': '表格图表',
  'pdf': 'PDF',
  'word': 'Word',
  'ruby': 'Ruby',
  'theme': '主题',
  'file': '文件',
  'panel': '信息面板',
  'align': '对齐',
  'detail': '手风琴',
  'drawIo': 'DrawIo',
  'wordCount': '字数统计',
  'cursorPosition': '光标位置',
  'changeLocale': '切换语言',
  'shortcutKey': '快捷键',
  'search': '搜索',
};

function getButtonLabel(val) {
  return TOOLBAR_BUTTON_LABELS[val] || val;
}

function renderToolbarChips(key, options, selectedValues) {
  // 候选区：普通按钮（不含分割线）
  const normalOptions = options.filter(opt => opt !== '|');
  const candidateChips = normalOptions.map(opt => {
    const active = selectedValues.includes(opt) ? 'active' : '';
    const label = getButtonLabel(opt);
    return `<span class="toolbar-chip ${active}" data-parent-key="${key}" data-value="${opt}" title="${opt}">${label}</span>`;
  }).join('');

  // 添加分割线按钮
  const addSeparatorBtn = `<span class="toolbar-chip separator-add-btn" data-parent-key="${key}" data-value="|" title="点击添加分割线">
    <i class="fa-solid fa-grip-lines-vertical" style="margin-right:2px;"></i> | 分割线
  </span>`;

  // 已选排序区：展示当前已选项的顺序，支持拖拽排序
  let sortArea = '';
  if (selectedValues.length > 0) {
    const sortItems = selectedValues.map((val, idx) => {
      const isSep = val === '|';
      const label = isSep ? '|' : getButtonLabel(val);
      const cls = isSep ? 'sort-item separator-item' : 'sort-item';
      return `<span class="${cls}" draggable="true" data-parent-key="${key}" data-sort-idx="${idx}" data-value="${val}" title="${isSep ? '分割线（拖拽排序 / 点击删除）' : val + '（拖拽排序）'}">
        <i class="fa-solid fa-grip-vertical sort-handle"></i>
        <span class="sort-label">${label}</span>
        ${isSep ? '<i class="fa-solid fa-xmark sort-remove" data-parent-key="' + key + '" data-sort-idx="' + idx + '"></i>' : ''}
      </span>`;
    }).join('');
    sortArea = `
      <div class="sort-area-label"><i class="fa-solid fa-arrow-down-short-wide" style="margin-right:4px;"></i>已选顺序（拖拽排序）：</div>
      <div class="toolbar-sort-area" data-parent-key="${key}">${sortItems}</div>
    `;
  }

  return `
    <div class="toolbar-items-grid">${candidateChips}${addSeparatorBtn}</div>
    ${sortArea}
  `;
}

// ==================== 生成配置对象 ====================
function generateConfig() {
  const config = {};

  CONFIG_CATEGORIES.forEach(cat => {
    cat.items.forEach(item => {
      const state = configState[item.key];
      if (!state.enabled && item.inputType === 'toggle' && item.type !== 'boolean') return;

      const path = item.path.split('.');
      let target = config;

      for (let i = 0; i < path.length - 1; i++) {
        if (!target[path[i]]) target[path[i]] = {};
        target = target[path[i]];
      }

      const lastKey = path[path.length - 1];

      if (item.type === 'boolean') {
        target[lastKey] = state.value;
      } else if (item.type === 'function') {
        if (state.enabled) {
          target[lastKey] = item.default;
        }
      } else if (item.type === 'array') {
        // 支持 canDisable：当 disabled 为 true 时输出 false 而非数组
        if (item.canDisable && state.disabled) {
          target[lastKey] = false;
        } else {
          target[lastKey] = [...state.value];
        }
      } else if (item.type === 'object' && state.subItems) {
        if (state.enabled) {
          const obj = {};
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

function generateConfigCode() {
  const config = generateConfig();
  return formatConfigObject(config, 0);
}

function formatConfigObject(obj, indent) {
  const spaces = '  '.repeat(indent);
  const innerSpaces = '  '.repeat(indent + 1);
  const lines = [];

  lines.push('{');
  const entries = Object.entries(obj);
  entries.forEach(([key, value], idx) => {
    const comma = idx < entries.length - 1 ? ',' : '';
    if (value === null || value === undefined) return;

    if (typeof value === 'string') {
      // 检查是否是函数字符串
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
        const items = value.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ');
        if (items.length > 60) {
          lines.push(`${innerSpaces}${key}: [`);
          value.forEach((v, i) => {
            const c = i < value.length - 1 ? ',' : '';
            lines.push(`${innerSpaces}  ${typeof v === 'string' ? `'${v}'` : v}${c}`);
          });
          lines.push(`${innerSpaces}]${comma}`);
        } else {
          lines.push(`${innerSpaces}${key}: [${items}]${comma}`);
        }
      }
    } else if (typeof value === 'object') {
      const formatted = formatConfigObject(value, indent + 1);
      lines.push(`${innerSpaces}${key}: ${formatted}${comma}`);
    }
  });
  lines.push(`${spaces}}`);

  return lines.join('\n');
}

// ==================== 更新预览 ====================
function updatePreview() {
  // 销毁旧实例
  if (cherryInstance) {
    try {
      cherryInstance.destroy();
    } catch (e) {
      // 忽略销毁错误
    }
    cherryInstance = null;
  }

  const editorEl = document.getElementById('cherry-editor');
  editorEl.innerHTML = '';

  const config = generateConfig();
  // 覆盖必要的配置
  config.id = 'cherry-editor';
  config.value = configState['value']?.value || '# Hello Cherry Markdown!';

  try {
    cherryInstance = new Cherry(config);
  } catch (e) {
    editorEl.innerHTML = `
      <div class="flex items-center justify-center h-full bg-red-50 text-red-500 p-8">
        <div class="text-center">
          <i class="fa-solid fa-triangle-exclamation text-4xl mb-4"></i>
          <p class="text-lg font-medium">预览加载失败</p>
          <p class="text-sm mt-2 text-red-400">${escapeHtml(e.message)}</p>
        </div>
      </div>
    `;
  }
}

function updateCodeOutput() {
  const code = `const config = ${generateConfigCode()};\n\nconst cherry = new Cherry(config);`;
  const codeEl = document.getElementById('code-output');
  if (codeEl) {
    codeEl.textContent = code;
    highlightCode(codeEl);
  }
}

// ==================== 简单语法高亮 ====================
function highlightCode(el) {
  let html = escapeHtml(el.textContent);
  // 关键字
  html = html.replace(/\b(const|let|var|new|true|false|function|return|if|else|export|import|default)\b/g,
    '<span class="source-keyword">$1</span>');
  // 字符串
  html = html.replace(/'([^']*)'/g, '<span class="source-string">\'$1\'</span>');
  // 数字
  html = html.replace(/\b(\d+)\b/g, '<span class="source-number">$1</span>');
  // 注释
  html = html.replace(/(\/\/.*)/g, '<span class="source-comment">$1</span>');
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="source-comment">$1</span>');
  // 属性名
  html = html.replace(/(\w+)(?=\s*:)/g, '<span class="source-property">$1</span>');

  el.innerHTML = html;
}

// ==================== 源码查看 ====================
function showSourceForKey(key) {
  // 切换到源码标签
  switchTab('source');

  const sourceContent = document.getElementById('source-content');
  const sourceCode = SOURCE_CODE_MAP[key];

  if (sourceCode) {
    sourceContent.innerHTML = `
      <div class="mb-3 flex items-center gap-2">
        <span class="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">${key}</span>
        <span class="text-gray-500 text-xs">配置项源码</span>
      </div>
      <pre class="text-sm leading-relaxed">${highlightSourceCode(sourceCode)}</pre>
      <div class="mt-4 pt-4 border-t border-gray-700">
        <div class="text-xs text-gray-500 mb-2">完整配置文件参考：</div>
        <a href="https://github.com/Tencent/cherry-markdown/blob/dev/packages/cherry-markdown/src/Cherry.config.js"
           target="_blank" class="text-xs text-red-400 hover:text-red-300 transition-colors">
          <i class="fa-brands fa-github mr-1"></i>
          Cherry.config.js on GitHub →
        </a>
      </div>
    `;
  } else {
    sourceContent.innerHTML = `
      <div class="text-center py-12 text-gray-500">
        <i class="fa-solid fa-file-code text-4xl mb-4 text-gray-600"></i>
        <p>暂无该配置项的源码片段</p>
        <a href="https://github.com/Tencent/cherry-markdown/blob/dev/packages/cherry-markdown/src/Cherry.config.js"
           target="_blank" class="text-sm text-red-400 hover:text-red-300 mt-2 inline-block">
          查看完整源码 →
        </a>
      </div>
    `;
  }
}

function highlightSourceCode(code) {
  let html = escapeHtml(code);
  html = html.replace(/\b(const|let|var|new|true|false|function|return|if|else|export|import|default)\b/g,
    '<span class="source-keyword">$1</span>');
  html = html.replace(/'([^']*)'/g, '<span class="source-string">\'$1\'</span>');
  html = html.replace(/\b(\d+)\b/g, '<span class="source-number">$1</span>');
  html = html.replace(/(\/\/.*)/g, '<span class="source-comment">$1</span>');
  html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="source-comment">$1</span>');
  html = html.replace(/(\w+)(?=\s*:)/g, '<span class="source-property">$1</span>');
  return html;
}

// ==================== 标签页切换 ====================
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));

  document.getElementById(`tab-${tabName}`).classList.add('active');
  const panel = document.getElementById(`panel-${tabName}`);
  panel.classList.remove('hidden');
  panel.classList.add('active');

  if (tabName === 'code') {
    updateCodeOutput();
  } else if (tabName === 'source') {
    renderFullSource();
  }
}

function renderFullSource() {
  const sourceContent = document.getElementById('source-content');
  if (sourceContent.children.length === 0 || sourceContent.querySelector('.full-source')) {
    sourceContent.innerHTML = `
      <div class="full-source">
        <pre class="text-sm leading-relaxed">${highlightSourceCode(CHERRY_CONFIG_SOURCE)}</pre>
      </div>
    `;
  }
}

// ==================== 搜索功能 ====================
function initSearch() {
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    document.querySelectorAll('.config-item').forEach(item => {
      const text = item.dataset.searchText || '';
      if (!query || text.includes(query)) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });

    // 自动展开包含匹配项的分类
    if (query) {
      document.querySelectorAll('.config-category').forEach(cat => {
        const visibleItems = cat.querySelectorAll('.config-item:not([style*="display: none"])');
        if (visibleItems.length > 0) {
          cat.classList.add('open');
        } else {
          cat.classList.remove('open');
        }
      });
    }
  });
}

// ==================== 预设配置 ====================
function applyPreset(presetName) {
  const preset = PRESETS[presetName];
  if (!preset) return;

  // 先重置
  initConfigState();

  // 应用预设覆盖
  Object.entries(preset.overrides).forEach(([key, value]) => {
    if (configState[key]) {
      // 对于 canDisable 的配置项，false 表示关闭该功能
      if (configState[key].canDisable && value === false) {
        configState[key].disabled = true;
      } else if (typeof value === 'boolean') {
        configState[key].enabled = value;
        configState[key].value = value;
        if (configState[key].canDisable) {
          configState[key].disabled = false;
        }
      } else {
        configState[key].value = JSON.parse(JSON.stringify(value));
        if (configState[key].canDisable) {
          configState[key].disabled = false;
        }
      }
    }
  });

  renderConfigPanel();
  updatePreview();
  updateCodeOutput();
  showToast(`已应用「${preset.name}」预设`);
}

// ==================== 导出功能 ====================
function showExportModal() {
  const modal = document.getElementById('export-modal');
  modal.classList.remove('hidden');
  const code = `const config = ${generateConfigCode()};\n\nconst cherry = new Cherry(config);`;
  const modalCode = document.getElementById('modal-code');
  modalCode.textContent = code;
  highlightCode(modalCode);
}

function hideExportModal() {
  document.getElementById('export-modal').classList.add('hidden');
}

// ==================== 复制功能 ====================
function copyCode(sourceEl) {
  const text = sourceEl?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    showToast('代码已复制到剪贴板！');
  }).catch(() => {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('代码已复制到剪贴板！');
  });
}

// ==================== Toast 提示 ====================
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<i class="fa-solid fa-check-circle mr-2 text-green-400"></i>${message}`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ==================== 工具函数 ====================
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==================== 初始化 ====================
function init() {
  initConfigState();
  renderConfigPanel();
  initSearch();

  // 标签页切换
  document.getElementById('tab-preview').addEventListener('click', () => switchTab('preview'));
  document.getElementById('tab-code').addEventListener('click', () => switchTab('code'));
  document.getElementById('tab-source').addEventListener('click', () => switchTab('source'));

  // 预设按钮
  document.getElementById('preset-default').addEventListener('click', () => applyPreset('default'));
  document.getElementById('preset-simple').addEventListener('click', () => applyPreset('simple'));
  document.getElementById('preset-full').addEventListener('click', () => applyPreset('full'));
  document.getElementById('preset-preview').addEventListener('click', () => applyPreset('preview'));

  // 重置按钮
  document.getElementById('btn-reset').addEventListener('click', () => {
    initConfigState();
    renderConfigPanel();
    updatePreview();
    updateCodeOutput();
    showToast('配置已重置为默认值');
  });

  // 导出按钮
  document.getElementById('btn-export').addEventListener('click', showExportModal);
  document.getElementById('modal-close').addEventListener('click', hideExportModal);
  document.getElementById('modal-overlay').addEventListener('click', hideExportModal);

  // 复制按钮
  document.getElementById('btn-copy').addEventListener('click', () => {
    copyCode(document.getElementById('code-output'));
  });
  document.getElementById('btn-modal-copy').addEventListener('click', () => {
    copyCode(document.getElementById('modal-code'));
  });

  // 延迟初始化编辑器
  setTimeout(() => {
    updatePreview();
    updateCodeOutput();
  }, 500);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
